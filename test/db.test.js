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
const db = require( '../lib/db' );
const TaskModel = require( '../lib/db/model/Task' )
const FileModel = require( '../lib/db/model/File' )
const uniqueString = require( 'unique-string' );
const util = require( 'util' );

let taskName = null
let filePath = null

describe( 'db', () => {
  it( 'initialized', () => db.initialize() )
  describe( 'tasks', () => {
    beforeEach( () => {
      taskName = uniqueString();
      filePath = `/a/b/${uniqueString()}`;
    } )

    it( 'add task', () => TaskModel
      .query()
      .insert( { name: taskName } ) )

    it( 'add task with file', () => TaskModel
      .query()
      .insert( { name: taskName } )
      .then( task =>
        task
          .$relatedQuery( 'files' )
          .insert( { path: filePath, size: 9001 } ) )
      .then( () => TaskModel
        .query()
        .eager( 'files' )
        .where( { name: taskName } ) )
      .then( x => console.log( util.inspect( x, { depth: 5 } ) ) ),
    )

    afterEach( () => TaskModel
      .query()
      .delete()
      .where( { name: taskName } ) )
  } )
} );

