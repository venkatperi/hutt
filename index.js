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


const Project = require( './lib/core/Project' )
const Task = require( './lib/core/Task' )
const SourceSetTask = require( './lib/core/SourceSetTask' )
const BuildTask = require( './lib/core/BuildTask' )
const PluginBase = require( './lib/core/PluginBase' )
const SourceSet = require( './lib/core/SourceSet' )
const SourceSets = require( './lib/core/SourceSets' )
const Hutt = require( './lib/hutt' )
const SpawnTask = require( './lib/plugins/spawn/SpawnTask' );
const transformTaskPluginClass = require( './lib/plugins/transform/TransformTaskPlugin' )
const taskPluginClass = require( './lib/plugins/task/TaskPlugin' )
const sourceSetPluginClass = require( './lib/plugins/sourceSet/sourceSetPluginClass' )
const { factoryClass, builderClass } = require( './lib/util/classBuilders' )
const LOGGER = require( './lib/util/LOG' )
const LogWritable = require( './lib/util/LogWritable' )

module.exports = {
  SpawnTask,
  taskPluginClass,
  Project,
  Task,
  SourceSet,
  SourceSets,
  SourceSetTask,
  PluginBase,
  BuildTask,
  Hutt,
  factoryClass,
  builderClass,
  transformTaskPluginClass,
  sourceSetPluginClass,
  LOGGER,
  LogWritable,
}
