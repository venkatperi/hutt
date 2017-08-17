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


const { AbstractFactory, JsDsl } = require( 'js-dsl' );
const PluginBase = require( '../../plugin_base' );
const JavaScriptSourceSet = require( './JavaScriptSourceSet' );

class JavaScriptSourceSetBuilder extends JsDsl {
  constructor( parent ) {
    super( 'javascriptSourceSet', parent );
    this.registerMethodNames( ['srcDir', 'srcDirs'] )
  }
}

class JavaScriptSourceSetFactory extends AbstractFactory {
  constructor( instance ) {
    super();
    this._instance = instance;
  }

  getBuilder( parent ) {
    return new JavaScriptSourceSetBuilder( parent );
  }

  newInstance( builder, name, ...args ) {
    return this._instance;
    // return new JavaScriptSourceSet( ...args );
  }
}

class JavaScriptSourceSetPlugin extends PluginBase {
  constructor( opts = {} ) {
    super( 'javascriptSourceSet' );
    const main = opts.project.sourceSets.main;
    this._instance = new JavaScriptSourceSet( {
      name: 'js',
      parent: main,
    } );
    main.add( this._instance );
  }

  registerBuilderItems( builder ) {
    if ( builder.name === 'sourceSetMain' ) {
      builder.registerFactory( 'js',
        new JavaScriptSourceSetFactory( this._instance ) );
    }
  }
}

module.exports = JavaScriptSourceSetPlugin;
