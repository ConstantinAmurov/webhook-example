module.exports = {
  mode: 'production',
  target: 'node',
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: true,
    __dirname: true
  },
  entry: './scripts/dependencies-export.js',
  output: {
    path: __dirname + '/scripts/',
    filename: 'dependencies.js',
    library: 'dependencies',
    libraryTarget: 'umd'
  },
  resolve: {
    symlinks: false,
    modules: ['node_modules']
  }
};