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

const Reporter = require( './Reporter' )
const log = require( 'log-update' );

const colors = {
  lightGrey: '#b0b0b0',
  grey: '#808080',
  darkGrey: '#404040',
  white: '#ffffff',
  black: '#000000',
}

function println( str ) {
  console.log( `> ${str}` );
}

class ConsoleReporter extends Reporter {
  constructor( ...args ) {
    super( ...args );
  }

  projectConfigureAfter( event, ...args ) {
    println( `Configure ${args[0]}ms` )
  }

  projectInitializeAfter( event, ...args ) {
    println( `Initialize ${args[0]}ms` )
  }

  taskRunAfter( event, ...args ) {
    println( `:${event.target.name} ${args[0]}ms` )
  }

  taskRunBefore( event, ...args ) {
  }

  taskRunUpdate( event, ...args ) {
  }
}

module.exports = ConsoleReporter;
