/* eslint-disable no-unused-vars,class-methods-use-this,no-plusplus */
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
const { set, chain, notEquals, toArr, getOrInit } = require( '../util/Rhelpers' )
const { findOrInsert } = require( '../db/helpers' )
const FileModel = require( '../db/model/File' )

const spy = ( x ) => {
  LOG.i( x );
  return x;
}

const same = R.allPass( [
  R.eqProps( 'mtime' ),
  R.eqProps( 'ctime' ),
  R.eqProps( 'size' ),
] )

const notSame = R.complement( same );

const xStatus = R.lensProp( 'status' )
const vStatus = R.view( xStatus )

const xStat = R.lensProp( 'stat' )
const vStat = R.view( xStat )

const xPath = R.lensProp( 'path' )
const vPath = R.view( xPath )
const omitPath = R.omit( ['path'] )

class SourceSetTask
  extends Task {
  constructor( name, opts = {} ) {
    super( name, opts );
    assert( opts.sourceSetName, 'Source set name is missing' )
    this._sourceSetName = opts.sourceSetName;
  }

  get cachedFiles() {
    return getOrInit( 'cachedFiles', () =>
      R.pipe(
        R.map( R.converge( toArr, [vPath, omitPath] ) ),
        R.fromPairs,
      )( this.dbItem.files || [] ),
    )( this )
  }

  get changedInputs() {
    return getOrInit( 'changedInputs', () =>
      R.filter(
        R.pipe( vStatus, notEquals( 'unchanged' ) ),
      )( this.inputs ),
    )( this )
  }

  get sourceSetName() {
    return this._sourceSetName;
  }

  set sourceSetName( value ) {
    this._sourceSetName = value;
  }

  action() {
    return this.processInputs( this.changedInputs )
  }

  actuallyProcess( files ) {
    let done = 0;
    this.on( 'processFile:after', () => {
      this.update( (done++) / files.length );
    } )

    this.on( 'process:after', () => {
      this.outcome = 'EXECUTED'
      this.message( { level: 'info', message: `${files.length} file(s)` } );
    } )

    const process = file => [
      () => this.emit( 'processFile:before', file ),
      () => this.processFile( file ),
      () => this.updateCacheItem( file ),
      () => this.emit( 'processFile:after', file ),
    ]

    // files.forEach( x => x.prefetch() )
    return arrayp.chain( _.flatten( [
      () => this.emit( 'process:before' ),
      ...files.map( process ),
      () => this.emit( 'process:after' ),
    ] ) )
  }

  checkInputs() {
    R.forEach( this.setFileStatus.bind( this ) )( this.inputs )
  }

  doProcessFile( file ) {
    return Promise.resolve()
  }

  loadInputs() {
    return this.project.sourceSets$
      .main[this._sourceSetName].allSource;
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
    return R.either(
      this.upToDateOrNoSource.bind( this ),
      this.actuallyProcess.bind( this ),
    )( files )
  }

  setFileStatus( file ) {
    const cached = this.cachedFiles[file.path]
    file.status = R.cond( [
      [R.isNil, R.always( 'new' )],
      [notSame( file.stat ), R.always( 'modified' )],
      [R.T, R.always( 'unchanged' )],
    ] )( cached );
  }

  upToDateOrNoSource( files ) {
    if ( files.length === 0 ) {
      this.outcome = this.inputs.length !== 0
        ? 'UP-TO-DATE'
        : 'NO-SOURCE';
      return Promise.resolve();
    }
    return null;
  }

  updateCache( files ) {
    if ( files.length === 0 ) {
      return Promise.resolve();
    }
    const _files = R.map(
      x => R.assoc( 'path', x.path, x.stat ),
    )( this.inputs )

    return this.query().upsertGraph( {
      name: this.name,
      files: _files,
    }, { relate: true } )
  }

  updateCacheItem( file ) {
    return file.hasErrors
      ? Promise.resolve()
      : arrayp.chain( [
        () => findOrInsert( FileModel,
          { path: file.path },
          { knex: this.project.knex } ),
        f => this.dbItem
          .$relatedQuery( 'files', this.project.knex )
          .relate( R.assoc( 'path', file.path, file.stat ) ),
      ] );
  }
}

module.exports = SourceSetTask;
