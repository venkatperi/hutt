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
const hirestime = require( 'hirestime' );
const _ = require( 'lodash' );
const _LOG = require( '../util/LOG' );
const assert = require( 'assert' );

const LOG = _LOG( 'hutt:Base' );

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
    this._children = opts.children || [];
    this._errors = [];
    this._logger = _LOG( this.shortPath || this.name )
    this._parent = null;
    this._timers = {};
    this._messages = {};
    this._dbItem = null;
    this._dbModel = null;

    if ( opts.parent ) {
      opts.parent.addChild( this );
    }

    phases.forEach( ( p ) => {
      this[p] = this.doPhase.bind( this, p );
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

  get errors() {
    return this._errors;
  }

  get hasErrors() {
    return this._errors.length ||
      _.some( this._children, x => x.hasErrors )
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
    return this._phase;
  }

  set phase( value ) {
    this._phase = value;
  }

  get prefix() {
    return this._prefix;
  }

  get root() {
    return !this.parent ? this : this.parent.root;
  }

  get timers() {
    return this._timers;
  }

  _updateProperty( name, value ) {
    if ( this[name] !== value ) {
      const old = this[name];
      this[name] = value;
      this.emit( 'propertyChanged', name, value, old );
    }
  }

  actuallyConfigure() {
    throw new Error( 'not implemented' )
  }

  actuallyInitialize() {
    throw new Error( 'not implemented' )
  }

  actuallyRun() {
    throw new Error( 'not implemented' )
  }

  addChild( item ) {
    this._children.push( item );
    item.parent = this;
  }

  addProperties( props ) {
    _.forOwn( props, ( v, k ) => {
      this.addProperty( k, v );
    } )
  }

  addProperty( name, opts = {} ) {
    LOG.debug( `addProperty ${this.prefix}(${this.name}) - ${name}` )
    const propName = `_${name}`;
    let spec = {
      get: opts.get || (() => this[propName]),
      enumerable: !!opts.enumerable,
    }
    if ( opts.writable ) {
      spec = _.extend( spec, {
        // writable: true,
        set: value => this._updateProperty( propName, value ),
      } )
    }
    this[propName] = opts.initial;
    return Object.defineProperty( this, name, spec )
  }

  doPhase( phase, ...args ) {
    LOG.verbose( `${phase} ${this.longName}` )
    const doneName = `${phase}Done`;

    if ( this[doneName] ) {
      return Promise.resolve();
    }

    const method = `actually${_.upperFirst( phase )}`;
    this[doneName] = true;
    this.emit( `${phase}:before` )

    return this[method]( ...args )
      .then( ( res ) => {
        this.emit( `${phase}:after`, {
          result: res,
          message: this.message,
        } )
        this[doneName] = true;
        return res;
      } )
      .catch( ( err ) => {
        this.emit( `${phase}:error`, err );
        this._errors.push( err );
        if ( !this.opts.continueOnError ) {
          throw err;
        }
      } );
  }

  emit( name, ...args ) {
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
        if ( !this._timers[name] ) {
          this._timers[name] = hirestime();
        }
        break;

      case 'after':
        args[0] = args[0] || {};
        args[0].time = this._timers[name]();
        args[0].message = args[0].message || this.messages[name] || '';
        delete this._timers[name];
        break;

      default:
        break;
    }

    const eventName = [name]
    if ( type ) {
      eventName.push( type );
    }

    super.emit( eventName.join( ':' ), ...args );

    eventName.unshift( prefix );
    EventBus.dispatch( eventName.join( ':' ), this, ...args )

    LOG.v( '%s - %s ', this.shortPath, eventName.join( ':' ) );
  }
}

module.exports = Base;
