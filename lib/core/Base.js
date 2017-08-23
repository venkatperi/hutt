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
    this._name = name;
    this._opts = opts
    this._prefix = opts.prefix;
    this._phase = null;
    // this._logger = _LOG()
    phases.forEach( ( p ) => {
      this[p] = () => this.doPhase( p );
      ['before', 'after'].forEach( w =>
        this.on( `${p}:${w}`, () =>
          LOG.debug( `${this.prefix}:${p}:${w} ${this.name}` ) ) )
    } )
    LOG.debug( `ctor ${this.longName}` )
  }

  get longName() {
    return `${this.prefix}:${this.name}`
  }

  get name() {
    return this._name;
  }

  get opts() {
    return this._opts;
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

  doPhase( phase ) {
    LOG.i(`${phase} ${this.longName}`)
    if ( this[`${phase}Done`] ) {
      return Promise.resolve();
    }
    const time = hirestime();
    this.emit( `${phase}:before` )
    this[`${phase}Done`] = true;
    this.phase = phase;
    return this[`actually${_.upperFirst( phase )}`]()
      .then( ( res ) => {
        this.emit( `${phase}:after`, {
          time: time(),
          result: res,
        } )
        return res;
      } )
      .catch( ( err ) => {
        this.emit( `${phase}:error`, err );
        throw err;
      } );
  }

  emit( name, ...args ) {
    const busName = name.indexOf( ':' ) >= 0 ? `${this.prefix}:${name}` : name;
    super.emit( name, ...args );
    EventBus.dispatch( busName, this, ...args )
  }
}

module.exports = Base;
