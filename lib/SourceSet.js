/* eslint-disable no-nested-ternary */
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

const glob = require( 'glob' );
const _ = require( 'lodash' );
const path = require( 'path' );

class SourceSet {
  constructor( opts = {} ) {
    this._name = opts.name;
    this._parent = opts.parent;
    this._sourceDirs = [];
    this._entries = [];
  }

  get allSource() {
    const project = this.project;
    return _.flatten(
      this._sourceDirs
        .map( x => path.join( project.projectDir, x ) )
        .map( x => glob.sync( x ) )
        .concat(
          this._entries.map( x => x.allSource ) ) );
  }

  get entries() {
    return this._entries;
  }

  get name() {
    return this._name;
  }

  get parent() {
    return this._parent;
  }

  get project() {
    return !this._parent ? this : this._parent.project
  }

  add( sourceSet ) {
    this._entries.push( sourceSet )
  }

  toString() {
    return `SourceSet(${this._name}) [${this._entries.map( String ).join( ', ' )}]`
  }
}

module.exports = SourceSet;
