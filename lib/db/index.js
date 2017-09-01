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

const Knex = require( 'knex' );
const arrayp = require( 'arrayp' );
const LOG = require( '../util/LOG' )( 'hutt:db' );
const Base = require( '../core/Base' );
const _ = require( 'lodash' );

const config = project => ({
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: project.resolveHuttFile( 'hutt.db' ),
  },
});

class Db extends Base {
  constructor( opts ) {
    super( _.extend( opts, { prefix: 'db' } ) );
    this._project = opts.project;
    this._knex = null;
  }

  get knex() {
    return this._knex;
  }

  get project() {
    return this._project;
  }

  actuallyDestroy() {
    return this.knex.destroy()
  }

  actuallyInitialize() {
    this._knex = Knex( config( this.project ) )
    return arrayp.chain( [
      () => this.knex.migrate.latest(),
      res => LOG.i( `migration(${this.project.name}): ${res}` ),
    ] )
  }
}

module.exports = Db

