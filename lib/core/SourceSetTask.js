/* eslint-disable no-unused-vars,class-methods-use-this */
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

const BuildTask = require( './BuildTask' );
const path = require( 'path' );

class SourceSetTask extends BuildTask {
  constructor( name, opts = {} ) {
    super( name, opts );
    this._sourceSetName = opts.sourceSetName;
  }

  get inputs() {
    return this._project.sourceSets$
      .main[this._sourceSetName].allSource;
  }

  get outputs() {
    if ( !this._outputs ) {
      this._outputs = this.inputs.map( this.outputFileName.bind( this ) )
    }
    return this._outputs;
  }

  get sourceSetName() {
    return this._sourceSetName;
  }

  set sourceSetName( value ) {
    this._sourceSetName = value;
  }

  action() {
    const outputs = this.outputs;
    const changedInputs = this.changedOutputs.length ? this.inputs : this.changedInputs;

    // if ( changedInputs.length ) {
    // const changes = this.changedInputs.join( '\n' );
    // EventBus.dispatch( 'task:info', this,
    //   `The following files have changed:\n${changes}` )

    return this.transform( this.inputs );
    // }
  }

  outputFileName( file ) {
    return path.resolve( this._project.buildDir,
      path.relative( this._project.projectDir, file ) )
  }

  transform( files ) {
    return Promise.resolve();
  }
}

module.exports = SourceSetTask;
