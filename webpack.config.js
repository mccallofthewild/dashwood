const path = require('path');
const babel = require('./babel.config');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
	entry: { main: './src/main.ts' },
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: [/node_modules/],
				use: 'awesome-typescript-loader'
			},
			// {
			// 	test: /(\.js|\.ts)$/,
			// 	exclude: /(node_modules|bower_components)/,
			// 	use: {
			// 		loader: 'babel-loader',
			// 		options: babel
			// 	}
			// },
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				use: [
					{
						loader: 'file-loader'
					}
				]
			},
			{
				test: /\.s?css$/i,
				use: [
					'style-loader',
					MiniCssExtractPlugin.loader,
					'css-loader',
					'postcss-loader',
					'sass-loader'
				]
			}
		]
	},
	plugins: [
		new CleanWebpackPlugin(),
		new MiniCssExtractPlugin({
			filename: 'style.[hash].css'
		}),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, './src/index.html'),
			hash: true,
			inject: true,
			filename: 'index.html',
			root: path.resolve(__dirname, './src')
		}),
		new WebpackMd5Hash(),
		new CopyPlugin([
			{
				from: './src/assets',
				to: './dist/assets'
			}
		]),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(
				process.env.NODE_ENV || 'development'
			)
		})
	],
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		modules: [path.resolve(__dirname, 'src'), 'node_modules']
	},
	output: {
		filename: '[name].[hash].js',
		path: path.resolve(__dirname, 'dist')
	}
};
