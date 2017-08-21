/* eslint-disable class-methods-use-this,no-console */
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

const EventBus = require( 'eventbusjs' );
const _ = require( 'lodash' );

const events = [
  'build:before:',
  'build:after:',
  'project:initialize:before',
  'project:initialize:after',
  'project:configure:before',
  'project:configure:after',
  'project:run:before',
  'project:run:after',
  'task:initialize:before',
  'task:initialize:after',
  'task:configure:before',
  'task:configure:after',
  'task:run:before',
  'task:run:after',
  'task:run:update',
]

function nop() {
}

class Reporter {
  constructor( project ) {
    this._project = project;

    const that = this;
    events.forEach( ( e ) => {
      EventBus.addEventListener( e, ( ...args ) => {
        const handler = _.camelCase( e.replace( ':', '_' ) );
        if ( that[handler] )
          that[handler]( ...args );
      } )
    } );

    /*
    EventBus.addEventListener( 'build:before', this.print, this );
    EventBus.addEventListener( 'build:after', this.print, this );
    ['initialize', 'configure', 'run'].forEach( ( e ) => {
      ['before', 'after'].forEach( ( t ) => {
        EventBus.addEventListener( `project:${e}:${t}`, this.print, this )
        EventBus.addEventListener( `task:${e}:${t}`, this.print, this )
      } )
    } )
    EventBus.addEventListener( 'task:info', this.print, this )
    */
  }

  get project() {
    return this._project;
  }

  print( event, ...args ) {
    if ( event.type.endsWith( 'after' ) ) {
      const parts = event.type.split( ':' )
      console.log( `${event.target.path} ${parts[1]} (${args[0]}ms)` )
    } else if ( event.type.endsWith( 'info' ) ) {
      console.log( `${event.target.path}\n${args[0]}` )
    } else if ( event.type === 'project:task' ) {
      console.log( `task added: ${args[0]}` )
    }
  }

  toLines( prefix, str ) {
    return str.split( '\n' ).map( x => `${prefix}: ${x}` ).join( '\n' )
  }
}

module.exports = Reporter;
