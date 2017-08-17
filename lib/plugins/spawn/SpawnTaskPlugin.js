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

const { AbstractFactory } = require( 'js-dsl' );
const PluginBase = require( '../../plugin_base' );
const { TaskBuilder } = require( '../../TaskFactory' );
const SpawnTask = require( './SpawnTask' );

class SpawnTaskBuilder extends TaskBuilder {
  constructor( parent ) {
    super( 'spawn', parent );
  }

  register() {
    this.registerPropertyNames( [
      'args', 'environment', 'errorOutput', 'executable',
      'ignoreExitValue', 'standardInput', 'standardOutput',
      'workingDir',
    ] );
  }
}

class SpawnTaskFactory extends AbstractFactory {
  getBuilder( parent ) {
    return new SpawnTaskBuilder( parent );
  }

  newInstance( builder, name, ...args ) {
    return new SpawnTask( ...args );
  }
}

class SpawnTaskPlugin extends PluginBase {
  constructor() {
    super( 'spawn' )
  }

  registerBuilderItems( builder ) {
    if ( builder.name === 'project' ) {
      builder.registerFactory( 'spawn', new SpawnTaskFactory() );
    }
  }
}

module.exports = SpawnTaskPlugin;
