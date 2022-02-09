import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { merge } from 'webpack-merge';

import commonConfig from './webpack.common';

const config = merge(commonConfig, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',

          options: {
            extends: './babel.config.json',
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {
                  regenerator: true,
                },
              ],
            ],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  devServer: {
    proxy: [
      {
        context: ['/api', '/img'],
        target: 'http://127.0.0.1:7481',
        changeOrigin: true,
        secure: false,
      },
    ],
    hot: true,
    port: 7000,
  },
  devtool: 'source-map',
  plugins: [new ReactRefreshWebpackPlugin(), new MiniCssExtractPlugin()],
});

export default config;
