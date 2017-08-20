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

const SourceSetTask = require( '../../core/SourceSetTask' );
const arrayp = require( 'arrayp' );
const write = require( 'write' );

class TransformTask extends SourceSetTask {
  constructor( name, opts = {} ) {
    super( name, opts );
    this._transformFile = opts.transformFile;
    this._extensionName = opts.extensionName;
  }

  transform( files ) {
    console.log(files);
    const opts = this.project.extensions[this._extensionName];

    return Promise.all(
      files.map( file =>
        arrayp.chain( [
          () => Promise.all( [
            this._transformFile( file, opts ),
            this.outputFileName( file ),
          ] ),
          ( [res, outName] ) =>
            Promise.all( [
              write( outName, res.main ),
            ] ),
        ] ) ) )
  }
}

module.exports = TransformTask;
