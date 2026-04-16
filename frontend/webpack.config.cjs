const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/bigipreport.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        // tsconfig has noEmit so plain `tsc` does not mirror files under underlay/js
                        compilerOptions: { noEmit: false },
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bigipreport.js',
        path: path.resolve(__dirname, './underlay/js'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'src/pace.js', to: 'pace.js' },
                { from: 'src/jquery.min.js', to: 'jquery.min.js' },
                { from: 'src/jquery.dataTables.min.js', to: 'jquery.dataTables.min.js' },
                { from: 'src/dataTables.buttons.min.js', to: 'dataTables.buttons.min.js' },
                { from: 'src/buttons.colVis.min.js', to: 'buttons.colVis.min.js' },
                { from: 'src/buttons.html5.min.js', to: 'buttons.html5.min.js' },
                { from: 'src/buttons.print.min.js', to: 'buttons.print.min.js' },
                { from: 'src/jquery.highlight.js', to: 'jquery.highlight.js' },
                { from: 'src/sh_main.js', to: 'sh_main.js' },
                { from: 'src/sh_tcl.js', to: 'sh_tcl.js' },
            ],
        }),
    ],
    optimization: {
    minimize: false
    },
};
