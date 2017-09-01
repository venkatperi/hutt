/* eslint-disable no-nested-ternary,class-methods-use-this,no-console */
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

const path = require( 'path' );
const arrayp = require( 'arrayp' );
const Base = require( './Base' );
const assert = require( 'assert' );
const LOG = require( '../util/LOG' )( 'hutt:Task' );
const TaskModel = require( '../db/model/Task' )
const { set } = require( '../util/Rhelpers' )
const _ = require( 'lodash' );
const R = require( 'ramda' );
const File = require( './File' )

const outcomes = {
  // 'Task executed its actions',
  Executed: 'EXECUTED',

  // 'Task\'s outputs did not change',
  UpToDate: 'UP-TO-DATE',

  // 'Task\'s outputs could be found from a previous execution',
  FromCache: 'FROM-CACHE',

  // 'Task did not execute its actions',
  Skipped: 'SKIPPED',

  // 'Task did not need to execute its actions',
  NoSource: 'NO-SOURCE',
}

class Task extends Base {
  constructor( name, opts = {} ) {
    assert( name, 'Task needs a name' )
    opts.prefix = 'task';
    opts.parent = opts.parent || opts.project;
    super( name, opts );
    this._dependencies = opts.dependsOn || []
    this._actions = [this.action.bind( this )]
    this._before = []
    this._after = []
    this._extName = opts.extName;
    this._inputs = null;
    this._outputs = null;
    this._outcome = null;
    this._query = null;

    // state stuff
    this._didWork = false;
    LOG.v( `task: ${this.name}` )
  }

  static get Outcomes() {
    return outcomes;
  }

  get actions() {
    return this._actions;
  }

  get after() {
    return this._after;
  }

  get before() {
    return this._before;
  }

  get buildDir() {
    return this.project.buildDir;
  }

  get changedInputs() {
    return this._inputsCache.changed
  }

  get changedOutputs() {
    return this._outputsCache.changed
  }

  get dependencies() {
    return this._dependencies;
  }

  get didWork() {
    return this._didWork;
  }

  set didWork( value ) {
    this._didWork = value;
  }

  get executed() {
    return this._executed;
  }

  set executed( value ) {
    this._executed = value;
  }

  get extName() {
    return this._extName;
  }

  get extension() {
    return this.project.extensions[this._extName];
  }

  get failure() {
    return this._failure;
  }

  set failure( value ) {
    this._failure = value;
  }

  get fileCacheDir() {
    return this.project.fileCacheDir;
  }

  get inputs() {
    return this._inputs;
  }

  set inputs( value ) {
    this._inputs = R.map( x => x.clone() )( value || [] )
    R.forEach( this.addChild.bind( this ) )( this._inputs )
  }

  get noSource() {
    return this._noSource;
  }

  set noSource( value ) {
    this._noSource = value;
  }

  get outcome() {
    return this._outcome;
  }

  set outcome( value ) {
    this._outcome = value;
    LOG.i( `${this.path} - ${value}` )
  }

  get outputs() {
    return this._outputs;
  }

  get path() {
    return `${this.project.path}${this.shortPath}`
  }

  get project() {
    return this._parent;
  }

  set project( value ) {
    this._parent = value;
  }

  get projectDir() {
    return this.project.projectDir;
  }

  get query() {
    return this._query;
  }

  get shortPath() {
    return `:${this.name}`
  }

  get skipMessage() {
    return this._skipMessage;
  }

  set skipMessage( value ) {
    this._skipMessage = value;
  }

  get skipped() {
    return this._skipped;
  }

  set skipped( value ) {
    this._skipped = value;
  }

  get upToDate() {
    return this._upToDate;
  }

  set upToDate( value ) {
    this._upToDate = value;
  }

  static create( type, ...args ) {
    const name = _.upperFirst( type )
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const Klass = require( path.resolve( __dirname, '../tasks', name ) )
    return new Klass( ...args );
  }

  /**
   * The action to run when the task is executed.
   * @returns {Promise.<undefined>}
   */
  action() {
    this.outcome = Task.Outcomes.UpToDate;
    return Promise.resolve();
  }

  actuallyConfigure() {
    this.project.orchestrator.task(
      this.name,
      this._dependencies,
      this.run.bind( this ) )

    return arrayp.chain( [
      this.loadInputs.bind( this ),
      set( this, 'inputs' ),
      this.loadOutputs.bind( this ),
      set( this, '_outputs' ),
      this.checkInputs.bind( this ),
    ] );
  }

  actuallyInitialize() {
    const knex = this.project.knex;
    assert( knex, 'no knex?' )

    this._dbModel = TaskModel;
    this._query = () => TaskModel.query( this.project.knex )
    const query = { name: this.name }
    return arrayp.chain( [
      () => this.query().eager( 'files' ).where( query ),
      res => (res.length === 0 ? this.query().insert( query ) : res[0]),
      set( this, '_dbItem' ),
    ] )
  }

  actuallyRun() {
    return arrayp.chain( [
      ...this._before,
      ...this._actions,
      ...this._after,
    ] )
  }

  checkInputs() {
  }

  dependsOn( ...args ) {
    this._dependencies = this._dependencies.concat( args )
  }

  do$( fn, pos ) {
    if ( typeof fn !== 'function' ) {
      return this.emit( 'error', `action is not a function in task ${this.name}` )
    }
    const arr = pos === 'before' ? this._before : pos === 'after' ? this._after : this._actions;
    return arr.push( fn );
  }

  doFirst( fn ) {
    this.do$( fn, 'before' )
  }

  doLast( fn ) {
    this.do$( fn, 'after' )
  }

  initGraph() {
    return Promise.resolve();
  }

  loadInputs() {
    return Promise.resolve();
  }

  loadOutputs() {
    return Promise.resolve();
  }

  readFile( file ) {
    return this.project.readFile( file.path || file )
  }

  update( work, msg ) {
    this.emit( 'run:update', work, msg )
  }
}

module.exports = Task;
