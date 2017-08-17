/* eslint-disable no-nested-ternary,class-methods-use-this,no-console */
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
const FileCache = require( './FileCache' );
const arrayp = require( 'arrayp' );

class Task extends EventEmitter {
  constructor( name, opts = {} ) {
    super();
    this._project = null;
    this._name = name;
    this._deps = opts.dependsOn;
    this._actions = [this.action.bind( this )]
    this._before = []
    this._after = []
    delete opts.dependsOn;
    if ( opts.inputs ) {
      this._cache = new FileCache( name, opts.inputs );
    }
    this._opts = Object.assign( {}, opts );
    this._configured = false;
  }

  get actions() {
    return this._actions;
  }

  get configured() {
    return this._configured;
  }

  get dependencies() {
    return this._deps;
  }

  get name() {
    return this._name;
  }

  get project() {
    return this._project;
  }

  set project( value ) {
    this._project = value;
  }

  _configure() {
    this._project.gulp.task( this.name, this._deps, this._run.bind( this ) )
    this._configured = true;
  }

  _run() {
    if ( !this._cache || this._cache.changed.length ) {
      return arrayp.chain( this._before.concat( this._actions, this._after ) );
    }

    return Promise.resolve();
  }

  action() {
    console.log( 'action' )
  }

  configure() {
    if ( !this._configured ) this._configure();
  }

  do$( fn, pos ) {
    if ( typeof fn !== 'function' ) {
      return this.emit( 'error', `action is not a function in task ${this.name}` )
    }
    const arr = pos === 'before' ? this._before : pos === 'after' ? this._after : this._actions;
    return arr.push( fn );
  }

  doFirst( fn ) {
    this.do$( fn, 'before' )
  }

  doLast( fn ) {
    this.do$( fn, 'after' )
  }
}

module.exports = Task;
