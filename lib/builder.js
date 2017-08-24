/* eslint-disable no-use-before-define,class-methods-use-this */
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

const { AbstractFactory, JsDsl } = require( 'js-dsl' );
const Task = require( './core/Task' );
const { factoryClass } = require( './util/classBuilders' );


class TaskBuilder extends JsDsl {
  constructor( name, parent ) {
    super( name || 'task', parent );
  }

  register() {
    this.registerMethodNames( ['do$'] );
  }
}

const TaskFactory = factoryClass( {
  ItemClass: Task,
  BuilderClass: TaskBuilder,
} );

class ProjectBuilder extends JsDsl {
  constructor( parent ) {
    super( 'project', parent );
  }

  register() {
    this.registerPropertyNames( [
      'sourceSets$', 'name', 'description',
      'projectDir', 'buildDir', 'proj'] );
    this.registerFactory( 'task', new TaskFactory() );
    this.registerMethodNames( ['getTask', 'mkdir'] )
  }
}

class ProjectFactory extends AbstractFactory {
  constructor( project ) {
    super();
    this._project = project;
  }

  getBuilder( parent ) {
    return new ProjectBuilder( parent );
  }

  newInstance() {
    return this._project;
  }

  setChild( builder, project, child ) {
    if ( child instanceof Task ) {
      project._addTask( child )
    }
  }
}

class RootBuilder extends JsDsl {
  constructor( project ) {
    super( 'root' );
    this.registerFactory( 'project$', new ProjectFactory( project ) );
    this.registerMethodNames( ['apply'] )
  }
}

module.exports = RootBuilder;
