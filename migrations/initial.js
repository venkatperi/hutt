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
const arrayp = require( 'arrayp' );

exports.up = ( knex ) => {
  return arrayp.chain( [
    () => knex.schema.createTable( 'Task', ( table ) => {
      table.increments( 'id' ).primary();
      table.string( 'name' ).unique();
    } ),

    () => knex.schema.createTable( 'File', ( table ) => {
      table.increments( 'id' ).primary();
      table.string( 'path' ).unique();
    } ),

    () => knex.schema.createTable( 'Task_File', ( table ) => {
      table.increments( 'id' ).primary();
      table.integer( 'fileId' ).unsigned().references( 'id' ).inTable( 'File' ).onDelete( 'CASCADE' );
      table.integer( 'taskId' ).unsigned().references( 'id' ).inTable( 'Task' ).onDelete( 'CASCADE' );
      table.integer( 'size' )
      table.dateTime( 'ctime' )
      table.dateTime( 'mtime' )
    } ),
  ] )
}

exports.down = ( knex ) => {
  return knex.schema
    .dropTableIfExists( 'Task' )
    .dropTableIfExists( 'File' )
    .dropTableIfExists( 'Task_File' )
}

