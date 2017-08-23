/* eslint-disable class-methods-use-this,no-use-before-define */
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


const PluginBase = require( '../../core/PluginBase' );
const { factoryClass, builderClass } = require( '../../util/classBuilders' )
const SourceSet = require( '../../core/SourceSet' );
const _ = require( 'lodash' );

function sourceSetClass( opts2 = {} ) {
  return class extends SourceSet {
    constructor( opts ) {
      super( _.extend( {}, opts2, opts ) );
    }
  }
}

function sourceSetPluginClass( opts2 = {} ) {
  const B = builderClass( {
    name: opts2.name,
    methodNames: ['include', 'exclude'],
  } )

  const F = factoryClass( {
    singleInstance: true,
    BuilderClass: B,
  } )

  const S = sourceSetClass( opts2 );

  return class extends PluginBase {
    constructor( opts = {} ) {
      super( _.extend( {}, opts2, opts ) );
      const main = this.project.sourceSets.main;
      this._instance = new S( {
        parent: main,
      } );
      main.add( this._instance );
    }

    registerBuilderItems( bldr ) {
      if ( bldr.name === 'sourceSetMain' ) {
        bldr.registerFactory( this._name,
          new F( this._instance ) );
      }
    }
  }
}

module.exports = sourceSetPluginClass;
