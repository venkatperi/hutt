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

const EventBus = require( 'eventbusjs' );
const path = require( 'path' );
const R = require( 'ramda' );
const LOG = require( './util/LOG' )( 'hutt:ProjectLoader' );

const hook = require( './util/hookRequire' );
const Builder = require( './builder' );
const Base = require( './core/Base' );
const Project = require( './core/Project' );
const _ = require( 'lodash' );

function nop() {
}

class ProjectLoader extends Base {
  constructor( opts = {} ) {
    super( _.extend( {}, { prefix: 'loader' }, opts ) )
    this._isRoot = opts.isRoot;
    this._registered = false;
    this._currentFilename = null;
    this._buildFile = null;
  }

  get buildFile() {
    return this._buildFile;
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

  get errors() {
    return this._project.errors;
  }

  get isRoot() {
    return this._isRoot;
  }

  get noHookRequire() {
    return this.opts.noHookRequire;
  }

  get opts() {
    return this._opts;
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

  /**
   * Actually compile
   *
   * @param closure
   * @returns {Object} Config tree
   * @private
   */
  _compile( closure ) {
    this.emit( 'compile:before' )
    const builder = this._createBuilder();

    // noinspection JSUnresolvedFunction
    const res = this._wrap( () =>
      builder.build( () =>
        project$( closure ) ) );

    this.emit( 'compile:after', res );

    const errors = res.errors || [];
    if ( errors.length ) {
      let msg = ['The following errors were detected during compile:'];
      msg = msg.concat( errors.map( x => x.message ) );
      this.emit( 'error', new Error( msg.join( '\n' ) ) );
    }
    return res;
  }

  _createBuilder() {
    return new Builder( this._project )
      .on( 'register', this._project.emit.bind(
        this._project, 'register' ) );
  }

  /**
   * Builds webpack configuration object for current settings.

   * @param {Object} [opts] - options
   * @returns {Promise} webpack configuration
   */
  _load( opts ) {
    this._buildFile = path.resolve( process.cwd(), opts.buildFile );
    const projectDir = path.dirname( this._buildFile );
    this._project = new Project( { projectDir } )

    this.project.emit( 'build:before' );
    this.project.emit( 'initialize:before' );
    const unreg = this._register();

    this._fin = R.once( ( err ) => {
      this._project.result = !!err;
      const res = {
        succeeded: !(err || this._project.hasErrors),
        message: err || this._project.hasErrors ? 'BUILD FAILED' : 'BUILD SUCCESSFUL',
      }
      this.project.emit( 'build:after', res );
      unreg();
      if ( err ) throw err;
    } )

    try {
      return this.compileFile( this.buildFile );
    } catch ( err ) {
      EventBus.dispatch( 'project:initialize:error', this._project, err );
      this._fin( err );
    }
  }

  /**
   * Register globals, etc.
   * @returns {Function|null} function which will call unregister, once
   * @private
   */
  _register() {
    if ( this._registered ) return nop;

    if ( !this.noHookRequire ) {
      hook.hookRequire();
    }

    this.project.registerObjects();
    this._registered = true;
    return R.once( () => this._unregister() );
  }

  /**
   * Unregister globals
   * @private
   */
  _unregister() {
    if ( !this._registered ) return;
    if ( !this.noHookRequire ) {
      hook.unhookRequire();
    }
    this.project.unregisterObjects();
    this._registered = false;
  }

  _wrap( fn, ...args ) {
    const unreg = this._register( ...args );
    try {
      return fn();
    } finally {
      unreg();
    }
  }

  actuallyRun( opts ) {
    const startTask = opts.start || 'default';
    LOG.i( `using start task: ${startTask}` )

    return this._project
      .run( opts.start )
      .then( this._fin.bind( this ) )
      .catch( this._fin.bind( this ) );
  }

  /**
   * Compile DSL with all settings for evaluation.
   *
   * @param closure
   * @returns {object} compiled / parse tree
   */
  compile( closure ) {
    return this._compile( closure );
  }

  /**
   * Compile file
   *
   * @param f
   * @returns {*}
   */
  compileFile( file ) {
    if ( !file || typeof file !== 'string' ) {
      throw new TypeError( 'file must be a string' );
    }
    LOG.i( `compileFile: ${file}` )

    return this._compile( () => require( file ) );
  }

  /**
   * Builds webpack configuration object for current settings.

   * @param {Object} [opts] - options
   * @returns {Function} webpack configuration
   */
  load( opts ) {
    this._load( opts );

    this.project.subProjects.forEach( ( sp ) => {
      const p = this.project.resolveFile( path.join( sp, 'hutt.build.js' ) )
      LOG.i( `Loading project ${p}` )
      // eslint-disable-next-line no-use-before-define
      this.project.addProject( loadProject( _.extend( {}, opts, {
        buildFile: p
      } ) ) );
    } )
    return this.project;
  }
}

function loadProject( ...args ) {
  return new ProjectLoader().load( ...args )
}

module.exports = ProjectLoader;

