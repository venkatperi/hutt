/* eslint-disable no-nested-ternary,no-plusplus,consistent-return,class-methods-use-this */
// Copyright 2017, Venkat Peri.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

const { EventEmitter } = require( 'events' );
const EventBus = require( 'eventbusjs' );
const phases = require( './phases' );
const clock = require( './clock' );
const _ = require( 'lodash' );
const _LOG = require( '../util/LOG' );
const assert = require( 'assert' );
const R = require( 'ramda' );
const { notEmpty } = require( '../util/Rhelpers' )
const arrayp = require( 'arrayp' );

const LOG = _LOG( 'hutt:Base' );

const levelIs = l => R.propSatisfies( x => x === l, 'level' )
const _hasErrors = R.any( R.propSatisfies( R.equals( true ), 'hasErrors' ) )


function nopp() {
  return Promise.resolve()
}

class Base extends EventEmitter {
  constructor( name, opts ) {
    super();
    if ( typeof name === 'object' ) {
      opts = name;
      name = '';
    }
    opts = opts || {};
    assert( opts.prefix, 'prefix must be specified' );

    this._name = name || opts.prefix;
    this._opts = opts
    this._prefix = opts.prefix;
    this._phase = null;
    this._phaseId = -1;
    this._children = opts.children || [];
    this._logger = _LOG( this.shortPath || this.name )
    this._parent = null;
    this._timers = {};
    this._messages = [];
    this._dbItem = null;
    this._dbModel = null;
    this._enabled = true;

    if ( opts.parent ) {
      opts.parent.addChild( this );
    }

    phases.forEach( ( p ) => {
      this[`_${p}`] = this._doPhase.bind( this, p );
      this[`${p}`] = this.doPhase.bind( this, p );
    } )

    LOG.verbose( `ctor ${this.longName}` )
  }

  get children() {
    return this._children;
  }

  get dbItem() {
    return this._dbItem;
  }

  get dbModel() {
    return this._dbModel;
  }

  get enabled() {
    return this._enabled;
  }

  set enabled( value ) {
    this._enabled = value;
  }

  get errorMessages() {
    return this.findMessagesByLevel( 'error' )
  }

  get warnMessages() {
    return this.findMessagesByLevel( 'warn' )
  }

  get hasErrors() {
    return notEmpty( this.errorMessages ) ||
      _hasErrors( this._children )
  }

  get infoMessages() {
    return this.findMessagesByLevel( 'info' )
  }

  get isRoot() {
    return !this.parent
  }

  get log() {
    return this._logger;
  }

  get longName() {
    return `${this.prefix}:${this.name}`
  }

  get messages() {
    return this._messages;
  }

  get name() {
    return this._name;
  }

  get opts() {
    return this._opts;
  }

  get parent() {
    return this._parent;
  }

  set parent( value ) {
    this._parent = value;
  }

  get phase() {
    return this._phase
    // ? this._phase
    // : this.parent
    //   ? this.parent.phase
    //   : null;
  }

  get phaseId() {
    return this._phaseId;
  }

  get prefix() {
    return this._prefix;
  }

  get project() {
    return this.getParentOfType( 'project' )
  }

  get root() {
    return !this.parent ? this : this.parent.root;
  }

  get timers() {
    return this._timers;
  }

  _doPhase( ...args ) {
    const phase = this._phase;
    LOG.verbose( `${phase} ${this.longName}` );

    const doneName = `${phase}Done`;
    assert( !this[doneName], 'phase already completed' )
    const done = () => {
      this[doneName] = true;
      this.emit( `${phase}:after` )
    }

    try {
      this.emit( `${phase}:before` )
      return this[`actually${_.upperFirst( phase )}`]( ...args )
        .catch( err => this.message( { level: 'error', error: err } ) )
        .then( done );
    } catch ( err ) {
      this.message( { level: 'error', error: err } )
      done();
    }
  }

  actuallyConfigure() {
    return Promise.resolve()
  }

  actuallyDestroy() {
    return Promise.resolve()
  }

  actuallyInitialize() {
    return Promise.resolve()
  }

  actuallyRun() {
    return Promise.resolve()
  }

  addChild( item ) {
    this._children.push( item );
    item.parent = this;
  }

  doPhase( ...args ) {
    return this.visitp( {
      afterChildren: () => this._doPhase( ...args ),
    } )
  }

  emit( name, opts = {} ) {
    const parts = name.split( ':' );
    let prefix = this.prefix;
    let type = null;

    switch ( parts.length ) {
      case 3:
        [prefix, name, type] = parts;
        break;
      case 2:
        [name, type] = parts;
        break;
      case 1:
        name = parts[0];
        break;
      default:
        throw new Error( `${name}: bad event` )
    }

    switch ( type ) {
      case 'before':
        this._timers[name] = this._timers[name] || clock();
        break;

      case 'after':
        opts = _.extend( opts, {
          time: this._timers[name],
          message: opts.message || this.messages[name],
        } )
        break;

      default:
        break;
    }

    const eventName = [name]
    if ( type ) {
      eventName.push( type );
    }

    super.emit( eventName.join( ':' ), opts );

    eventName.unshift( prefix );
    EventBus.dispatch( eventName.join( ':' ), this, opts )

    LOG.v( '%s - %s ', this.shortPath, eventName.join( ':' ) );
  }

  findMessagesByLevel( level ) {
    return R.filter( levelIs( level ) )( this.messages )
  }

  getParentOfType( type ) {
    return !this.parent
      ? null
      : this.parent.prefix === type
        ? this.parent
        : this.parent.getParentOfType( type );
  }

  message( ...args ) {
    R.pipe(
      R.flatten,
      R.forEach( ( x ) => {
        assert( x.level, 'message needs level' )
        this._messages.push( x )
        this.emit( `${this.phase}:message`, x )
      } ) )( args )
  }

  nextPhase() {
    assert( this.phaseId < phases.length - 1, 'No more phases!' )
    this._phaseId++
    this._phase = phases[this._phaseId];
    return this.doPhase()
  }

  visitp( visitor ) {
    return arrayp.chain( [
      (visitor.beforeChildren || nopp)( this ),
      ...R.map( c => c.visitp( visitor ), this._children ),
      ( visitor.afterChildren || nopp)( this ),
    ] )
  }
}

module.exports = Base;
