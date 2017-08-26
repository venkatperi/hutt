/* eslint-disable no-unused-vars,class-methods-use-this */
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
const Task = require( './Task' );
const path = require( 'path' );
const arrayp = require( 'arrayp' );
const _ = require( 'lodash' );
const R = require( 'ramda' );
const LOG = require( '../util/LOG' )( 'hutt:SourceSetTask' );

const same = R.allPass( [
  R.eqProps( 'mtime' ),
  R.eqProps( 'ctime' ),
  R.eqProps( 'size' ),
] )

const notSame = R.complement( same );

class SourceSetTask extends Task {
  constructor( name, opts = {} ) {
    super( name, opts );
    assert( opts.sourceSetName, 'Source set name is missing' )
    this._sourceSetName = opts.sourceSetName;
  }

  get changedInputs() {
    return arrayp.chain( [
      this.inputs,
      R.filter( x => x.status !== 'unchanged' ),
    ] )
  }

  get inputs() {
    return this.project.sourceSets$
      .main[this._sourceSetName].allSource;
  }

  get sourceSetName() {
    return this._sourceSetName;
  }

  set sourceSetName( value ) {
    this._sourceSetName = value;
  }

  action() {
    return arrayp.chain( [
      this.changedInputs,
      this.processInputs.bind( this ),
    ] );
  }

  checkInputs() {
    return arrayp.chain( [
      this.inputs,
      inputs => arrayp.chain(
        R.map( this.fileStatus.bind( this ), inputs ) ),
    ] )
  }

  doProcessFile( file ) {
    return Promise.resolve()
  }

  fileStatus( file ) {
    return arrayp.chain( [
      this.project.db,
      db => db.stats.findOne( { where: { path: file.path } } ),
      // ( x ) => {
      //   console.log( x );
      //   return x;
      // },
      R.cond( [
        [R.isNil, R.always( 'new' )],
        [notSame( file.stat ), R.always( 'modified' )],
        [R.T, R.always( 'unchanged' )],
      ] ),
      ( status ) => {
        file.status = status
        LOG.i( `${file.path}: ${status}` )
      },
    ] )
  }

  outputFileName( file ) {
    return path.resolve( this.project.buildDir,
      path.relative( this.project.projectDir, file ) )
  }

  processFile( file ) {
    return Promise.resolve()
  }

  processInputs( files ) {
    this.log.i( `Processing ${files.length} file(s).` )
    let done = 0;

    const fireUpdate = () => this.update( (done++) / files.length )
    const setResult = () => {
      this.messages.run = `${files.length} file(s)`;
    }

    const process = f => arrayp.chain( [
      this.processFile( f ),
      fireUpdate,
    ] )

    return arrayp.chain( files
      .map( process )
      .concat( [setResult,
        this.processingComplete.bind( this )] ) )
  }

  processingComplete() {
    return arrayp.chain( [
      this.changedInputs,
      inputs => arrayp.chain(
        R.map( this.updateCache.bind( this ) )( inputs ) ),
    ] )
  }

  updateCache( file ) {
    const attr = R.pick( ['size', 'mtime', 'ctime'], file.stat )
    attr.path = file.path;
    // console.log(attr);
    return arrayp.chain( [
      this.project.db,
      db => db.stats.upsert( attr,
        { where: { path: file.path } } ),
    ] )
  }
}

module.exports = SourceSetTask;
