/* eslint-disable no-return-assign,import/no-dynamic-require,
global-require,class-methods-use-this */
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

const path = require( 'path' );
const Orchestrator = require( 'orchestrator' );
const _ = require( 'lodash' );
const Resolve = require( 'resolve' ).sync;
const arrayp = require( 'arrayp' );

const Base = require( './Base' );
const Task = require( './Task' );
const SourceSets = require( './SourceSets' );
const ExtensionContainer = require( './ExtensionContainer' );
const SpawnTaskPlugin = require( '../plugins/spawn/SpawnTaskPlugin' )
const SourceSetsPlugin = require( '../plugins/sourceSets/SourceSetsPlugin' )
const MultiGlob = require( '../util/MultiGlob' )
const LOG = require( '../util/LOG' )( 'hutt:Project' );

class Project extends Base {
  constructor( name, opts = {} ) {
    if ( typeof name === 'object' ) {
      opts = name;
      name = '';
    }
    opts = opts || {};
    opts.prefix = 'project';
    super( name, opts );
    this._tasks = {};
    this._plugins = {};
    this._result = false;
    this._orchestrator = new Orchestrator();
    this._sourceSets = new SourceSets( { parent: this } );
    this._projectDir = opts.projectDir || process.cwd()
    this._buildDir = 'build';
    this._huttDir = '.hutt';
    this._fileCacheDir = 'filecache';
    this._extensions = new ExtensionContainer( { project: this } );
    this._name = this._name || path.basename( this.projectDir )
    this._glob = new MultiGlob( {
      cwd: this.projectDir,
    } )

    this.on( 'register', ( bldr ) => {
      if ( bldr.name === 'project' ) {
        this._projectBuilder = bldr;
      }
    } )

    this._extensions.on( 'extension', this._onExtension.bind( this ) );

    this._defaultTasks();
    this._defaultPlugins();
    LOG.i( `projectDir: ${this.projectDir}` )
    LOG.i( `buildDir: ${this.buildDir}` )
  }

  get buildDir() {
    return path.resolve( this._projectDir, this._buildDir );
  }

  set buildDir( value ) {
    this._buildDir = value;
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

  get orchestrator() {
    return this._orchestrator;
  }

  get path() {
    return `:${this.name}`
  }

  get plugins() {
    return this._plugins;
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

  get shortPath() {
    return `:${this.name}`
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
      return this.emit( 'error', `Task with name ${task.name} already exists` )
    }
    this._tasks[task.name] = task;
    task.project = this;
    this.emit( 'task', task );
    return task;
  }

  _defaultPlugins() {
    LOG.d( 'adding default plugins' );
    this._sourceSetsPlugin = new SourceSetsPlugin( {
      sourceSets: this.sourceSets,
      project: this,
    } );
    this.addPlugin( this._sourceSetsPlugin );
    this.addPlugin( new SpawnTaskPlugin( {
      project: this,
    } ) );
  }

  _defaultTasks() {
    LOG.d( 'adding default tasks' );
    this.addTask( 'compile' )
    this.addTask( 'test' ).dependsOn( 'compile' )
    this.addTask( 'check' ).dependsOn( 'test' )
    this.addTask( 'package' ).dependsOn( 'compile' )
    this.addTask( 'assemble' ).dependsOn( 'package' )
    this.addTask( 'build' ).dependsOn( 'assemble', 'check' )
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

  actuallyConfigure() {
    return arrayp.chain( Object.values( this._tasks )
      .map( t => t.configure.bind( t ) ) )
  }

  actuallyInitialize() {
    return arrayp.chain( Object.values( this._tasks )
      .map( t => () => t.initialize() ),
    )
  }

  actuallyRun( ...args ) {
    return arrayp.chain( [
      this.initialize.bind( this ),
      this.configure.bind( this ),
      () => this.runTasks( ...args ),
    ] )
  }

  /**
   * Add the supplied plugin the builder's list of plugins
   *
   * @param plugin {PluginBase} the plugin to add
   */
  addPlugin( plugin ) {
    if ( typeof plugin === 'string' ) {
      const PluginKlass = require( this.resolve( `hutt-plugin-${plugin}`, {
        basedir: this.projectDir,
      } ) )
      plugin = new PluginKlass( {
        project: this,
      } )
    }
    if ( this.hasPlugin( plugin.name ) ) {
      LOG.d( `${plugin.name}: plugin already registered. Skipping.` );
    } else {
      LOG.d( `${plugin.name}: adding plugin` );
      this._plugins[plugin.name] = plugin;
      plugin.onPluginAdded( this );
    }
  }

  addTask( task ) {
    if ( typeof task === 'string' ) {
      task = new Task( task, { project: this } );
    }
    LOG.d( `${task.name}: adding task` )
    return this._addTask( task )
  }

  apply( opts = {} ) {
    LOG.d( `Apply: ${JSON.stringify( opts )}` )
    if ( opts.plugins ) {
      if ( !Array.isArray( opts.plugins ) ) {
        opts.plugins = [opts.plugins];
      }
      opts.plugins.forEach( x => this.addPlugin( x ) );
    }
  }

  eachPlugin( f ) {
    Object.values( this._plugins ).forEach( f )
  }

  getOrAddTask( name ) {
    if ( !this._tasks[name] ) {
      this.addTask( name )
    }
    return this._tasks[name];
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

  printTasks() {
    _.forOwn( this.orchestrator.tasks, ( ( t ) => {
      console.log( t.name, t.dep );
    } ) )
  }

  registerObjects() {
    this.eachPlugin( p => p.registerObjects() );
  }

  // eslint-disable-next-line no-unused-vars
  removePlugin( plugin ) {
    throw new Error( 'not implemented' )
  }

  resolve( ...args ) {
    return Resolve( ...args );
  }

  runTasks( name = 'default' ) {
    return new Promise( ( resolve, reject ) => {
      this._orchestrator.start( name, ( err, res ) => (err ? reject( err ) : resolve( res )) );
    } )
  }

  unregisterObjects() {
    this.eachPlugin( p => p.unregisterObjects() );
  }
}

module.exports = Project;
