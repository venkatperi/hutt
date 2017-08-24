/* eslint-disable class-methods-use-this,no-unused-vars */
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

const assert = require( 'assert' );
const R = require( 'ramda' );
const LOG = require( '../util/LOG' )( 'hutt:PluginBase' );
const Base = require( './Base' )

/**
 * Base class for webpkr plugins
 *
 * @param name {String} name of the plugin
 */
class PluginBase extends Base {
  constructor( opts = {} ) {
    assert( opts.name, 'plugin must have a name' )
    opts.prefix = 'plugin';
    super( opts.name, opts );

    this._builder = null;
    this._project = opts.project;

    this._addDeps( opts.pluginDependsOn );
  }

  /**
   * Gets the builder with which this plugin is registered.
   *
   * @returns {null|Webpkr} the builder if this plugin is registered, otherwise null.
   */
  get builder() {
    return this._builder;
  }

  /**
   * Returns true if this plugin is registered with a builder, else false.
   *
   * @returns {Boolean} true if this plugin is registered with a builder, else false.
   */
  get isRegistered() {
    return R.isNil( this._builder );
  }

  /**
   * Gets the name of the plugin
   *
   * @returns {String} the plugin's name
   */
  get name() {
    return this._name;
  }

  get project() {
    return this._project;
  }

  _addDeps( deps = [] ) {
    deps.forEach( ( p ) => {
      const str = `plugin ${this.name} depends on ${p}.`;
      if ( !this._project.hasPlugin( p ) ) {
        LOG.v( `${str}. Adding.` );
        this._project.addPlugin( p )
      } else {
        LOG.v( `${str}. Already exists. Skipping.` );
      }
    } )
  }

  /**
   * Called by {Webpkr} when this plugin is added to its list of plugins.
   *
   * @param builder {Object} the builder
   */
  onPluginAdded( builder ) {
    this._builder = builder;
    this.emit( 'added' );
    builder.on( 'register', this.registerBuilderItems.bind( this ) );
  }

  /**
   * Register items with builder
   *
   * @param builder
   */
  registerBuilderItems( builder ) {
  }

  /**
   * Register plugin globals
   */
  registerObjects() {
  }

  /**
   * Unregister globals
   */
  unregisterObjects() {
  }
}

module.exports = PluginBase;
