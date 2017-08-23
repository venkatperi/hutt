/* eslint-disable no-nested-ternary */
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

const _ = require( 'lodash' );
const arrayp = require( 'arrayp' );
const LOG = require( '../util/LOG' )( 'hutt:SourceSets' );

class SourceSet {
  constructor( opts = {} ) {
    this._name = opts.name;
    this._parent = opts.parent;
    this._includes = [];
    this._excludes = [];
    this._entries = [];
    if ( opts.include ) {
      this.include( opts.include );
    }
    if ( opts.exclude ) {
      this.exclude( opts.exclude );
    }
    LOG.d( `ctor sourceSet(${this.name})` )
  }

  get allSource() {
    return arrayp.series( [
      this.project.glob( this._includes, this._excludes ),
      this._entries.map( x => x.allSource ),
    ] )
      .then( _.flatten )
  }

  get entries() {
    return this._entries;
  }

  get excludes() {
    return this._excludes;
  }

  set excludes( value ) {
    this._excludes = value;
  }

  get includes() {
    return this._includes;
  }

  set includes( value ) {
    this._includes = value;
  }

  get name() {
    return this._name;
  }

  get parent() {
    return this._parent;
  }

  get project() {
    return !this._parent ? this : this._parent.project
  }

  add( sourceSet ) {
    this._entries.push( sourceSet )
    Object.defineProperty( this, sourceSet.name, {
      configurable: true,
      get: () => sourceSet,
    } );
  }

  exclude( ...args ) {
    this._excludes = _.flatten( this._excludes.concat( args ) );
  }

  include( ...args ) {
    this._includes = _.flatten( this._includes.concat( args ) );
  }

  toString() {
    return `SourceSet(${this._name}) [${this._entries.map( String ).join( ', ' )}]`
  }
}

module.exports = SourceSet;
