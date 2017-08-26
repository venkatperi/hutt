/* globals project$ */
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

const LogReporter = require( './reporter/LogReporter' );
const _ = require( 'lodash' );
const ProjectLoader = require( './ProjectLoader' )
const arrayp = require( 'arrayp' );
// eslint-disable-next-line no-unused-vars
const stdio = require( './util/stdio' )
const Base = require( './core/Base' )
const LOG = require( './util/LOG' )( 'hutt:Hutt' );

class Hutt extends Base {
  constructor( opts = {} ) {
    stdio();
    _.extend( opts, { prefix: 'hutt' } )
    super( opts );
    this._loader = new ProjectLoader( opts )
    this._reporters = [new LogReporter( opts )]
    this._project = null;
  }

  get loader() {
    return this._loader;
  }

  get project() {
    return this._project;
  }

  set project( value ) {
    this._project = value;
  }

  get reporters() {
    return this._reporters;
  }

  actuallyConfigure() {
    return this.project.configure();
  }

  actuallyInitialize() {
    return this.project.initialize()
      .then( ( res ) => {
        const count = this.project.allProjects.length;
        this._messages.initialize = `${count + 1} projects loaded.`
        return res;
      } )
  }

  actuallyRun() {
    return this.project.run();
  }

  load( ...args ) {
    this.emit( 'build:before' )
    this._project = this._loader.load( ...args )
    return arrayp.chain( [
      this.initialize.bind( this ),
      this.configure.bind( this ),
      this.run.bind( this ),
    ] ).then( ( res ) => {
      this.emit( 'build:after' )
      return res
    } )
  }
}

module.exports = Hutt;

