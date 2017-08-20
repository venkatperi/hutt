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

const { EventEmitter } = require( 'events' );
const R = require( 'ramda' );

/**
 * Base class for webpkr plugins
 *
 * @param name {String} name of the plugin
 */
class PluginBase extends EventEmitter {
  constructor( name, opts = {} ) {
    super();
    this._name = name;
    this._builder = null;
    this._project = opts.project;
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

  /**
   * Called after all nodes evaluated
   *
   * @param value
   * @returns {*}
   */
  afterEvaluate( value ) {
    return value;
  }

  /**
   * Called by the builder to let this plugin inspect the result of evaluating the supplied node.
   * The plugin can modify the value and return the new value.
   *
   * @param node {ConfigNode}
   * @param value {*}
   * @returns {*} the original value, or modified.
   */
  afterNodeEvaluate( node, value ) {
    return value;
  }

  /**
   *
   * @param node
   */
  beforeNodeEvaluate( node ) {
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
   * Returns true if the specified node should be considered during evaluation
   *
   * @param node {ConfigNode} node to test
   * @returns {boolean} true if the node should be evaluated, false otherwise.
   */
  shouldEvaluate( node ) {
    return true;
  }

  /**
   * Unregister globals
   */
  unregisterObjects() {
  }
}

module.exports = PluginBase;
