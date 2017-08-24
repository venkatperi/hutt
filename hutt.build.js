apply( { plugins: ['babel', 'sass'] } )
includeFlat( 'hutt-cli', 'hutt-plugin-sourceset-js' )

babel( {
  presets: ['es2015'],
  sourceMaps: true,
} )

task( 'default', { dependsOn: ['build'] } )
