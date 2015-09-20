/* jshint node:true */
/* jshint esnext:true */

var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    // must be 'source-map' or 'inline-source-map'
    entry: './static/entry.js',
    output: {
        path: `${__dirname}/static/public`,
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract(
                    // activate source maps via loader query
                    'css?sourceMap!' +
                    'less?sourceMap'
                )
            }
        ]
    },
    plugins: [
        // extract inline css into separate 'styles.css'
        new ExtractTextPlugin('styles.css')
    ]
};
