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

const { logger } = require( './LOG' )
const _ = require( 'lodash' );
const EventBus = require( 'eventbusjs' );
const chalk = require( 'chalk' );

const orig = {
  stdout: process.stdout.write.bind( process.stdout ),
  stderr: process.stderr.write.bind( process.stderr ),
}

let TAG = '';
let prevTag = '';

EventBus.addEventListener( 'task:run:before', ( event ) => {
  prevTag = TAG;
  TAG = event.target.name;
} )

EventBus.addEventListener( 'task:run:after', ( event ) => {
  TAG = prevTag;
} )

process.stdout.write = ( chunk, enc, cb ) => {
  const s = chunk.toString()
  let str = s.split( '\n' ).map( x =>
    `> ${chalk.grey( `${TAG}:out` )} ${x}` ).join( '\n' )
  if ( s.endsWith( '\n' ) ) {
    str += '\n'
  }
  orig.stdout( str )
}

module.exports = ( tag ) => {
  TAG = tag;
}
