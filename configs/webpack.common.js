'use strict';

const fs = require("fs");
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { StatsWriterPlugin } = require('webpack-stats-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const svgToMiniDataURI = require('mini-svg-data-uri');
const processHtmlLoader = require('./html-preprocessor');
const htmlWebpackConfig = require('./html-webpack.config');
const htmlPlugins = require('./html-plugins');
const { merge } = require('webpack-merge');

const __root__ = path.resolve(__dirname, '..');
const production = process.env.NODE_ENV === 'production';
const manifestPath = path.resolve(__root__, '.manifest/', production ? 'manifest.prod.json' : 'manifest.json');

const icons = {
  production: {
    light: [
      { from: 'app-icon16.png', to: 'icons/icon16.png'},
      { from: 'app-icon32.png', to: 'icons/icon32.png'},
      { from: 'app-icon48.png', to: 'icons/icon48.png'},
      { from: 'app-icon128.png', to: 'icons/icon128.png'},
    ],
    dark: [
      { from: 'app-icon16.png', to: 'icons/icon16.png'},
      { from: 'app-icon32.png', to: 'icons/icon32.png'},
      { from: 'app-icon48.png', to: 'icons/icon48.png'},
      { from: 'app-icon128.png', to: 'icons/icon128.png'},
    ],
  },
  develop: {
    light: [
      { from: 'app-icon16.png', to: 'icons/icon16.png'},
      { from: 'app-icon32.png', to: 'icons/icon32.png'},
      { from: 'app-icon48.png', to: 'icons/icon48.png'},
      { from: 'app-icon128.png', to: 'icons/icon128.png'},
    ],
    dark: [],
  }
}


module.exports = {
  entry: {
    // autoTheme: path.resolve(__root__, 'src/styles/themes/auto.scss'),
    // lightTheme: path.resolve(__root__, 'src/styles/themes/light.scss'),
    // darkTheme: path.resolve(__root__, 'src/styles/themes/dark.scss'),

    manager: path.resolve(__root__, 'src/pages/manager/manager.ts'),

    // popup: path.resolve(__root__, 'src/pages/popup/markdown/index.ts'),

    background: path.resolve(__root__, 'src/worker/background.ts'),
    // settings: path.resolve(__root__, 'src/pages/options/options.ts'),
    // whatsNew: path.resolve(__root__, 'src/pages/whats-new/whats-new.ts'),

    // offscreen: path.resolve(__root__, 'src/pages/offscreen/offscreen.ts'),
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__root__, 'dist'),
    publicPath: '',
  },
  optimization: {
    splitChunks: {
      minSize: 1,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
        options: {
          minimize: {
            // collapseInlineTagWhitespace: true,
            // conservativeCollapse: true,
            collapseWhitespace: true,
            keepClosingSlash: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          },
          preprocessor: processHtmlLoader
        },
        exclude: /node_modules/,
      },
      {
        test: /\.ts?$/,
        include: [
          path.join(__root__, 'src'),
        ],
        use: [
          {
            loader: 'ts-loader',
            options: {
              experimentalFileCaching: true
            }
          },
          {
            loader: path.resolve('configs/template-loader')
          }
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(sc|c)ss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // publicPath: '/styles'
              // filename: "assets/css/[name].css",
            }
          }, 
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: false,
              implementation: require('sass'),
            }
          }
        ],
      },
      {
        test: /\.(png|jp(e*)g|gif|ico)$/i,
        include: [
          path.resolve(__root__, 'src/images'),
        ],
        loader: 'file-loader',
        options: {
          esModule: false,
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.svg/,
        type: 'asset/inline',
        generator: {
          dataUrl: content => svgToMiniDataURI(content.toString())
        }
      },
      {
        test: /\.svg/,
        type: 'asset/source',
        resourceQuery: /inline/,
        generator: {
          dataUrl: content => svgToMiniDataURI(content.toString())
        }
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.component.ts', '.js', '.svg'],
    alias: {
      core: path.resolve(__root__, 'src/core'),
      modules: path.resolve(__root__, 'src/modules'),
      components: path.resolve(__root__, 'src/components'),
      pages: path.resolve(__root__, 'src/pages'),
      styles: path.resolve(__root__, 'src/styles'),
      images: path.resolve(__root__, 'src/images'),
      services: path.resolve(__root__, 'src/services')
    }
  },
  plugins: [
    // new CleanWebpackPlugin(production? { cleanAfterEveryBuildPatterns: ['**/*']} : {}),
    new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ['**/*'] }),
    new CopyWebpackPlugin({
      patterns: [].concat(
        (production ? icons.production : icons.develop).light
          .map(i => ({ from: path.resolve(__root__, 'src/icons', i.from), to: i.to })),
        (production ? icons.production : icons.develop).dark
          .map(i => ({from: path.resolve(__root__, 'src/icons', i.from), to: i.to}))
      )
    }),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].[chunkhash].css',
    }),
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,

      filename: 'manager.html',
      template: './src/pages/manager/manager.html',
      chunks: [
        'vendors',
        'manager'
      ],
    }),

    new HtmlWebpackInjectAttributesPlugin(),
    // new HtmlWebpackPlugin({
    //   ...htmlWebpackConfig,

    //   filename: 'options.html',
    //   template: './src/pages/options/options.html',
    //   chunks: [
    //     'settings'
    //   ],
    // }),
    // new HtmlWebpackPlugin({
    //   ...htmlWebpackConfig,

    //   filename: 'offscreen.html',
    //   chunks: [
    //     'offscreen'
    //   ],
    // }),
    // new HtmlWebpackPlugin({
    //   ...htmlWebpackConfig,

    //   filename: 'whats-new.html',
    //   template: './src/pages/whats-new/whats-new.html',
    //   chunks: [
    //     'whatsNew'
    //   ],
    // }),
    new StatsWriterPlugin({
      filename: 'manifest.json',
      transform({ assetsByChunkName }) {
        const manifest = merge(
          require(path.resolve(__root__, 'src/manifest.json')),
          fs.existsSync(manifestPath) ? require(manifestPath) : {},
          { background: { service_worker: assetsByChunkName.background[0] }}
        );

        return JSON.stringify(manifest, null, 2);
      }
    }),
  ],
  stats: {
    errorDetails: true,
    modules: false,
    children: false,
    assets: false,
    entrypoints: false,
  }
};
