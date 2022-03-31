const path = require('path');

module.exports = {
    mode: 'production',
    entry: './js-src/bigipreport.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bigipreport.js',
        path: path.resolve(__dirname, 'underlay/js'),
    },
    optimization: {
    minimize: false
    },
};