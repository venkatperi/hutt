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
  projectConfigureAfter( proj, opts ) {
    println( `Configure ${opts.time}ms` )
  }

  projectError( proj, err ) {
    println( err.message )
  }

  projectInitializeAfter( proj, opts ) {
    println( `Initialize ${opts.time}ms` )
  }

  taskError( task, err ) {
    println( err.message )
  }

  taskRunAfter( task, opts ) {
    const items = [task.name];
    if ( opts.message ) {
      items.push( opts.message )
    }
    if ( Number( opts.time ) >= 1 ) {
      items.push( `${opts.time}ms` )
    }
    println( items.join( ' ' ) )
  }
}

module.exports = ConsoleReporter;
