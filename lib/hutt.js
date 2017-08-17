/* globals project$ */
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
const path = require( 'path' );
const debug = require( 'debug' )( 'hutt:hutt' );
const { EventEmitter } = require( 'events' );
const R = require( 'ramda' );

const hook = require( './util/hookRequire' );
const Builder = require( './builder' );
const Project = require( './Project' );
const SpawnTaskPlugin = require( './plugins/spawn/SpawnTaskPlugin' )
const SourceSetsPlugin = require( './plugins/sourceSets/SourceSetsPlugin' )
const JavaScriptSourceSetsPlugin = require( './plugins/javascriptSourceSet/JavaScriptSourceSetPlugin' )
// const config = require( './config' );
// const plugins = require( './plugins' );

function nop() {
}

/**
 * Hutt
 *
 * @param {Object} [opts] - options
 * @param {string} [opts.config] - config module
 * @param {string} [opts.projectDir] - dir containing project root
 * @param {string} [opts.buildFile=projectDir/build] - dir where output is written
 * @param {string[]} [opts.publicPath=/] - `webpack` public path
 * @param {Object} [opts.srcDirs] - source directories
 * @param {PluginBase[]} [opts.plugins] - custom plugins
 *
 */
class Hutt extends EventEmitter {
  constructor( opts = {} ) {
    super();
    debug( 'Hutt: %o', opts );
    this._registered = false;
    this._phase = 'initialization';
    this._currentFilename = null;
    this._plugins = [];
    this._noHookRequire = false;

    this._project = new Project();
    this._sourceSetsPlugin = new SourceSetsPlugin( {
      sourceSets: this._project.sourceSets,
    } );
    this.addPlugin( this._sourceSetsPlugin );
    this.addPlugin( new JavaScriptSourceSetsPlugin( {
      project: this._project,
    } ) );
    this.addPlugin( new SpawnTaskPlugin() );
  }

  /**
   * Gets the name of the webpkr module being processed.
   *
   * @returns {null|string}
   */
  get currentFilename() {
    return this._currentFilename;
  }

  /**
   * Sets the name of the webpkr module being processed.
   *
   * @param {null|string} value - the file name
   */
  set currentFilename( value ) {
    this._currentFilename = value;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Gets the current phase of the build.
   *
   * @returns {string}
   */
  get phase() {
    return this._phase;
  }

  /**
   * Sets the current phase of the build
   * @param value {string}
   */
  set phase( value ) {
    this._phase = value;
  }

  /**
   * Gets the list of registered plugins.
   *
   * @returns {PluginBase[]} plugins
   */
  get plugins() {
    return this._plugins;
  }

  get project() {
    return this._project;
  }

  /**
   * Get the absolute path to the project's base directory.
   *
   * @returns {String}
   */
  get projectDir() {
    return this._projectDir;
  }

  /**
   * Sets the project's base dir.
   *
   * @param v {String} the base dir
   */
  set projectDir( v ) {
    this._updateProperty( 'projectDir', v );
  }

  _afterEvaluate( value ) {
    let res = value;
    this.plugins.forEach( ( p ) => {
      res = p.afterEvaluate( res );
      return res;
    } );
    this.emit( 'afterEvaluate', res );
    return res;
  }

  _afterNodeEvaluate( node, value ) {
    this.emit( 'afterNodeEvaluate', node, value );
    let res = value;
    this.plugins.forEach( ( p ) => {
      res = p.afterNodeEvaluate( node, res );
      return res;
    } );

    node.value = res;
    return res;
  }

  /**
   * Called before a node is evaluated
   * @param node
   * @private
   */
  _beforeNodeEvaluate( node ) {
    this.emit( 'beforeNodeEvaluate', node );
    this.plugins.forEach( p => p.beforeNodeEvaluate( node ) );
  }

  /**
   * Builds webpack configuration object for current settings.

   * @param {String|Function} src - webpkr config
   * @param {Object} [opts] - options
   * @returns {Promise} webpack configuration
   */
  _build( src, opts ) {
    const unreg = this._register();

    try {
      let project = null;
      if ( typeof src === 'object' ) {
        opts = src;
        src = null;
      }

      if ( !opts ) {
        opts = {};
      }

      debug( '_build: %s, %o', typeof src === 'function' ? 'function' : src, opts );

      switch ( typeof src ) {
        case 'string' :
          project = this.compileFile( src );
          break;

        case 'function':
          project = this.compile( src );
          break;

        default:
          throw new TypeError( 'build: bad source' );
      }

      return project.start( 'default' )
        .then( ( res ) => {
          unreg();
          return res;
        } )
        .catch( ( err ) => {
          unreg();
          throw err;
        } );
    } catch ( err ) {
      unreg();
      return Promise.reject( err );
    }
  }

  /**
   * Actually compile
   *
   * @param closure
   * @returns {Object} Config tree
   * @private
   */
  _compile( closure ) {
    const builder = this._creatBuilder();

    // noinspection JSUnresolvedFunction
    const res = this._wrap( () =>
      builder.build( () =>
        project$( closure ) ) );

    this.emit( 'afterCompile', res );
    const errors = res.errors || [];
    if ( errors.length ) {
      let msg = ['The following errors were detected during compile:'];
      msg = msg.concat( errors.map( x => x.message ) );
      throw new Error( msg.join( '\n' ) );
    }
    return res;
  }

  _creatBuilder() {
    const builder = new Builder( this._project );
    builder.on( 'postInstantiate', ( ...args ) => this.emit( 'nodeInstantiate', ...args ) );
    builder.on( 'nodeCompleted', ( ...args ) => this.emit( 'nodeCompleted', ...args ) );
    builder.on( 'register', ( ...args ) => this.emit( 'register', ...args ) );

    return builder;
  }

  /**
   * Register globals, plugin objects etc.
   * @returns {Function|null} function which will call unregister, once
   * @private
   */
  _register() {
    if ( this._registered ) return nop;

    debug( 'register' );
    if ( !this._noHookRequire ) {
      hook.hookRequire();
    }

    this.plugins.forEach( p => p.registerObjects() );
    this._registered = true;
    return R.once( () => this._unregister() );
  }

  /**
   * Unregister globals and plugin objects
   * @private
   */
  _unregister() {
    if ( !this._registered ) return;
    debug( 'unregister' );
    if ( !this._noHookRequire ) {
      hook.unhookRequire();
    }
    this.plugins.forEach( p => p.unregisterObjects() );
    this._registered = false;
  }

  _updateProperty( name, value ) {
    if ( this[name] !== value ) {
      const old = this[name];
      this[name] = value;
      this.emit( 'propertyChanged', name, value, old );
    }
  }

  _wrap( fn, ...args ) {
    const unreg = this._register( ...args );
    try {
      return fn();
    } finally {
      unreg();
    }
  }

  /**
   * Add the supplied plugin the builder's list of plugins
   *
   * @param plugin {PluginBase} the plugin to add
   */
  addPlugin( plugin ) {
    this._plugins.push( plugin );
    plugin.onPluginAdded( this );
  }

  /**
   * Builds webpack configuration object for current settings.

   * @param {String|Function} src - webpkr config
   * @param {Object} [opts] - options
   * @returns {Function} webpack configuration
   */
  build( src, opts ) {
    return this._build( src, opts );
  }

  /**
   * Compile DSL with all settings for evaluation.
   *
   * @param closure
   * @returns {object} compiled / parse tree
   */
  compile( closure ) {
    debug( 'compile' );
    return this._compile( closure );
  }

  /**
   * Compile file
   *
   * @param f
   * @returns {*}
   */
  compileFile( f ) {
    if ( !f || typeof f !== 'string' ) {
      throw new TypeError( 'file must be a string' );
    }

    const file = path.resolve( this._projectDir, f );
    let dir = path.dirname( file );
    dir = path.basename( dir ) === 'webpack' ?
      path.dirname( dir ) : dir;

    debug( `compileFile ${file}, dir: ${dir}` );
    return this._compile( () => {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      require( file );
    }, {
      projectDir: dir,
    } );
  }

  removePlugin( plugin ) {
    const idx = this._plugins.indexOf( plugin );
    if ( idx < 0 ) return;
    this._plugins.splice( idx, 1 );
  }
}

module.exports = Hutt;

