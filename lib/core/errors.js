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

const stackTrace = require( 'stack-trace' );

class HuttError extends Error {
  constructor( msg ) {
    super( msg );
    Error.captureStackTrace( this, HuttError );
  }

  get parsed() {
    if ( !this._parsed ) {
      this._parsed = stackTrace.parse( this );
    }
    return this._parsed;
  }

  get simpleMessage() {
    return this.message;
  }

  get where() {
    return `File: ${this.parsed[0].getFileName()}, Line: ${this.parsed[0].getLineNumber()}`;
  }
}

class TaskExecError extends HuttError {
  constructor( task, err ) {
    super( '', err );
    this._error = err;
    this._task = task;
  }

  get error() {
    return this._error;
  }

  get simpleMessage() {
    return [
      `Execution failed for task :${this._task.name}`,
      `> ${this.error.message}`,
      `  ${this.where}`,
    ].join( '\n' )
  }

  get task() {
    return this._task;
  }

  get where() {
    const parsed = stackTrace.parse( this.error );
    return `File: ${parsed[0].getFileName()}, Line: ${parsed[0].getLineNumber()}`;
  }
}

module.exports = {
  HuttError,
  TaskExecError,
};

