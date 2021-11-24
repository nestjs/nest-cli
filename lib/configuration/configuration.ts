import * as Joi from 'types-joi';
import { InterfaceFrom } from 'types-joi';

export type Asset = 'string' | AssetEntry;

export interface AssetEntry {
  glob: string;
  include?: string;
  flat?: boolean;
  exclude?: string;
  outDir?: string;
  watchAssets?: boolean;
}

export interface ActionOnFile {
  action: 'change' | 'unlink';
  item: AssetEntry;
  path: string;
  sourceRoot: string;
  watchAssetsMode: boolean;
}

const pluginOptionsSchema = Joi.object({
  name: Joi.string().required(),
  options: Joi.object().pattern(Joi.string(), Joi.any()).required(),
});

const generateOptionsSchema = Joi.object({
  spec: Joi.alternatives([
    Joi.boolean(),
    Joi.object().pattern(Joi.string(), Joi.boolean().required()),
  ]).optional(),
});

const compilerOptionsSchema = Joi.object({
  tsConfigPath: Joi.string().default('tsconfig.build.json'),
  webpack: Joi.boolean().default(false),
  webpackConfigPath: Joi.string().default('webpack.config.js'),
  plugins: Joi.array()
    .items(Joi.alternatives([Joi.string(), pluginOptionsSchema]))
    .default([]),
  assets: Joi.array()
    .items(
      Joi.alternatives([
        Joi.string(),
        Joi.object({
          include: Joi.string().optional(),
          exclude: Joi.string().optional(),
          outDir: Joi.string().optional(),
          watchAssets: Joi.boolean().optional(),
        }),
      ]),
    )
    .default([]),
  watchAssets: Joi.boolean().default(false),
  deleteOutDir: Joi.boolean().default(false),
});

const projectConfigurationSchema = Joi.object({
  type: Joi.string().optional(),
  root: Joi.string().optional(),
  entryFile: Joi.string().optional(),
  sourceRoot: Joi.string().optional(),
  compilerOptions: compilerOptionsSchema.optional(),
});

export const configurationSchema = Joi.object({
  language: Joi.string().default('ts'),
  collection: Joi.string().default('@nestjs/schematics'),
  sourceRoot: Joi.string().default('src'),
  entryFile: Joi.string().default('main'),
  monorepo: Joi.boolean().default(false),
  compilerOptions: compilerOptionsSchema.default(undefined),
  generateOptions: generateOptionsSchema.default(undefined),
  projects: Joi.object()
    .pattern(Joi.string(), projectConfigurationSchema.required())
    .default({}),
}).required();

export type Configuration = InterfaceFrom<typeof configurationSchema>;

export type ProjectConfiguration = InterfaceFrom<
  typeof projectConfigurationSchema
>;
