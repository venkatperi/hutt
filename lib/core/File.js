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
const path = require( 'path' );
const assert = require( 'assert' );
const replaceExt = require( 'replace-ext' );
const fs = require( 'fs' );
const { promisify } = require( 'util' );
const { getOrInit, set } = require( '../util/Rhelpers' )
const R = require( 'ramda' );
const Base = require( './Base' )

const readFile = promisify( fs.readFile )

class File extends Base {
  constructor( opts ) {
    opts.prefix = 'file'
    super( opts );
    _.forOwn( opts, R.flip( set( this ) ) )
    this.path = opts.path;
    assert( this.path, 'Path is not defined' );
  }

  get contents() {
    return getOrInit( 'contents', () => (this.contentsProxy
      ? this.contentsProxy()
      : readFile( this.path, 'utf8' )),
    )( this )
  }

  get outputPath() {
    return this.getOutputPath()
  }

  clone() {
    return new File( {
      path: this.path,
      stat: _.extend( {}, this.stat ),
      contentsProxy: () => this.contents,
    } )
  }

  getOutputPath( ext ) {
    assert( this.project, 'no project?' )
    const out = path.resolve( this.project.buildDir,
      path.relative( this.project.projectDir, this.path ) )
    return ext ? replaceExt( out, ext ) : out;
  }

  prefetch() {
    return this.contents
  }
}

module.exports = File;
