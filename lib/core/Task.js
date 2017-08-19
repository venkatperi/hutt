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
const FileCache = require( '../FileCache' );
const arrayp = require( 'arrayp' );
const hirestime = require( 'hirestime' );
const EventBus = require( 'eventbusjs' );

class Task extends EventEmitter {
  constructor( name, opts = {} ) {
    super();
    this._project = null;
    this._name = name;
    this._dependsOn = opts.dependsOn || [];
    this._actions = [this.action.bind( this )]
    this._before = []
    this._after = []
    delete opts.dependsOn;
    this._opts = Object.assign( {}, opts );
    this._configured = false;
  }

  get actions() {
    return this._actions;
  }

  get buildDir() {
    return this.project.buildDir;
  }

  get changedInputs() {
    return this._inputsCache.changed
  }

  get changedOutputs() {
    return this._outputsCache.changed
  }

  get configured() {
    return this._configured;
  }

  get dependsOn() {
    return this._dependsOn;
  }

  get fileCacheDir() {
    return this.project.fileCacheDir;
  }

  get inputs() {
    return this._inputs;
  }

  get name() {
    return this._name;
  }

  get opts() {
    return this._opts;
  }

  get path() {
    return `${this.project.path}:${this.name}`
  }

  get project() {
    return this._project;
  }

  set project( value ) {
    this._project = value;
  }

  get projectDir() {
    return this.project.projectDir;
  }

  get skip() {
    return this._cache && this._cache.changed.length
  }

  _checkInputs() {
    if ( this.inputs ) {
      this._inputsCache = new FileCache( {
        name: `${this._name}-inputs`,
        files: this.inputs,
        cachePath: this.fileCacheDir,
      } );
    }
  }

  _checkOutputs() {
    if ( this.outputs ) {
      this._outputsCache = new FileCache( {
        name: `${this._name}-outputs`,
        files: this.outputs,
        cachePath: this.fileCacheDir,
      } );
    }
  }

  _configure() {
    this._project.orchestrator.task( this.name,
      this._dependsOn, this._run.bind( this ) )
    this._checkInputs();
    this._checkOutputs();
  }

  _initialize() {
  }

  _run() {
    const time = hirestime();
    EventBus.dispatch( 'task:run:before', this )
    return arrayp.chain(
      this._before.concat( this._actions, this._after ) )
      .then( ( res ) => {
        EventBus.dispatch( 'task:run:after', this, time() )
        return res;
      } )
      .catch( ( err ) => {
        EventBus.dispatch( 'task:run:after', this, time() )
        throw err;
      } )
  }

  action() {
  }

  configure() {
    if ( !this._configured ) {
      const time = hirestime();
      EventBus.dispatch( 'task:configure:before', this )
      this._configure();
      EventBus.dispatch( 'task:configure:after', this, time() )
      this._configured = true;
    }
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

  initialize() {
    if ( !this._initialized ) {
      const time = hirestime();
      EventBus.dispatch( 'task:initialize:before', this )
      this._initialize();
      EventBus.dispatch( 'task:initialize:after', this, time() )
      this._initialized = true;
    }
  }
}

module.exports = Task;