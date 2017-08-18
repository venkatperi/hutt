/* eslint-disable import/no-extraneous-dependencies,global-require */
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
const Task = require( './Task' );
const SourceSets = require( './SourceSets' );
const R = require( 'ramda' );
const path = require( 'path' );
const Orchestrator = require( 'orchestrator' );
const hirestime = require( 'hirestime' );
const EventBus = require( 'eventbusjs' );

function nop() {
}

class Project extends EventEmitter {
  constructor( opts = {} ) {
    super();
    this._name = opts.name;
    this._orchestrator = new Orchestrator();
    this._tasks = {};
    this._sourceSets = new SourceSets( { parent: this } );
    this._configured = false;
    this._projectDir = opts.projectDir || process.cwd();
    this._buildDir = opts.buildDir || 'build';
    this._huttDir = '.hutt';
    this._fileCacheDir = 'filecache';
  }

  get buildDir() {
    return path.resolve( this._projectDir, this._buildDir );
  }

  set buildDir( value ) {
    this._buildDir = value;
  }

  get configured() {
    return this._configured;
  }

  get fileCacheDir() {
    return path.join( this.huttDir, this._fileCacheDir );
  }

  get huttDir() {
    return path.resolve( this._projectDir, this._huttDir );
  }

  get name() {
    return this._name;
  }

  set name( value ) {
    this._name = value;
  }

  get orchestrator() {
    return this._orchestrator;
  }

  get path() {
    return `:${this.name}`
  }

  get projectDir() {
    return this._projectDir;
  }

  set projectDir( value ) {
    this._projectDir = value;
  }

  get sourceSets() {
    return this._sourceSets;
  }

  get sourceSets$() {
    return this._sourceSets;
  }

  get tasks() {
    return this._tasks;
  }

  _addTask( task ) {
    this._tasks[task.name] = task;
    task.project = this;
    this.emit( 'task', task );
  }

  _configure() {
    const time = hirestime();
    EventBus.dispatch( 'project:configure:before', this )
    R.pipe( R.values, R.forEach( t => t.configure() ) )( this._tasks );
    this._configured = true;
    EventBus.dispatch( 'project:configure:after', this, time() )
  }

  configure() {
    if ( !this._configured ) this._configure();
  }

  run( name = 'default', cb ) {
    this.configure();
    const time = hirestime();
    EventBus.dispatch( 'project:run:before', this )
    this._orchestrator.start( name, ( err, res ) => {
      EventBus.dispatch( 'project:run:after', this, time() )
      cb( err, res );
    } );
  }

  task( name, opts, fn ) {
    if ( typeof opts === 'function' ) {
      [opts, fn] = [null, opts];
    }

    fn = fn || nop;
    opts = opts || {};

    if ( this._tasks[name] && (!opts || !opts.overwrite) ) {
      return this.emit( 'error', new Error( `Cannot add task '${name}' as a task with that name already exists.` ) )
    }

    const t = new Task( this, name, opts );
    fn( t );
    return this._addTask( t );
  }
}

module.exports = Project;
