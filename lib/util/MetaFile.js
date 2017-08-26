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

class MetaFile {
  constructor( opts ) {
    let p = null;
    if ( typeof opts === 'string' ) {
      p = opts;
      opts = {}
    }
    _.forOwn( opts, ( v, k ) => this[k] = v )
    this.path = p || opts.path;
    assert( this.path, 'Path is not defined' );
    this.outputPath = this.getOutputPath()
  }

  getOutputPath( ext ) {
    assert( this.project, 'no project?' )
    const out = path.resolve( this.project.buildDir,
      path.relative( this.project.projectDir, this.path ) )
    return ext ? replaceExt( out, ext ) : out;
  }
}

module.exports = MetaFile;
