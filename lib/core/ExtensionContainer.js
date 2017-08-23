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

const Base = require( './Base' )
const _ = require( 'lodash' );
const LOG = require( '../util/LOG' )( 'hutt:ExtensionContainer' );

class ExtensionContainer extends Base {
  constructor( opts = {} ) {
    super( _.extend( opts, { prefix: 'extensionContainer' } ) );
    this._project = opts.project;
    this._extensions = {}
  }

  get extensions() {
    return this._extensions;
  }

  get project() {
    return this._project;
  }

  add( name, extension ) {
    if ( !this._extensions[name] ) {
      LOG.d( `${name}: adding extension` )
      this._extensions[name] = extension;
      Object.defineProperty( this, name, {
        configurable: true,
        get: () => this._extensions[name],
      } );

      this.emit( 'extension', name, extension );
    }
  }

  find( name ) {
    return this._extensions[name]
  }
}

module.exports = ExtensionContainer;
