/* eslint-disable class-methods-use-this,no-console */
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

const Reporter = require( './Reporter' )
const { logger, prefix } = require( '../util/LOG' )
const _ = require( 'lodash' );
const chalk = require( 'chalk' );

const log = ( tag, level, str ) => {
  tag = prefix( tag, level );
  str.split( '\n' ).forEach( x =>
    logger[level]( tag, x ) )
}

function printError( tag, msg, err ) {
  const lines = [msg]
  lines.push( `Error: ${err.message}` );
  console.log(global._stacktrace)
  if ( global._stacktrace ) {
    lines.push( err.stack );
  }
  log( tag, 'error', lines.join('\n') )
}

function println( tag, str ) {
  if ( !str ) {
    str = tag;
    tag = ''
  }

  logger.report( prefix( tag ), str )
}

function time( t ) {
  return chalk.grey( `(${t}ms)` )
}

class LogReporter extends Reporter {
  constructor( ...args ) {
    super( ...args );
    this.trackers = {}
  }

  buildAfter( proj, opts ) {
    const msg = [
      '',
      chalk[opts.succeeded ? 'green' : 'red']( opts.message ),
      `Total Time: ${opts.time}ms.`].join( '\n' )
    println( msg );
  }

  projectConfigureAfter( proj, opts ) {
    println( 'project', `configure ${time( opts.time )}` )
  }

  projectConfigureError( project, err ) {
    const msg = `Configure failed for project ${project.shortPath}`
    printError( 'project', msg, err );
  }

  projectInitializeAfter( proj, opts ) {
    println( 'project', `initialize ${time( proj._initTimer() )}` )
  }

  projectInitializeError( proj, err ) {
    const msg = `Initialize failed for project ${proj.shortPath}`
    printError( 'project', msg, err );
  }

  projectRunAfter( proj, opts ) {
    println( 'project', `run ${time( opts.time )}` )
  }

  projectRunError( project, err ) {
    const msg = `Execution failed for project ${project.shortPath}`
    printError( 'project', msg, err );
  }

  taskRunAfter( task, opts ) {
    this.trackers[task.name].completeWork( 1 )
    const items = [task.shortPath];
    if ( opts.message ) {
      items.push( opts.message )
    }
    items.push( `${time( opts.time )}` )
    println( 'task', items.join( ' ' ) )
  }

  taskRunBefore( task ) {
    this.trackers[task.name] = logger.newItem( task.name, 1 )
  }

  taskRunError( task, err ) {
    const msg = `Execution failed for task ${task.shortPath}`
    printError( 'task', msg, err );
  }

  taskRunUpdate( task, done ) {
    this.trackers[task.name].completeWork( done )
  }
}

module.exports = LogReporter;
