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

// const log4Js = require( 'log4js' );
const npmlog = require( 'npmlog' );

const LOG = ( tag ) => {
  const logger = log4Js.getLogger( tag );
  logger.i = logger.info.bind( logger );
  logger.e = logger.error.bind( logger );
  logger.d = logger.debug.bind( logger );
  logger.w = logger.warn.bind( logger );
  return logger;
}

LOG.configure = log4Js.configure;

LOG.configure( {
  appenders: {
    out: {
      type: 'stdout',
      layout: {
        type: 'pattern',
        pattern: '%x{l}/%d{hh:mm:ss.SSS} [%c] %m',
        tokens: {
          l: e => String( e.level )[0],
        },
      },
    },
  },
  categories: {
    default: {
      appenders: ['out'],
      level: global._logLevel || 'warn',
    },
  },
} )

module.exports = LOG;

