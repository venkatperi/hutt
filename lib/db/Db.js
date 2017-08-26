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

const Sequelize = require( 'sequelize' );
const stat = require( './model/stat' )
const LOG = require( '../util/LOG' )( 'hutt:SourceSetTask' );

const log = (...args) => LOG.i(...args)

class Db {
  constructor( opts = {} ) {
    this._project = opts.project;
    this._sequelize = null;
    this.init();
    this.initModels();
    this._initialized = this._sequelize.sync();
  }

  get dbFile() {
    return this._project.resolveHuttFile( 'hutt.db' )
  }

  get initialized() {
    return this._initialized;
  }

  get sequelize() {
    return this._sequelize;
  }

  init() {
    this._sequelize = new Sequelize( undefined, undefined, undefined, {
      dialect: 'sqlite',
      storage: this.dbFile,
      define: {
        underscored: true,
        // prevent sequelize from pluralizing table names
        freezeTableName: true,
      },
      logging: ['verbose', 'debug', 'info'].indexOf( global._logLevel ) >= 0,
      // logging: log,
    } );
  }

  initModels() {
    this.stats = stat( this.sequelize, Sequelize );
  }
}

Db.Sequelize = Sequelize;

module.exports = Db;