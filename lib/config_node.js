/* eslint-disable class-methods-use-this */
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
const deepmerge = require( 'deepmerge' );
const stackTrace = require( 'stack-trace' );
const uniqueString = require( 'unique-string' );
const debug = require( 'debug' )( 'gulpr:config_node' );
const { inspect } = require( './util' );
const asciiTree = require( 'asc-tree' );

function nop() {
}

/**
 * Base class for nodes in configuration tree, created
 * during the configuration phase.
 *
 * @param opts {Object}
 * @param args {Array} optional arguments provided in the build script
 */
class ConfigNode {
  constructor( opts, ...args ) {
    opts = opts || {};
    this._id = uniqueString();
    this._nodeName = opts.name;
    this._args = args.length === 0 ? null : args;
    this.children = [];
    this.parent = null;
    this._memberType = {};
    this._path = null;
    this._sourceFilename = global.currentFilename;
    this._trace = stackTrace.get();
    this._errors = [];

    this.validate();
  }

  /**
   * Gets this node's arguments which were provided in the build script.
   *
   * @returns {Array} the optional arguments list
   */
  get args() {
    return this._args;
  }

  get callSite() {
    return _.find( this._trace, x => x.getFileName() === this._sourceFilename );
  }

  get errors() {
    let list = [];
    this.walk( {
      beforeChildren( node ) {
        if ( node._errors.length ) {
          list = list.concat( node._errors );
        }
      },
    } );
    return list;
  }

  get id() {
    return this._id;
  }

  /**
   * Returns true if this is a leaf node (no children)
   *
   * @returns {boolean} true if this is a leaf node, else false.
   */
  get isLeaf() {
    return this.children.length === 0;
  }

  /**
   * Gets this node's name
   *
   * @returns {String} the node's name
   */
  get nodeName() {
    return this._nodeName;
  }

  /**
   * Path to the current node
   * @returns {*}
   */
  get path() {
    if ( this._path ) return this._path;
    const parts = [];
    if ( this.parent ) {
      parts.push( this.parent.path );
    }
    parts.push( this.nodeName );
    return parts.join( '.' );
  }

  _doMerge( ...args ) {
    return new Config()
      .merge( this.value, ...args )
      .toObject();
  }

  _extend( path, ...args ) {
    this.value = this.value || {};
    args.forEach( ( x ) => {
      this.value[path] = deepmerge( ( this.value[path] || {} ), x );
    } );
  }

  _handler( name, ...args ) {
    switch ( this._memberType[name] ) {
      case 'object':
        return this._extend( name, ...args );
      case 'array':
        return this._push( name, ...args );
      default:
        return this._set( name, ...args );
    }
  }

  _merge( ...args ) {
    this.value = this._doMerge( ...args );
  }

  _push( path, ...args ) {
    this.value = this.value || {};
    this.value[path] = ( this.value[path] || [] ).concat( args );
  }

  _set( path, ...args ) {
    this.value = this.value || {};
    this.value[path] = args[0];
  }

  /**
   * Called by the builder to add a child node to this one.
   *
   * @param node {ConfigNode} the child node to add
   * @returns {ConfigNode} the child node
   */
  addChild( node ) {
    this.children.push( node );
    // eslint-disable-next-line no-param-reassign
    node.parent = this;
    return node;
  }

  /**
   * Called to evaluate this node during the evaluation phase.
   *
   * @returns {Object} the value / result of evaluation.
   */
  evaluate() {
    if ( !this.parent ) {
      return this.value;
    }

    const args = this.value ? [this.value] : this.args;
    let handler = null;
    // don't get the name property for name('...)
    if ( this.nodeName !== 'name' ) {
      handler = this.parent[this.nodeName];
    }

    if ( !handler ) {
      handler = this.parent._handler;
      args.unshift( this.nodeName );
    }
    try {
      handler.apply( this.parent, args );
    } catch ( err ) {
      debug( '%o, %o, %o', this, handler, err );
      throw err;
    }
    return this.value;
  }

  removeChild( c ) {
    const idx = this.children.indexOf( c );
    if ( idx >= 0 ) {
      this.children.splice( idx, 1 );
    }
  }

  /**
   * Called to add an error to the node's error list.
   *
   * @param err {Error} error to add
   */
  reportError( err ) {
    this._errors.push( err );
    // throw err;
  }

  /**
   * Called to report invalid argument error.
   *
   * @param actual
   * @param expected
   */
  reportInvalidArgument( actual, expected ) {
    const callSite = this.callSite;
    const err = [];
    err.push( `'${this.nodeName}()': ` );
    err.push( actual );
    err.push( ' is not ' );
    err.push( expected );
    err.push( ' at ' );
    err.push( callSite.getFileName() );
    err.push( ':' );
    err.push( Number( callSite.getLineNumber() ) - 1 );
    this.reportError( new ValidationError( err.join( '' ),
      callSite.getFileName(),
      Number( callSite.getLineNumber() ) - 1 ) );
  }

  /**
   * Return an ascii tree representation of this node and its children.
   *
   * @returns {String} ascii tree representation
   */
  toAsciiTree() {
    return asciiTree( this );
  }


  /**
   * to string or not to string
   *
   * @returns {string}
   */
  toString() {
    const res = [this.nodeName];
    if ( this._priority ) {
      res.push( this._priority );
    }

    if ( this.args ) {
      res.push( _.truncate( inspect( this.args ) ) );
    }

    return res.join( ', ' );
  }

  /**
   * Called by the builder to validate this node.
   *
   * @returns {boolean}
   */
  validate() {
    return true;
  }

  /**
   * Applies the supplied visitor to this node and all its children.
   a*
   * @param visitor
   * @returns {*}
   */
  walk( visitor = {} ) {
    ( visitor.beforeChildren || nop ).call( null, this );
    this.children.forEach( c => c.walk( visitor ) );
    return ( visitor.afterChildren || nop ).call( null, this );
  }
}

module.exports = ConfigNode;

