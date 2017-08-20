/* eslint-disable import/no-extraneous-dependencies,global-require,
   import/no-dynamic-require,class-methods-use-this */
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
// THE SOFTWAoE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

const { EventEmitter } = require( 'events' );
const path = require( 'path' );
const Orchestrator = require( 'orchestrator' );
const hirestime = require( 'hirestime' );
const EventBus = require( 'eventbusjs' );
const _ = require( 'lodash' );
const resolve = require( 'resolve' ).sync;

const Task = require( './Task' );
const SourceSets = require( './SourceSets' );
const ExtensionContainer = require( './ExtensionContainer' );
const SpawnTaskPlugin = require( '../plugins/spawn/SpawnTaskPlugin' )
const SourceSetsPlugin = require( '../plugins/sourceSets/SourceSetsPlugin' )
const JavaScriptSourceSetsPlugin = require( '../plugins/javascriptSourceSet/JavaScriptSourceSetPlugin' )
const MultiGlob = require( '../util/MultiGlob' )

class Project extends EventEmitter {
  constructor( opts = {} ) {
    super();
    this._tasks = {};
    this._configured = false;
    this._plugins = {};
    this._initialized = false;
    this._result = false;
    this._orchestrator = new Orchestrator();
    this._sourceSets = new SourceSets( { parent: this } );
    this._projectDir = opts.projectDir || process.cwd();
    this._buildDir = opts.buildDir || 'build';
    this._huttDir = '.hutt';
    this._fileCacheDir = 'filecache';
    this._name = opts.name || path.basename( this.projectDir )
    this._glob = new MultiGlob( {
      cwd: this.projectDir,
    } )

    this.on( 'register', ( bldr ) => {
      if ( bldr.name === 'project' ) {
        this._projectBuilder = bldr;
      }
    } )

    this._extensions = new ExtensionContainer( { project: this } )
    this._extensions.on( 'extension', this._onExtension.bind( this ) )

    this._defaultPlugins();
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

  get extensions() {
    return this._extensions;
  }

  get fileCacheDir() {
    return path.join( this.huttDir, this._fileCacheDir );
  }

  get huttDir() {
    return path.resolve( this._projectDir, this._huttDir );
  }

  get initialized() {
    return this._initialized;
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

  get proj() {
    return this;
  }

  get projectDir() {
    return this._projectDir;
  }

  set projectDir( value ) {
    this._projectDir = value;
    this._glob.cwd = value;
  }

  get result() {
    return this._result;
  }

  set result( value ) {
    this._result = value;
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
    if ( this._tasks[task.name] ) {
      return this._emit( 'error', `Task with name ${task.name} already exists` )
    }
    this._tasks[task.name] = task;
    task.project = this;
    this._emit( 'project:task', task );
    return task;
  }

  _configure() {
    const time = hirestime();
    this._emit( 'project:configure:before' )
    Object.values( this._tasks ).forEach( t => t.configure() );
    this._configured = true;
    this._emit( 'project:configure:after', time() )
  }

  _defaultPlugins() {
    this._sourceSetsPlugin = new SourceSetsPlugin( {
      sourceSets: this.sourceSets,
      project: this,
    } );
    this.addPlugin( this._sourceSetsPlugin );
    this.addPlugin( new JavaScriptSourceSetsPlugin( {
      project: this,
    } ) );
    this.addPlugin( new SpawnTaskPlugin( {
      project: this,
    } ) );
  }

  _emit( name, ...args ) {
    this.emit( name, ...args );
    EventBus.dispatch( name, this, ...args )
  }

  _initialize() {
    Object.values( this._tasks ).forEach( t => t.initialize() );
  }

  _onExtension( n, ext ) {
    if ( this[n] ) {
      throw new Error( `${n} already exists on project` )
    }
    this[n] = ( ...args ) => {
      if ( args.length === 0 ) return ext;
      return _.extend( ext, args[0] );
    }
    this._projectBuilder.registerMethodNames( [n] )
  }

  /**
   * Add the supplied plugin the builder's list of plugins
   *
   * @param plugin {PluginBase} the plugin to add
   */
  addPlugin( plugin ) {
    if ( typeof plugin === 'string' ) {
      const PluginKlass = require( resolve( `hutt-plugin-${plugin}`, {
        basedir: this.projectDir,
      } ) )
      plugin = new PluginKlass( {
        project: this,
      } )
    }
    this._plugins[plugin.name] = plugin;
    plugin.onPluginAdded( this );
  }

  addTask( task ) {
    if ( typeof task === 'string' ) {
      task = new Task( task, { project: this } );
    }
    return this._addTask( task )
  }

  apply( opts = {} ) {
    if ( opts.plugins ) {
      if ( !Array.isArray( opts.plugins ) ) {
        opts.plugins = [opts.plugins];
      }
      opts.plugins.forEach( x => this.addPlugin( x ) );
    }
  }

  configure() {
    if ( !this._configured ) this._configure();
  }

  eachPlugin( f ) {
    Object.values( this._plugins ).forEach( f )
  }

  getTask( name ) {
    return this._tasks[name];
  }

  glob( includes, excludes ) {
    return this._glob.search( includes, excludes )
  }

  hasPlugin( name ) {
    return !!this._plugins[name]
  }

  hasTask( name ) {
    return !!this._tasks[name]
  }

  initialize() {
    if ( !this._initialized ) {
      this._initialize();
      this._emit( 'project:initialize:after', this._initTimer() )
      this._initialized = true;
    }
  }

  registerObjects() {
    this.eachPlugin( p => p.registerObjects() );
  }

  // eslint-disable-next-line no-unused-vars
  removePlugin( plugin ) {
    throw new Error( 'not implemented' )
  }

  run( name = 'default', cb ) {
    this.initialize();
    this.configure();
    const time = hirestime();
    this._emit( 'project:run:before' )
    this._orchestrator.start( name, ( err, res ) => {
      this._emit( 'project:run:after', time() )
      cb( err, res );
    } );
  }

  unregisterObjects() {
    this.eachPlugin( p => p.unregisterObjects() );
  }
}

module.exports = Project;
