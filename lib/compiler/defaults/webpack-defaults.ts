import webpack = require('webpack');
import { defaultConfiguration } from '../../configuration/defaults';
import { MultiNestCompilerPlugins } from '../plugins-loader';

export const webpackDefaultsFactory = (
  tsConfigFile = defaultConfiguration.compilerOptions.tsConfigPath,
  plugins: MultiNestCompilerPlugins,
) => ({
  target: 'node',
  output: {
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: tsConfigFile,
              getCustomTransformers: (program: any) => ({
                before: plugins.beforeHooks,
                after: plugins.afterHooks,
              }),
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  mode: 'none',
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource: any) {
        const lazyImports = [
          '@nestjs/microservices',
          'cache-manager',
          'class-validator',
          'class-transformer',
        ];
        if (!lazyImports.includes(resource)) {
          return false;
        }
        try {
          require.resolve(resource);
        } catch (err) {
          return true;
        }
        return false;
      },
    }),
  ],
});
