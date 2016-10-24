const helpers = require('./helpers');
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const commonConfig = require('./webpack.common.js'); // the settings that are common to prod and dev
const combineLoaders = require('webpack-combine-loaders')
const DefinePlugin = require('webpack/lib/DefinePlugin');

/**
 * Webpack Constants
 */
const ENV = process.env.ENV = process.env.NODE_ENV = 'test';
const METADATA = webpackMerge(commonConfig.metadata, {});


/**
 * Config for test environment is pretty different from dev and prod, so we don't use common config as base.
 */
module.exports = {
  /**
   * Inline source maps, generated by TypeScript compiler, will be used.
   */
  devtool: 'inline-source-map',

  /**
   * Entry point / test environment builder is also written in TypeScript.
   */
  entry: './config/spec-bundle.ts',

  verbose: true,

  resolve: {
    extensions: ['', '.ts', '.js'],

    // Make sure root is src
    root: helpers.root('src'),

    // remove other default values
    modulesDirectories: [helpers.root('node_modules')]
  },

  module: {
    preLoaders: [
      /**
       * Lint TypeScript before loading it.
       * See https://github.com/wbuchwalter/tslint-loader for details.
       */
      {
        test: /\.ts$/,
        loader: 'tslint-loader',
        exclude: [helpers.root('node_modules')]
      }
    ],
    loaders: [
      /**
       * Unlike ts-loader, awesome-typescript-loader doesn't allow to override TS compiler options
       * in query params. We use separate `tsconfig.test.json` file, which only differs in one thing:
       * inline source maps. They are used for code coverage report.
       *
       * See project repository for details / configuration reference:
       * https://github.com/s-panferov/awesome-typescript-loader
       */
      {
        test: /\.ts$/,
        loader: combineLoaders([
          {
            loader: 'awesome-typescript-loader',
            query: {
              tsconfig: 'tsconfig.test.json'
            }
          },
          {
            loader: 'angular2-template-loader',
            query: {
              tsconfig: 'tsconfig.test.json'
            }
          }
        ]),
        exclude: [/\.e2e\.ts$/]
      },
      /**
       * These loaders are used in other environments as well.
       */
      {test: /\.json$/, loader: 'json-loader'},
      {test: /\.html$/, loader: 'raw-loader'},
      {
        test: /\.scss$/,
        include: helpers.root('src', 'app'),
        exclude: helpers.root('src', 'app', 'styles'),
        loaders: ['raw', 'sass']
      },
      {
        test: /\.scss$/,
        include: [helpers.root('*'), helpers.root('src', 'app', 'styles')],
        exclude: helpers.root('src', 'app'),
        loaders: ['style', 'css', 'postcss', 'sass']
      }
    ],
    postLoaders: [
      /**
       * Instruments TS source files for subsequent code coverage.
       * See https://github.com/deepsweet/istanbul-instrumenter-loader
       */
      {
        test: /\.ts$/,
        loader: 'istanbul-instrumenter-loader',
        exclude: [
          /node_modules/,
          /spec-bundle\.ts/,
          /\.(e2e|spec)\.ts$/
        ]
      }

    ]
  },

  output: {

    /**
     * The output directory as absolute path (required).
     *
     * See: http://webpack.github.io/docs/configuration.html#output-path
     */
    path: helpers.root('dist'),

    /**
     * Specifies the name of each output file on disk.
     * IMPORTANT: You must not specify an absolute path here!
     *
     * See: http://webpack.github.io/docs/configuration.html#output-filename
     */
    filename: '[name].bundle.js'
  },

  /**
   * Add additional plugins to the compiler.
   *
   * See: http://webpack.github.io/docs/configuration.html#plugins
   */
  plugins: [

    /**
     * Plugin: DefinePlugin
     * Description: Define free variables.
     * Useful for having development builds with debug logging or adding global constants.
     *
     * Environment helpers
     *
     * See: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
     */
    // NOTE: when adding more properties make sure you include them in custom-typings.d.ts
    new DefinePlugin({
      'ENV': JSON.stringify(METADATA.ENV),
      'HMR': false,
      'process.env': {
        'ENV': JSON.stringify(METADATA.ENV),
        'NODE_ENV': JSON.stringify(METADATA.ENV),
        'HMR': false,
      }
    }),
  ],

  /**
   * Static analysis linter for TypeScript advanced options configuration
   * Description: An extensible linter for the TypeScript language.
   *
   * See: https://github.com/wbuchwalter/tslint-loader
   */
  tslint: {
    emitErrors: true,
    failOnHint: true,
    resourcePath: 'src',
    // These options are useful if you want to save output to files
    // for your continuous integration server
    fileOutput: {
      // The directory where each file's report is saved
      dir: "./reports/tslint",

      // The extension to use for each report's filename. Defaults to "txt"
      ext: "xml",

      // If true, all files are removed from the report directory at the beginning of run
      clean: true,

      // A string to include at the top of every report file.
      // Useful for some report formats.
      header: "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<checkstyle version=\"5.7\">",

      // A string to include at the bottom of every report file.
      // Useful for some report formats.
      footer: "</checkstyle>"
    }
  },
};
