/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

//@ts-check
'use strict';

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const path = require('path');

/** @type WebpackConfig */
const browserClientConfig = {
	context: path.join(__dirname, 'client'),
	mode: 'none',
	devtool: 'nosources-source-map',
	target: 'node', // vscode extensions run in a node context
	entry: {
		nodeClientMain: './src/extension.ts',
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, 'client', 'dist', 'node'),
		libraryTarget: 'commonjs',
		devtoolModuleFilenameTemplate: '[absolute-resource-path]'
	},
	resolve: {
		extensions: ['.ts', '.js'], // support ts-files and js-files
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
		],
	},
	externals: {
		vscode: 'commonjs vscode', // ignored because it doesn't exist
	}
};

/** @type WebpackConfig */
const browserServerConfig = {
	context: path.join(__dirname, 'server'),
	mode: 'none',
	target: 'node', // vscode extensions run in a node context
	entry: {
		nodeServerMain: './src/node/htmlServerMain.ts',
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, 'server', 'dist', 'node'),
		libraryTarget: 'commonjs',
	},
	resolve: {
		extensions: ['.ts', '.js'], // support ts-files and js-files
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
		],
	},
	externals: {
		vscode: 'commonjs vscode', // ignored because it doesn't exist
	}
};

module.exports = [browserClientConfig, browserServerConfig];