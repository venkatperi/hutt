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

const { promisify } = require( 'util' );
const path = require( 'path' );
const Orchestrator = require( 'orchestrator' );
const _ = require( 'lodash' );
const Resolve = require( 'resolve' ).sync;
const arrayp = require( 'arrayp' );
const mkdirp = require( 'mkdirp' );
const R = require( 'ramda' );
const assert = require( 'assert' );

const db = require( '../db' )
const Base = require( './Base' );
const Task = require( './Task' );
const SourceSets = require( './SourceSets' );
const ExtensionContainer = require( './ExtensionContainer' );
const SpawnTaskPlugin = require( '../plugins/spawn/SpawnTaskPlugin' )
const SourceSetsPlugin = require( '../plugins/sourceSets/SourceSetsPlugin' )
const MultiGlob = require( '../util/MultiGlob' )
const LOG = require( '../util/LOG' )( 'hutt:Project' );
const { set } = require( '../util/Rhelpers' )

class Project extends Base {
  constructor( name, opts = {} ) {
    if ( typeof name === 'object' ) {
      opts = name;
      name = '';
    }
    opts = opts || {};
    opts.prefix = 'project';
    const projectDir = opts.projectDir || process.cwd()
    name = name || opts.name || path.basename( projectDir )

    super( name, opts );

    this._tasks = {};
    this._projects = {};
    this._plugins = {};
    this._result = false;
    this._orchestrator = new Orchestrator();
    this._sourceSets = new SourceSets( { parent: this } );
    this._projectDir = projectDir;
    this._buildDir = 'build';
    this._huttDir = '.hutt';
    this._fileCacheDir = 'filecache';
    this._extensions = new ExtensionContainer( { project: this } );
    this._subProjects = [];
    this._knex = null;
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

    this.mkdir( this.huttDir );
    LOG.i( `projectDir: ${this.projectDir}` )
    LOG.i( `buildDir: ${this.buildDir}` )
  }

  get allProjects() {
    return _.flatten( Object.values( this.projects )
      .map( x => x.allProjects ) )
      .concat( Object.values( this.projects ) )
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

  get knex() {
    return this._knex;
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

  get projects() {
    return this._projects;
  }

  get projectsList() {
    return Object.values( this._projects )
  }

  get result() {
    return this._result;
  }

  set result( value ) {
    this._result = value;
  }

  get result() {
    return this._result;
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

  get subProjects() {
    return this._subProjects;
  }

  get tasks() {
    return this._tasks;
  }

  get tasksList() {
    return Object.values( this._tasks )
  }

  _addProject( proj ) {
    if ( this._projects[proj.name] ) {
      return this.emit( 'error', `Project with name ${proj.name} already exists` )
    }
    this.addChild( proj );
    this._projects[proj.name] = proj;
    this.emit( 'project', proj );
    return proj;
  }

  _addTask( task ) {
    if ( this._tasks[task.name] ) {
      return this.emit( 'error', `Task with name ${task.name} already exists` )
    }
    this.addChild( task );
    this._tasks[task.name] = task;
    this.emit( 'task', task );
    return task;
  }

  _defaultPlugins() {
    LOG.v( 'adding default plugins' );
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
    LOG.v( 'adding default tasks' );
    this.addTask( 'compile' )
    this.addTask( 'test' ).dependsOn( 'compile' )
    // this.addTask( 'check' ).dependsOn( 'test' )
    // this.addTask( 'package' ).dependsOn( 'compile' )
    // this.addTask( 'assemble' ).dependsOn( 'package' )
    // this.addTask( 'build' ).dependsOn( 'assemble', 'check' )
    this.addTask( 'build' ).dependsOn( 'compile', 'test' )
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
    return this.withAll( x => x.configure() )
  }

  actuallyInitialize() {
    return arrayp.chain( [
      () => db.initialize( this ),
      set( this, '_knex' ),
      () => this.withAll( x => x.initialize() ),
    ] )
  }

  actuallyRun( ...args ) {
    return arrayp.chain( [
      ...this.projectsList.map( x => x.run.bind( x, ...args ) ),
      this.runTasks.bind( this, ...args ),
      () => db.destroy( this, this._knex ),
      () => set( this, '_knex', null ),
    ] )
  }

  /**
   * Add the supplied plugin the builder's list of plugins
   *
   * @param plugin {PluginBase} the plugin to add
   */
  addPlugin( plugin ) {
    const opts = {
      basedir: this.projectDir,
      paths: process.env.NODE_PATH.split( ':' ),
    }

    if ( typeof plugin === 'string' ) {
      plugin = R.pipe(
        this.resolve.bind( this, `hutt-plugin-${plugin}`, opts ),
        require,
        X => new X( { project: this } ),
      )()
    }

    if ( this.hasPlugin( plugin.name ) ) {
      LOG.v( `${plugin.name}: plugin already registered. Skipping.` );
    } else {
      LOG.v( `${plugin.name}: adding plugin` );
      this._plugins[plugin.name] = plugin;
      plugin.onPluginAdded( this );
    }
  }

  addProject( proj ) {
    LOG.v( `${proj.name}: adding project` )
    return this._addProject( proj )
  }

  addTask( task ) {
    if ( typeof task === 'string' ) {
      task = new Task( task, { project: this } );
    }
    LOG.v( `${task.name}: adding task` )
    return this._addTask( task )
  }

  apply( opts = {} ) {
    LOG.v( `Apply: ${JSON.stringify( opts )}` )
    R.pipe(
      _.flatten,
      R.forEach( this.addPlugin.bind( this ) ),
    )( [opts.plugins] )
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

  globMeta( includes, excludes ) {
    return this._glob.searchMeta( includes, excludes, this )
  }

  hasPlugin( name ) {
    return !!this._plugins[name]
  }

  hasTask( name ) {
    return !!this._tasks[name]
  }

  includeFlat( ...args ) {
    this._subProjects = [
      ...this._subProjects,
      ...R.pipe(
        _.flatten,
        R.map( path.join.bind( null, '..' ) ) )( args ),
    ]
  }

  mkdir( dir ) {
    R.pipe(
      this.resolveFile.bind( this ),
      mkdirp.sync,
    )( dir );
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

  resolveFile( file ) {
    return path.resolve( this._projectDir, file );
  }

  resolveHuttFile( file ) {
    return path.resolve( this.huttDir, file );
  }

  runTasks( name = 'default' ) {
    this.emit( 'run:tasks' )
    return new Promise( ( resolve, reject ) => {
      this._orchestrator.start( 'default',
        ( err, res ) => (err ? reject( err ) : resolve( res )) );
    } )
  }

  unregisterObjects() {
    this.eachPlugin( p => p.unregisterObjects() );
  }

  withAll( f ) {
    return arrayp.chain( [
      ...this.projectsList,
      ...this.tasksList,
    ].map( x => () => f( x ) ) )
  }
}

module.exports = Project;
