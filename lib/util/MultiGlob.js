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
const glob = require( 'glob' )
const MetaFile = require( './MetaFile' )

const globp = pify( glob );

class MultiGlob {
  constructor( opts = {} ) {
    this._opts = _.extend( { absolute: true, stat: true }, opts );
    this._glob = null;
  }

  set cwd( val ) {
    this._opts.cwd = val;
    if ( this._glob ) {
      this._glob.cwd = val;
    }
  }

  _search( pattern ) {
    return globp( pattern, this._opts )
  }

  _searchMeta( pattern, project ) {
    return new Promise( ( resolve, reject ) => {
      const g = new glob.Glob( pattern, this._opts, ( err, res ) => {
        if ( err ) {
          reject( err )
        } else {
          resolve( res.map( x => new MetaFile( {
            project,
            path: x,
            stat: {
              mtime: new Date( g.statCache[x].mtime ).toISOString(),
              ctime: new Date( g.statCache[x].ctime ).toISOString(),
              size: g.statCache[x].size,
            },
          } ) ) )
        }
      } )
    } )
  }

  search( include, exclude ) {
    this._opts.ignore = exclude || this._opts.ignore;
    return arrayp.series(
      _.flatten( [include] )
        .map( this._search.bind( this ) ) )
      .then( _.flatten )
  }

  searchMeta( inc, exc, project ) {
    this._opts.ignore = exc || this._opts.ignore;
    return arrayp.series(
      _.flatten( [inc] )
        .map( x => this._searchMeta( x, project ) ) )
      .then( _.flatten )
  }
}

module.exports = MultiGlob;
