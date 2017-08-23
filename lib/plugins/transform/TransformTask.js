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
const _ = require( 'lodash' );
const EventBus = require( 'eventbusjs' );


class TransformTask extends SourceSetTask {
  constructor( name, opts = {} ) {
    super( name, opts );
    this._transformFile = opts.transformFile;
    this._extName = opts.extName;
    this._outputs = opts.outputs;
  }

  transform( files ) {
    const opts = this.project.extensions[this._extName];
    const outputs = this._outputs;

    const that = this;
    let done = 0;
    return arrayp.chain( files.map( file =>
      arrayp.chain( [
        () => Promise.all( [
          this._transformFile( file, opts ),
          this.outputFileName( file ),
        ] ),
        ( [res, outName] ) => {
          const writers = [];
          _.forOwn( outputs, ( v, k ) => {
            if ( res[k] ) {
              writers.push( write( v( outName ), res[k] ) )
            }
          } )
          return Promise.all( writers );
        },
        () => EventBus.dispatch( 'task:run:update', that, (done++) / files.length ),
      ] ) ) )
      .then( ( res ) => {
        this.message = `${files.length} file(s)`;
        return res;
      } )
  }
}

module.exports = TransformTask;
