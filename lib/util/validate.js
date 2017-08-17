/* eslint-disable semi,no-use-before-define,no-unused-vars */
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

const _ = require( 'lodash' )
const R = require( 'ramda' )
const { type } = require( './index' );

const length = x => x.length

const all = args => R.allPass( args )

const or = R.or

const any = R.anyPass

const nil = R.isNil

const both = R.both

const flip = R.flip

const notNil = R.complement( R.isNil )

const not = R.not

const complement = R.complement

const contained = R.contains

const contains = R.flip( R.contains )

const missing = complement( contains )

const containsNotNil = arr => all( [notNil, contains( arr )] )

const isArray = Array.isArray

const isObject = R.pipe( type, R.equals( 'object' ) )

const isString = R.pipe( type, R.equals( 'string' ) )

const isRegexp = R.pipe( type, R.equals( 'regexp' ) )

const isFunction = R.pipe( type, R.equals( 'function' ) )


const everyProp = R.curry( ( test, obj ) => isObject( obj ) && R.all( test, R.values( obj ) ) )

const nonEmptyString = R.both( isString, R.pipe( length, R.lt( 0 ) ) )

const nonEmptyArray = R.both( isArray, R.pipe( length, R.lt( 0 ) ) )

const arrayOf = pred => R.both( isArray, R.all( pred ) )

const isUnique = x => R.equals( R.uniq( x ), x )

const arrayOfNonEmptyStrings = arrayOf( nonEmptyString )

const arrayOfUniqueItems = R.both( isArray, isUnique )

const nonEmptyArrayOfUniqueStringValues = R.allPass( [
  nonEmptyArray,
  arrayOfNonEmptyStrings,
  arrayOfUniqueItems] )

const conditions = arrayOf( condition )

const conditionObject = ( x ) => {
  const checks = {
    and: conditions,
    or: conditions,
    not: conditions,
    test: condition,
    include: condition,
    exclude: condition,
  }

  const testProp = y => _.every( y, ( v, k ) => checks[k] && checks[k]( v ) )

  return R.allPass( [isObject, testProp] )( x )
}

function condition( x ) {
  return any( [
    isRegexp,
    nonEmptyString,
    conditions,
    isFunction,
    conditionObject] )( x )
}

const entry = any( [
  nonEmptyString,
  nonEmptyArrayOfUniqueStringValues,
  isFunction,
  everyProp( any( [nonEmptyString, nonEmptyArrayOfUniqueStringValues] ) ),
] )

module.exports = {
  nonEmptyString,
  nonEmptyArrayOfUniqueStringValues,
  condition,
  conditions,
  entry,
  any,
  all,
  everyProp,
  isFunction,
  isRegexp,
  isObject,
  nil,
  notNil,
  or,
  contained,
  contains,
  containsNotNil,
  missing,
  both,
  complement,
  flip,
}

