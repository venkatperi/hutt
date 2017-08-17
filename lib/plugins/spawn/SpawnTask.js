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

const Task = require( '../../Task' );
const spawn = require( 'cross-spawn-promise' );


class SpawnTask extends Task {
  constructor( name, opts = {} ) {
    super( name, opts );
    this._executable = null;
    this._workingDir = process.cwd();
    this._args = [];
    this._environment = {};
    this._standardInput = null;
    this._standardOutput = null;
    this._errorOutput = null;
    this._ignoreExitValue = false;
  }

  get args() {
    return this._args;
  }

  set args( value ) {
    this._args = value;
  }

  get environment() {
    return this._environment;
  }

  set environment( value ) {
    this._environment = value;
  }

  get errorOutput() {
    return this._errorOutput;
  }

  set errorOutput( value ) {
    this._errorOutput = value;
  }

  get executable() {
    return this._executable;
  }

  set executable( value ) {
    this._executable = value;
  }

  get ignoreExitValue() {
    return this._ignoreExitValue;
  }

  set ignoreExitValue( value ) {
    this._ignoreExitValue = value;
  }

  get standardInput() {
    return this._standardInput;
  }

  set standardInput( value ) {
    this._standardInput = value;
  }

  get standardOutput() {
    return this._standardOutput;
  }

  set standardOutput( value ) {
    this._standardOutput = value;
  }

  get workingDir() {
    return this._workingDir;
  }

  set workingDir( value ) {
    this._workingDir = value;
  }

  action() {
    const opts = {
      cwd: this._workingDir,
      env: Object.assign( {}, process.env, this._environment ),
    };

    const proc = spawn( this._executable, this._args, opts );
    const child = proc.childProcess;

    if ( child ) {
      if ( this._standardInput ) {
        this._standardInput.pipe( child.stdin );
      }

      if ( this._errorOutput ) {
        child.stderr.pipe( this._errorOutput )
      }

      if ( this._standardOutput ) {
        child.stdout.pipe( this._standardOutput );
      }
    }
    return proc;
  }

  arg( ...x ) {
    this._args = this._args.concat( x );
  }

  env( name, value ) {
    this._environment[name] = value;
  }
}

module.exports = SpawnTask;
