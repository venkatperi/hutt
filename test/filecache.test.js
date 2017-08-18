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
const FileCache = require( '../lib/FileCache' )
const path = require( 'path' );
const fs = require( 'fs' );
const pify = require( 'pify' );
const rimraf = pify( require( 'rimraf' ) );

const baseDir = path.join( __dirname, 'fixtures' )
const cachePath = path.join( __dirname, 'tmp', 'cache' );
const files = ['a.txt', 'b.txt', 'c.txt'].map( x => path.resolve( baseDir, x ) )

describe( 'file cache', () => {
  let cache = null;

  beforeEach( () => rimraf( cachePath ) )

  it( 'create with path', () => {
    cache = new FileCache( { name: 'test', files, cachePath } )
    cache.reconcile();
    assert( fs.existsSync( path.join( cachePath, 'test' ) ) );
  } );


} );

