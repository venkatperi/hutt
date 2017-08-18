/* eslint-disable class-methods-use-this */
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

const { JsDsl, AbstractFactory } = require( 'js-dsl' );

function factory( opts ) {
  return class extends AbstractFactory {
    constructor( ...args ) {
      super();
      if ( opts.singleInstance ) {
        this._instance = args[0];
      }
    }

    getBuilder( parent ) {
      return opts.BuilderClass ? new opts.BuilderClass( parent ) : null;
    }

    newInstance( builder, name, ...args ) {
      return this._instance || new opts.ItemClass( ...args );
    }
  }
}

function builder( opts ) {
  return class extends JsDsl {
    constructor( parent ) {
      super( opts.name, parent );
      if ( opts.methodNames ) {
        this.registerMethodNames( opts.methodNames );
      }
      if ( opts.propertyNames ) {
        this.registerPropertyNames( opts.propertyNames );
      }
      if ( opts.factories ) {
        _.forOwn( opts.factories, ( v, k ) =>
          this.registerFactory( k, v ) )
      }
    }
  }
}

module.exports = {
  factory,
  builder,
}
