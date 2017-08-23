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

const FileCache = require( '../FileCache' );
const arrayp = require( 'arrayp' );
const hirestime = require( 'hirestime' );
const Base = require( './Base' );
const assert = require( 'assert' );
const LOG = require( '../util/LOG' )( 'hutt:Task' );

class Task extends Base {
  constructor( name, opts = {} ) {
    assert( name, 'Task needs a name' )
    opts.prefix = 'task';
    super( name, opts );
    this._project = opts.project
    this._dependencies = opts.dependsOn || []
    this._actions = [this.action.bind( this )]
    this._before = []
    this._after = []
    this._message = ''
  }

  get actions() {
    return this._actions;
  }

  get after() {
    return this._after;
  }

  get before() {
    return this._before;
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

  get dependencies() {
    return this._dependencies;
  }

  get fileCacheDir() {
    return this.project.fileCacheDir;
  }

  get message() {
    return this._message;
  }

  set message( value ) {
    this._message = value;
  }

  get path() {
    return `${this.project.path}${this.shortPath}`
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

  get shortPath() {
    return `:${this.name}`
  }

  _checkInputs() {
    return arrayp.chain( [
      this.inputs(),
      ( inputs ) => {
        if ( inputs ) {
          this._inputsCache = new FileCache( {
            name: `${this._name}-inputs`,
            files: inputs,
            cachePath: this.fileCacheDir,
          } );
        }
      },
    ] );
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

  action() {
    return Promise.resolve();
  }

  actuallyConfigure() {
    this._project.orchestrator.task( this.name,
      this._dependencies, this.run.bind( this ) )
    return arrayp.chain( [
      this._checkInputs(),
      // this._checkOutputs();
    ] );
  }

  actuallyInitialize() {
    return Promise.resolve();
  }

  actuallyRun() {
    return arrayp.chain( this._before.concat(
      this._actions, this._after ) )
      .catch( ( err ) => {
        this.emit( 'run:error', err );
        throw err;
      } )
  }

  dependsOn( ...args ) {
    this._dependencies = this._dependencies.concat( args )
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

  inputs() {
    return Promise.resolve( [] );
  }
}

module.exports = Task;
