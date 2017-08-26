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
const graphlib = require( 'graphlib' );
const R = require( 'ramda' );
const fs = require( 'fs' );
const pify = require( 'pify' );
const stat = pify( fs.stat );

class TransformTask extends SourceSetTask {
  constructor( name, opts = {} ) {
    super( name, opts );
    this._transformFile = opts.transformFile;
    this._outputsMap = opts.outputs;
  }

  get outputsMap() {
    return this._outputsMap;
  }

  // checkInputs() {
  //   const outputTypes = Object.getOwnPropertyNames( this.outputsMap )
  //   return arrayp.chain( [
  //     this.inputs,
  //     R.forEach( ( file ) => {
  //       file.outputs = R.fromPairs( outputTypes.map( type =>
  //         [type, { path: this.outputFile( file.outputPath, type ) }] ) )
  //     } ),
  //   ] )
  // }

  checkOutputs() {
    return arrayp.chain( [
      this.inputs,
      R.map( R.pipe(
        R.prop( 'outputs' ),
        R.map( stat ) ) ),
    ] );
  }

  createGraph() {
    const gr = new graphlib.Graph();
    return arrayp.chain( [
      this.inputs,
      inputs => Object
        .getOwnPropertyNames( this.outputsMap )
        .forEach( ( outType ) => {
          inputs.forEach( ( input ) => {
            const output = this.outputFile( input.outputPath, outType );
            gr.setNode( input.path );
            gr.setNode( output, outType );
            gr.setEdge( input.path, output );
          } )
        } ),
      () => gr,
    ] )
  }

  outputFile( file, type = 'default' ) {
    return this._outputsMap[type]( file );
  }

  processFile( file ) {
    return arrayp.chain( [
      this._transformFile( file.path, this.extension ),

      res => Promise.all( Object
        .getOwnPropertyNames( this.outputsMap )
        .filter( x => !!res[x] )
        .map( x => write(
          this.outputFile( file.outputPath, x ),
          res[x] ) ) ),
    ] )
  }
}

module.exports = TransformTask;
