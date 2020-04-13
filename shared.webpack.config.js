//@ts-check

'use strict';

const path = require('path');
const merge = require('merge-options');

module.exports = function withDefaults(/**@type {import('webpack').Configuration}*/extConfig) {

	let defaultConfig = {
		target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

		node: {
			__dirname: false // leave the __dirname-behaviour intact
		}, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
		output: {
			// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
			// path: path.resolve(__dirname, 'dist'),
			filename: '[name].js',
			libraryTarget: 'commonjs2',
			path: path.join(extConfig.context, 'out'),
			// devtoolModuleFilenameTemplate: '../[resource-path]'
		},
		devtool: 'source-map',
		externals: {
			vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		},
		resolve: {
			// support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
			extensions: ['.ts', '.js']
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'ts-loader'
						}
					]
				}
			]
		}
	};

	return merge(defaultConfig, extConfig);
};