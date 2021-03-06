/* jshint node:true */
/* jshint esnext:true */

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var LiveReloadPlugin = require('webpack-livereload-plugin');
var webpack = require('webpack');

module.exports = {
    // must be 'source-map' or 'inline-source-map'
    entry: './static/entry.js',
    output: {
        path: `${__dirname}/static/public/i`,
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract(
                    'css?sourceMap!' +
                    'less?sourceMap'
                )
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('styles.css'),
        new webpack.optimize.UglifyJsPlugin({
            mangle: {
                except: ['$super', '$', 'exports', 'require']
            }
        }),
        new LiveReloadPlugin()
    ]
};
