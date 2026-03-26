import path from 'path';
import { fileURLToPath } from 'url';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
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
    extensions: ['.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: 'html-loader'
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          context: path.resolve(__dirname),
          from: 'src/manifest.json'
        },
        {
          context: path.resolve(__dirname),
          from: 'src/icons',
          to: 'icons/'
        }
      ]
    })
  ]
}
