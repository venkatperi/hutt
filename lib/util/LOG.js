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

const npmlog = require( 'npmlog' );
const _ = require( 'lodash' );

const levels = {
  debug: { level: 100, style: { fg: 'blue' }, disp: 'D' },
  verbose: { level: 1000, style: { fg: 'grey' }, disp: 'V' },
  info: { level: 2000, style: { fg: 'green' }, disp: 'I' },
  warn: { level: 4000, style: { fg: 'black', bg: 'yellow' }, disp: 'W"' },
  error: { level: 5000, style: { fg: 'red', bg: 'black' }, disp: 'E' },
  out: { level: 50000, style: { fg: 'white' }, disp: '>' },
}

_.forOwn( levels, ( v, k ) => npmlog.addLevel( k, v.level, v.style, v.disp ) )

npmlog.level = global._logLevel || 'warn';
npmlog.prefixStyle = { fg: 'grey' }

class Logger {
  constructor( tag ) {
    this._tag = tag;
    Object.getOwnPropertyNames( levels ).forEach( ( l ) => {
      this[l] = ( ...args ) => npmlog[l]( tag, ...args )
      this[l[0]] = ( ...args ) => npmlog[l]( tag, ...args )
    } )
  }
}


module.exports = tag => new Logger( tag );
module.exports.logger = npmlog;
