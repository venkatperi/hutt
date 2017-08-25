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
const phases = require( '../core/phases' );

const sources = ['hutt', 'project', 'task'];
const types = ['before', 'after', 'error', 'update'];

let events = [];

sources.forEach( x =>
  phases.forEach( p =>
    types.forEach( t =>
      events.push( `${x}:${p}:${t}` ) ) ) )

events = events.concat( [
  'hutt:build:before',
  'hutt:build:after',

  'project:build:before',
  'project:build:after',
  'project:run:tasks',
] );

class Reporter {
  constructor( project ) {
    this._project = project;

    const that = this;
    events.forEach( ( e ) => {
      const handlerName = _.camelCase( e.replace( ':', '_' ) );
      EventBus.addEventListener( e, ( event, ...args ) => {
        if ( that[handlerName] ) {
          that[handlerName]( event.target, ...args );
        }
      } )
    } );
  }

  get project() {
    return this._project;
  }
}

module.exports = Reporter;
