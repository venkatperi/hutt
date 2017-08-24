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
const { TaskBuilder } = require( '../../core/TaskFactory' );
const SpawnTask = require( './SpawnTask' );
const { builderClass, factoryClass } = require( '../../util/classBuilders' );

const SpawnTaskBuilder = builderClass( {
  name: 'spawn',
  superClass: TaskBuilder,
  methodNames: ['arg'],
  propertyNames: [
    'args', 'environment', 'errorOutput', 'executable',
    'ignoreExitValue', 'standardInput', 'standardOutput',
    'workingDir',
  ],
} )

const SpawnTaskFactory = factoryClass( {
  ItemClass: SpawnTask,
  BuilderClass: SpawnTaskBuilder,
} );

class SpawnTaskPlugin extends PluginBase {
  constructor( opts = {} ) {
    opts.name = opts.name || 'spawn';
    super( opts );
  }

  registerBuilderItems( bldr ) {
    if ( bldr.name === 'project' ) {
      bldr.registerFactory( 'spawn', new SpawnTaskFactory() );
    }
  }
}

module.exports = SpawnTaskPlugin;
