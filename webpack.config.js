const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, './src'),
  mode: 'production',
  entry: {
    'contentScripts/worker': './contentScripts/worker.js',
    'background/browserAction': './background/browserAction.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['js', 'json'],
  },
  module: {
    rules: [
      {
        test: '/\.html$/',
        use: 'html-loader'
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        context: '../',
        from: 'src/manifest.json'
      },
      {
        context: '../',
        from: 'src/icons',
        to: 'icons/'
      },
      {
        context: '../',
        flatten: true,
        from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'
      }
    ])
  ]
}
