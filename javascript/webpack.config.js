var webpack = require('webpack');
var merge = require('deepmerge');


var commonConfig = {
  entry: {
    'clarifai-basic': './clarifai-basic.js'
    //example: './example.js'
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
  }
  //plugins: [
  //  new webpack.IgnorePlugin(/vertx/)
  //]
};


var browserConfig = merge(commonConfig, {
  output: {
    path: './build/browser/',
    filename: '[name].js',
    sourceMapFilename: '[file].map',
    libraryTarget: 'var',
    library: 'Clarifai'
  },
  target: 'web'
});

var nodeConfig = merge(commonConfig, {
  output: {
    path: './build/node/',
    filename: '[name].js',
    sourceMapFilename: '[file].map',
    libraryTarget: 'umd',
    library: 'Clarifai'
  },
  target: 'node',
  externals: [
    "deepmerge",
    "es6-promise",
    "popsicle",
    "vertex",
    "form-data"
  ]
});


module.exports = [browserConfig, nodeConfig];
