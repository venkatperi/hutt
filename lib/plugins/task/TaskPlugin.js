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
const _ = require( 'lodash' );
const LOG = require( '../../util/LOG' )( 'hutt:TaskPlugin' );

class TaskPlugin extends PluginBase {
  constructor( opts ) {
    super( opts );

    opts = _.extend( {
      project: this.project,
      extName: opts.name,
      taskName: opts.name,
      dependedOn: [],
    }, opts )

    this.project.addTask( new opts.TaskClass( opts.taskName, opts ) );

    LOG.v( `${opts.extName}: adding extension` )

    this.project.extensions.add( opts.extName,
      Object.assign( {}, opts.defaultOpts ) );

    this.project.on( 'initialize:after', () =>
      opts.dependedOn.forEach( t =>
        this.project.getOrAddTask( t ).dependsOn( opts.taskName ),
      ),
    )
  }
}

function taskPluginClass( opts2 = {} ) {
  return class extends TaskPlugin {
    constructor( opts ) {
      super( _.extend( {}, opts2, opts ) );
    }
  }
}

module.exports = taskPluginClass;
