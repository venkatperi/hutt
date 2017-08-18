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

const Task = require( '../../Task' );
const pify = require( 'pify' );
const transformFile = pify( require( 'babel-core' ).transformFile );
const path = require( 'path' );
const arrayp = require( 'arrayp' );
const write = require( 'write' );
const EventBus = require( 'eventbusjs' );

class BabelTask extends Task {
  constructor( name, opts = {} ) {
    super( name, opts );
    this._babelOpts = opts.babelOpts || {};
  }

  get inputs() {
    return this._project.sourceSets$.main.js.allSource;
  }

  get outputs() {
    if ( !this._outputs ) {
      this._outputs = this.inputs.map( this.outputFileName.bind( this ) )
    }
    return this._outputs;
  }

  action() {
    const outputs = this.outputs;
    const changedInputs = this.changedOutputs.length ? this.inputs : this.changedInputs;

    // if ( changedInputs.length ) {
    // const changes = this.changedInputs.join( '\n' );
    // EventBus.dispatch( 'task:info', this,
    //   `The following files have changed:\n${changes}` )

    return Promise.all(
      this.inputs.map( ( file, i ) => arrayp.chain( [
        transformFile( file, this._babelOpts ),
        src => write( outputs[i], src.code ),
        // src => write( `${outputs[i]}.map`, src.map ),
      ] ) ) )
    // }

    return Promise.resolve();
  }

  outputFileName( file ) {
    const projectDir = this._project.projectDir;
    const buildDir = this._project.buildDir;
    return path.resolve( buildDir,
      path.relative( projectDir, file ) )
  }
}

module.exports = BabelTask;
