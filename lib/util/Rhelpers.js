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


const _ = require( 'lodash' );
const R = require( 'ramda' );
const arrayp = require( 'arrayp' );

const set = R.curry( _.set )
const chain = R.curry( arrayp.chain )

const notEquals = R.complement( R.equals )

const toArr = ( ...args ) => args

const getOrInit = ( name, fn ) =>
  R.ifElse(
    R.has( `_${name}` ),
    R.prop( `_${name}` ),
    // eslint-disable-next-line no-return-assign
    obj => obj[`_${name}`] = fn( obj ) )

const notEmpty = R.complement( R.isEmpty )

module.exports = {
  notEmpty,
  set,
  chain,
  notEquals,
  toArr,
  getOrInit,
}
