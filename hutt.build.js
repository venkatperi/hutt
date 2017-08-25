apply( { plugins: ['babel', 'sass'] } )

includeFlat(
  'hutt-cli',
  'hutt-plugin-sourceset-js',
  'hutt-plugin-sourceset-sass',
  'hutt-plugin-babel',
  'hutt-plugin-sass',
)

babel( {
  presets: ['es2015'],
  sourceMaps: true,
} )

sourceSets( () => {
  main( () => {
    js( () => {
      include( 'index.js' )
    } )
  } )
} )

task( 'default', { dependsOn: ['build'] } )
