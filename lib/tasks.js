const spawn = require( 'cross-spawn-promise' );
const pify = require( 'pify' );
const rimraf = pify( require( 'rimraf' ) );
const GLogStream = require( './GLogStream' );

module.exports = ( gulp ) => {
  /**
   * Creates a gulp task which when started spawns the supplied
   * command with arguments.
   *
   * By default, the command output is logged via gutil.log()
   *
   * @param {String} name - the task name
   * @param {string[]} [deps] - task dependencies
   * @param {Object} opts - task options
   * @param {String} opts.cmd - command to run
   * @param {String[]} [opts.cmd] - command arguments
   * @param {Object} [opts.opts] - spawn options {@link https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options }
   * @param {Boolean} [opts.noLog] - Don't log command output
   * @param {String} [opts.tag] - tag to use with log strings
   * @param {Readable} [opts.stdin] - redirect stream to stdin
   * @param {Writable} [opts.stdout] - redirect stdout to stream
   * @param {Writable} [opts.stderr] - redirect stderr to stream
   * @returns {undefined} none
   */
  function spawnTask( name, deps, opts ) {
    [opts, deps] = opts ? [opts, deps] : [deps, null];

    const tag = opts.tag || name;
    const cmdOpts = Object.assign( opts.opts || {} );
    cmdOpts.cwd = opts.cwd || process.cwd();
    cmdOpts.env = Object.assign( {}, process.env, cmdOpts.env, opts.env );

    return gulp.task( name, deps, () => {
      const proc = spawn( opts.cmd, opts.args, opts.opts );
      const child = proc.childProcess;

      if ( child ) {
        if ( opts.stdin ) {
          opts.stdin.pipe( child.stdin );
        }

        child.stderr.pipe( opts.stderr ||
          new GLogStream( { tag } ) );

        if ( opts.stdout ) {
          child.stdout.pipe( opts.stdout );
        } else if ( !opts.noLog ) {
          child.stdout.pipe( new GLogStream( { tag } ) );
        }
      }

      return proc;
    } )
  }

  /**
   * Creates a gulp task which when started, recursively removes
   * files and directories with the given glob
   *
   * @param {String} name - the task name
   * @param {string[]} [deps] - gulp task dependencies
   * @param {Object} opts - options
   * @param {string} opts.dir - the dir(s) to remove
   */
  const rmdirTask = ( name, deps, opts ) => {
    [opts, deps] = opts ? [opts, deps] : [deps, null];
    gulp.task( name, deps, () => rimraf( opts.dir ) )
  };

  /**
   * Creates a gulp task which when started, wait for the
   * supplied milliseconds before completing.
   *
   * @param {String} name - the task name
   * @param {string[]} [deps] - gulp task dependencies
   * @param {Object} opts - options
   * @param {Number} opts.duration - the time to wait in milliseconds
   */
  const delayTask = ( name, deps, opts ) => {
    [opts, deps] = opts ? [opts, deps] : [deps, null];
    return gulp.task( name, deps, ( done ) => {
      setTimeout( done, opts.duration )
    } )
  };

  /**
   * Runs node
   *
   * @param name
   * @param deps
   * @param opts
   * @returns {undefined}
   */
  const nodeTask = ( name, deps, opts ) => {
    [opts, deps] = opts ? [opts, deps] : [deps, null];
    opts = opts || {};
    opts.cmd = opts.cmd || 'node';
    return spawnTask( name, deps, opts )
  };


  /**
   * spawns webpack
   *
   * @param name
   * @param deps
   * @param opts
   * @returns {undefined}
   */
  const webpackTask = ( name, deps, opts ) => {
    [opts, deps] = opts ? [opts, deps] : [deps, null];
    opts = opts || {};
    opts.cmd = opts.cmd || './node_modules/.bin/webpack';
    return spawnTask( name, deps, opts )
  };

  /**
   * Runs webpack dev server
   *
   * @param name
   * @param deps
   * @param opts
   * @returns {undefined}
   */
  const webpackDevServerTask = ( name, deps, opts ) => {
    [opts, deps] = opts ? [opts, deps] : [deps, null];
    opts = opts || {};
    opts.cmd = opts.cmd || './node_modules/.bin/webpack-dev-server'
    return spawnTask( name, deps, opts )
  };

  /**
   * Runs mocha as a gulp task
   *
   * @param name
   * @param deps
   * @param opts
   * @returns {undefined}
   */
  const mochaTask = ( name, deps, opts ) => {
    [opts, deps] = opts ? [opts, deps] : [deps, null];
    opts = opts || {};
    opts.cmd = opts.cmd || 'mocha';
    return spawnTask( name, deps, opts )
  };

  return {
    mochaTask,
    nodeTask,
    spawnTask,
    rmdirTask,
    delayTask,
    webpackTask,
    webpackDevServerTask,
  }
};

