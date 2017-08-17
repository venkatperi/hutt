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


const _ = require( 'lodash' );
const { AbstractFactory, JsDsl } = require( 'js-dsl' );
const PluginBase = require( '../../plugin_base' );
const SourceSets = require( '../../SourceSets' );

class SourceSetFactory extends AbstractFactory {
  constructor( instance ) {
    super();
    this._sourceSet = instance;
  }

  getBuilder( parent ) {
    return new SourceSetBuilder( parent, this._sourceSet );
  }

  newInstance() {
    return this._sourceSet;
  }
}

class SourceSetBuilder extends JsDsl {
  constructor( parent, instance ) {
    super( `sourceSet${_.upperFirst( instance.name )}`, parent );
    this._sourceSet = instance;
  }
}

class SourceSetsBuilder extends JsDsl {
  constructor( parent, instance ) {
    super( 'sourceSets', parent );
    this._sourceSets = instance;
    Object.values( this._sourceSets.entries ).forEach( ( set ) => {
      this.registerFactory( set.name, new SourceSetFactory( set ) );
    } )
  }
}

class SourceSetsFactory extends AbstractFactory {
  constructor( instance ) {
    super();
    this._sourceSets = instance;
  }

  getBuilder( parent ) {
    return new SourceSetsBuilder( parent, this._sourceSets );
  }

  newInstance() {
    return this._sourceSets;
  }
}

class SourceSetsPlugin extends PluginBase {
  constructor( opts = {} ) {
    super( 'sourceSets' );
    this._sourceSets = opts.sourceSets;
  }

  get sourceSets() {
    return this._sourceSets;
  }

  registerBuilderItems( builder ) {
    if ( builder.name === 'project' ) {
      builder.registerFactory( 'sourceSets', new SourceSetsFactory( this._sourceSets ) );
    }
  }

}

module.exports = SourceSetsPlugin;
