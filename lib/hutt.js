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

const hirestime = require( 'hirestime' );
const EventBus = require( 'eventbusjs' );
const path = require( 'path' );
const debug = require( 'debug' )( 'hutt:hutt' );
const { EventEmitter } = require( 'events' );
const R = require( 'ramda' );
const ConsoleReporter = require( './reporter/ConsoleReporter' );

const hook = require( './util/hookRequire' );
const Builder = require( './builder' );
const Project = require( './core/Project' );

// const config = require( './config' );

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
 *
 */
class Hutt extends EventEmitter {
  constructor( opts = {} ) {
    super();
    debug( 'Hutt: %o', opts );
    this._registered = false;
    this._phase = 'initialization';
    this._currentFilename = null;
    this._noHookRequire = true;

    this._project = new Project();
    this._reporter = new ConsoleReporter()
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
   * Builds webpack configuration object for current settings.

   * @param {String|Function} src - webpkr config
   * @param {Object} [opts] - options
   * @returns {Promise} webpack configuration
   */
  _build( src, opts ) {
    const time = hirestime();
    EventBus.dispatch( 'build:before', this._project );
    this._project._initTimer = hirestime();
    EventBus.dispatch( 'project:initialize:before', this._project );
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

      opts.start = opts.start || 'default';

      switch ( typeof src ) {
        case 'string' :
          project = this.compileFile( src );
          break;

        case 'function':
          project = this.compile( src );
          break;

        default:
          return Promise.reject( TypeError( 'build: bad source' ) );
      }

      return new Promise( ( resolve, reject ) =>
        project.run( opts.start, ( err, res ) => {
          if (err) console.log(err)
          this._project.result = !!err;
          EventBus.dispatch( 'build:after', this._project, time() );
          unreg();
          return err ? reject( err ) : resolve( res );
        } ) );
    } catch ( err ) {
      console.log( err );
      EventBus.dispatch( 'build:after', this._project, time() );
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
    const builder = new Builder( this._project );
    builder.on( 'register', this._project.emit.bind(
      this._project, 'register' ) );

    return builder;
  }

  /**
   * Register globals, etc.
   * @returns {Function|null} function which will call unregister, once
   * @private
   */
  _register() {
    if ( this._registered ) return nop;

    debug( 'register' );
    if ( !this._noHookRequire ) {
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
    debug( 'unregister' );
    if ( !this._noHookRequire ) {
      hook.unhookRequire();
    }
    this.project.unregisterObjects();
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
}

module.exports = Hutt;

