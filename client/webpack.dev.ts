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
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {
                  regenerator: true,
                },
                'react-refresh/babel',
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
      } as unknown,
    ],
    hot: true,
    port: 7000,
  },
  devtool: 'source-map',
  plugins: [new ReactRefreshWebpackPlugin(), new MiniCssExtractPlugin()],
});

export default config;
