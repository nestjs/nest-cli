import { blue, bold, cyan, green } from 'ansis';
import { Command } from 'commander';
import { getBuilder } from '../lib/compiler/helpers/get-builder.js';
import { getTscConfigPath } from '../lib/compiler/helpers/get-tsc-config.path.js';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default.js';
import { Configuration } from '../lib/configuration/index.js';
import { loadConfiguration } from '../lib/utils/load-configuration.js';
import { AbstractAction } from './abstract.action.js';

interface InspectContext {
  project?: string;
  all: boolean;
  json: boolean;
}

export class InspectAction extends AbstractAction {
  public async handle(context: InspectContext) {
    const configuration = await loadConfiguration();

    if (context.json) {
      this.printJson(configuration, context);
      return;
    }

    if (context.all) {
      this.printAllProjects(configuration);
    } else {
      this.printProject(configuration, context.project);
    }
  }

  private printProject(
    configuration: Required<Configuration>,
    appName: string | undefined,
  ) {
    const label = appName || 'default';
    console.info();
    console.info(
      green(bold(`Resolved Configuration for "${label}"`)),
    );
    console.info(green('─'.repeat(40)));

    const builder = getBuilder(configuration, {}, appName);
    const tsConfigPath = getTscConfigPath(configuration, {}, appName);
    const sourceRoot = appName
      ? getValueOrDefault(configuration, 'sourceRoot', appName)
      : configuration.sourceRoot;
    const entryFile = getValueOrDefault<string>(
      configuration,
      'entryFile',
      appName,
    );
    const typeCheck = getValueOrDefault<boolean>(
      configuration,
      'compilerOptions.typeCheck',
      appName,
    );
    const deleteOutDir = getValueOrDefault<boolean>(
      configuration,
      'compilerOptions.deleteOutDir',
      appName,
    );
    const assets =
      getValueOrDefault<any[]>(
        configuration,
        'compilerOptions.assets',
        appName,
      ) || [];
    const plugins =
      getValueOrDefault<any[]>(
        configuration,
        'compilerOptions.plugins',
        appName,
      ) || [];

    const rows: [string, string][] = [
      ['Source Root', sourceRoot],
      ['Entry File', entryFile],
      ['Builder', builder.type],
      ['TS Config', tsConfigPath],
      ['Type Check', String(typeCheck ?? false)],
      ['Delete Out Dir', String(deleteOutDir ?? false)],
      [
        'Plugins',
        plugins.length > 0
          ? plugins
              .map((p: any) => (typeof p === 'string' ? p : p.name))
              .join(', ')
          : 'none',
      ],
      [
        'Assets',
        assets.length > 0
          ? assets
              .map((a: any) => (typeof a === 'string' ? a : a.include || a.glob))
              .join(', ')
          : 'none',
      ],
    ];

    const maxKeyLen = Math.max(...rows.map(([k]) => k.length));
    for (const [key, value] of rows) {
      console.info(`  ${cyan(key.padEnd(maxKeyLen))}  ${blue(value)}`);
    }
    console.info();
  }

  private printAllProjects(configuration: Required<Configuration>) {
    console.info();
    const projects = configuration.projects;
    if (!projects || Object.keys(projects).length === 0) {
      this.printProject(configuration, undefined);
      return;
    }

    console.info(green(bold('Projects')));
    console.info(green('─'.repeat(40)));
    console.info(
      `  ${cyan('Name'.padEnd(20))}  ${cyan('Builder'.padEnd(10))}  ${cyan('Source Root')}`,
    );

    for (const name of Object.keys(projects)) {
      const builder = getBuilder(configuration, {}, name);
      const sourceRoot = getValueOrDefault(
        configuration,
        'sourceRoot',
        name,
      );
      console.info(
        `  ${bold(name.padEnd(20))}  ${blue(builder.type.padEnd(10))}  ${blue(sourceRoot)}`,
      );
    }
    console.info();
  }

  private printJson(
    configuration: Required<Configuration>,
    context: InspectContext,
  ) {
    if (context.all) {
      console.info(JSON.stringify(configuration, null, 2));
      return;
    }
    const appName = context.project;
    const builder = getBuilder(configuration, {}, appName);
    const tsConfigPath = getTscConfigPath(configuration, {}, appName);
    const sourceRoot = appName
      ? getValueOrDefault(configuration, 'sourceRoot', appName)
      : configuration.sourceRoot;
    const entryFile = getValueOrDefault<string>(
      configuration,
      'entryFile',
      appName,
    );

    console.info(
      JSON.stringify(
        {
          project: appName || 'default',
          sourceRoot,
          entryFile,
          builder: builder.type,
          tsConfigPath,
          compilerOptions: getValueOrDefault(
            configuration,
            'compilerOptions',
            appName,
          ),
          generateOptions: configuration.generateOptions,
        },
        null,
        2,
      ),
    );
  }
}
