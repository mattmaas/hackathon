var webpack = require('webpack');

module.exports = {
  entry: {
    'clarifai-basic': './clarifai-basic.js'
    //example: './example.js'
  },
  output: {
    path: './build',
    filename: '[name].js',
    sourceMapFilename: '[file].map'
  },
  module: {
    loaders: [{
      test: /\.(jsx|js)?$/,
      exclude: /node_modules/,
      loader: 'babel-loader?stage=0&optional=runtime'
    },
    {
      test: /\.json$/,
      loader: 'json-loader'
    }]
  },
  resolve: {
    root: __dirname,
    extensions: ['', '.js', '.jsx']
  },
  target: 'node',
  plugins: [
    new webpack.IgnorePlugin(/vertx/),
  ]
};
