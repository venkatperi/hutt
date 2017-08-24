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

const { prefix, logger } = require( './LOG' )
const EventBus = require( 'eventbusjs' );

// eslint-disable-next-line no-unused-vars
const orig = {
  stdout: process.stdout.write.bind( process.stdout ),
  stderr: process.stderr.write.bind( process.stderr ),
}

let TAG = '';
let prevTag = '';

EventBus.addEventListener( 'task:run:before', ( event ) => {
  prevTag = TAG;
  TAG = prefix( event.target.shortPath );
} )

EventBus.addEventListener( 'task:run:after', () => {
  TAG = prevTag;
} )

// eslint-disable-next-line no-unused-vars
process.stdout.write = ( chunk, enc, cb ) => {
  const s = chunk.toString()
  return s.split( '\n' ).forEach( x =>
    logger.out( TAG, x ),
  )
}


module.exports = ( tag ) => {
  TAG = tag;
}
