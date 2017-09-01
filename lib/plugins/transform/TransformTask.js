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
const R = require( 'ramda' );
const fs = require( 'fs' );
const pify = require( 'pify' );

const stat = pify( fs.stat );

class TransformTask extends SourceSetTask {
  constructor( name, opts = {} ) {
    super( name, opts );
    this._transformFile = opts.transformFile;
    this._transform = opts.transform;
    this._outputsMap = opts.outputs;
  }

  get outputsMap() {
    return this._outputsMap;
  }

  actuallyTransform( file ) {
    if ( this._transformFile ) {
      return this._transformFile( file.path, this.extension )
    }

    if ( this._transform ) {
      return arrayp.chain( [
        file.contents,
        R.flip( this._transform.bind( this ) )( this.extension ),
      ] )
    }
  }

  checkOutputs() {
    return arrayp.chain( [
      this.inputs,
      R.map( R.pipe(
        R.prop( 'outputs' ),
        R.map( stat ) ) ),
    ] );
  }

  outputFile( file, type = 'default' ) {
    return this._outputsMap[type]( file );
  }

  processFile( file ) {
    return arrayp.chain( [
      () => this.actuallyTransform( file ),

      res => Promise.all( R.pipe(
        Object.getOwnPropertyNames,
        R.filter( R.allPass( [R.flip( R.prop )( res )] ) ),
        R.map( x => write(
          this.outputFile( file.outputPath, x ),
          res[x] ) ),
      )( this.outputsMap ) ),
    ] )
  }
}

module.exports = TransformTask;
