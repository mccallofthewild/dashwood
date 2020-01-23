const path = require('path');
const babel = require('./babel.config');

module.exports = {
	entry: './src/index.ts',
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
				test: /\.(png|jpe?g|gif)$/i,
				use: [
					{
						loader: 'file-loader'
					}
				]
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		modules: [path.resolve(__dirname, 'src'), 'node_modules']
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	}
};
