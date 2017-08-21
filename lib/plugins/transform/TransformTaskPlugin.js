/* eslint-disable no-undef,class-methods-use-this */
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

const PluginBase = require( '../../core/PluginBase' );
const TransformTask = require( './TransformTask' );
const _ = require( 'lodash' );

class TransformTaskPlugin extends PluginBase {
  constructor( opts ) {
    super( opts );
    const taskName = opts.taskName || opts.name;
    const extName = opts.extName || opts.name;

    this.project.addTask( new TransformTask( taskName, {
      project: this.project,
      transformFile: opts.transformFile,
      sourceSetName: opts.sourceSetName,
      extName,
      outputs: opts.outputs,
    } ) );

    this.project.extensions.add( extName,
      Object.assign( {}, opts.defaultOpts ) );

    if ( opts.addBuildDep ) {
      this.project.on( 'project:initialize:after', () => {
        this.project.getTask( 'build' ).dependsOn( taskName );
      } )
    }
  }
}

function transformTaskPluginClass( opts2 = {} ) {
  return class extends TransformTaskPlugin {
    constructor( opts ) {
      super( _.extend( {}, opts2, opts ) );
    }
  }
}

module.exports = transformTaskPluginClass;
