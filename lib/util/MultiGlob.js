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

const glob = require( 'glob' );
const arrayp = require( 'arrayp' );
const _ = require( 'lodash' );

class MultiGlob {
  constructor( opts = {} ) {
    this._opts = opts;
    this._glob = null;
  }

  set cwd( val ) {
    this._opts.cwd = val;
    if ( this._glob ) {
      this._glob.cwd = val;
    }
  }

  _search( pattern ) {
    return new Promise( ( resolve, reject ) => {
      const opts = _.extend( {}, this._opts,
        _.omit( this._glob, ['ignore'] ) );
      this._glob = new glob.Glob( pattern, opts,
        ( err, res ) => (err ? reject( err ) : resolve( res )) )
    } )
  }

  search( include, exclude ) {
    this._opts.ignore = exclude || this._opts.ignore;
    return arrayp.series( _.flatten( [include] )
      .map( this._search.bind( this ) ) )
      .then( _.flatten )
  }
}

module.exports = MultiGlob;
