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

const arrayp = require( 'arrayp' );
const _ = require( 'lodash' );
const pify = require( 'pify' );
const glob = pify( require( 'glob' ) );
const MetaFile = require( './MetaFile' )

class MultiGlob {
  constructor( opts = {} ) {
    this._opts = _.extend( { absolute: true }, opts );
    this._glob = null;
  }

  set cwd( val ) {
    this._opts.cwd = val;
    if ( this._glob ) {
      this._glob.cwd = val;
    }
  }

  _search( pattern ) {
    return glob( pattern, this._opts )
  }

  search( include, exclude ) {
    this._opts.ignore = exclude || this._opts.ignore;
    return arrayp.series(
      _.flatten( [include] )
        .map( this._search.bind( this ) ) )
      .then( _.flatten )
  }

  searchMeta( inc, exc, project ) {
    return this.search( inc, exc )
      .then( res =>
        res.map( x => new MetaFile( { path: x, project } ) ),
      )
  }
}

module.exports = MultiGlob;
