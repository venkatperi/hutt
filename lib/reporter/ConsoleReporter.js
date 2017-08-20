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
const ansi = require( 'ansi' );

const cursor = ansi( process.stdout );

const colors = {
  lightGrey: '#b0b0b0',
  grey: '#808080',
  darkGrey: '#404040',
  white: '#ffffff',
  black: '#000000',
}

let needsNewLine = false;
const oldLog = console.log;
console.log = ( ...args ) => {
  if ( needsNewLine ) {
    oldLog( '' );
    needsNewLine = false;
  }
  oldLog( ...args );
}

const prefixes = {
  'project:initialize:before': 'Initializing',
  'project:configure:before': 'Configuring',
  'project:run:before': 'Running',
}

class ConsoleReporter extends Reporter {
  print( event, ...args ) {
    if ( event.type === 'build:after' ) {
      if ( event.target.result ) {
        cursor
          .hex( colors.white )
          .write( '\nBUILD SUCCESSFUL\n' )
      }
      cursor
        .hex( colors.white )
        .write( `\nTotal Time: ${args[0]}ms\n` )
        .reset();
      return;
    }

    this._prefix = this._prefix || '';

    if ( /project:.*:before/.test( event.type ) ) {
      this._prefix = event.type.indexOf( 'run' ) > 0
        ? '' : prefixes[event.type];
    }

    cursor
      .horizontalAbsolute( 0 )
      .eraseLine()
      .hex( colors.darkGrey )
      .write( '> ' )
      .hex( colors.white )

    if ( /project:.*:after/.test( event.type ) ) {
      if ( event.type.indexOf( 'run' ) < 0 ) {
        cursor.write( `${this._prefix} ` )
      }
      cursor
        .write( `:${event.target.name}` )
        .hex( colors.lightGrey )
        .write( ` ${args[0]}ms\n` )
    } else if ( event.type.startsWith( 'task:' ) ) {
      cursor
        .hex( colors.white )
        .write( `:${event.target.name}` )

      if ( /task:run:after/.test( event.type ) ) {
        cursor
          .hex( colors.lightGrey )
          .write( ` ${args[0]}ms\n` )
      }
    }
    cursor.hex( colors.lightGrey )
    needsNewLine = true;
  }
}

module.exports = ConsoleReporter;
