/* eslint-disable no-plusplus,no-return-assign */
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

const assert = require( 'assert' );
const Base = require( '../lib/core/Base' )
const phases = require( '../lib/core/phases' )
const arrayp = require( 'arrayp' );
const R = require( 'ramda' );
const { notEmpty } = require( '../lib/util/Rhelpers' );

const prefix = 'rootType'
const opts = { prefix }
const name = 'root'

describe( 'Base', () => {
  let root = null;
  let a = null;
  let b = null;
  let aa = null;
  let ab = null;
  let ba = null;
  let baa = null;

  beforeEach( () => {
    root = new Base( name, opts )
    a = new Base( 'a', { parent: root, prefix: 'typeA' } )
    b = new Base( 'b', { parent: root, prefix: 'typeB' } )
    aa = new Base( 'aa', { parent: a, prefix: 'typeA' } )
    ab = new Base( 'ab', { parent: a, prefix: 'typeB' } )
    ba = new Base( 'ba', { parent: b, prefix: 'typeA' } )
    baa = new Base( 'baa', { parent: ba, prefix: 'typeA' } )
  } )

  it( 'needs prefix', () => {
    assert.throws( () => new Base() )
  } );

  it( 'args(name, opts)', () => {
    assert.equal( root.name, name )
    assert.equal( root.prefix, prefix, 'returns the prefix' )
    assert.equal( root.opts, opts, 'stores opts' )
    assert.equal( root.longName, `${opts.prefix}:${name}`, 'not to be confused with path' )
    assert.equal( root.root, root, "we're the root" );
    assert( root.enabled, 'enabled by default' )
  } );

  describe( 'children', () => {
    it( 'parent', () => {
      assert.equal( a.parent.name, 'root' )
      assert.equal( aa.parent.name, 'a' )
      assert.equal( ab.parent.name, 'a' )
      assert.equal( ba.parent.name, 'b' )
      assert.equal( baa.parent.name, 'ba' )
    } )

    it( 'children', () => {
      assert( notEmpty( root.children ) )
      assert.deepEqual( root.children.map( R.prop( 'name' ) ), ['a', 'b'] )
      assert.deepEqual( a.children.map( R.prop( 'name' ) ), ['aa', 'ab'] )
    } )

    it( 'root', () => {
      assert( root.isRoot )
      assert( !aa.isRoot )
      assert.equal( root.root.name, 'root' )
      assert.equal( baa.root.name, 'root' )
      assert.equal( ba.root.name, 'root' )
      assert.equal( aa.root.name, 'root' )
      assert.equal( ab.root.name, 'root' )
    } )

    it( 'ancestor', () => {
      assert.equal( baa.getParentOfType( 'typeA' ).name, 'ba' )
      assert.equal( baa.getParentOfType( 'typeB' ).name, 'b' )
      assert.equal( ab.getParentOfType( 'typeA' ).name, 'a' )
      assert( !ab.getParentOfType( 'typeC' ) )
    } )
  } );

  describe( 'phases', () => {
    it( 'initial phase is null', () =>
      assert.equal( root.phase, null, 'initial phase must be null' ),
    )

    it( 'sequences through phases on nextPhase()', () =>
      phases.forEach( ( phase, i ) => {
        root.nextPhase();
        assert.equal( root.phase, phases[i], `expecting phase ${phases[i]}` );
      } ),
    )

    it( 'emits events when changing phases', () => {
      let count = 0;
      phases.forEach( ( phase ) => {
        root
          .on( `${phase}:before`, () => count++ )
          .on( `${phase}:after`, () => count++ )
      } )
      return arrayp.chain( [
        ...phases.map( () => root.nextPhase() ),
        () => assert.equal( count, phases.length * 7 * 2 ),
      ] )
    } )
  } )


  describe( 'messages', () => {
    it( 'find by type', () => {
      root.message( { level: 'info', message: 'msg 1' } )
      assert( notEmpty( root.findMessagesByLevel( 'info' ) ) )
      assert( notEmpty( root.infoMessages ) )
      assert( R.empty( root.findMessagesByLevel( 'warn' ) ) )
      assert( R.empty( root.findMessagesByLevel( 'error' ) ) )
      it( 'add multiple', () => {
        root.message( [
          { level: 'error', message: 'msg 1' },
          { level: 'warn', message: 'warning' }] )
        assert( !R.isEmpty( root.errorMessages ) )
        assert( !R.isEmpty( root.warnMessages ) )
      } )
    } )
  } )

  describe( 'hasErrors', () => {
    it( 'reports instance errors', () => {
      root.message( { level: 'info', message: 'msg 1' } )
      assert( !root.hasErrors )

      baa.message( { level: 'error', message: 'error msg' } )
      assert( root.hasErrors )

      root.message( { level: 'error', message: 'error msg' } )
      assert( root.hasErrors )
    } )
  } )

} );

