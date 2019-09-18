import chalk from 'chalk';
import { spawn } from 'child_process';
import { join } from 'path';
import { Input } from '../commands';
import { Configuration } from '../lib/configuration';
import { defaultOutDir } from '../lib/configuration/defaults';
import { BuildAction } from './build.action';

export class DevAction extends BuildAction {
  public async handle(inputs: Input[], options: Input[]) {
    try {
      const configuration = await this.loader.load();
      const pathToTsconfig =
        (options.find(option => option.name === 'path')!.value as string) ||
        configuration.compilerOptions!.tsConfigPath;

      const { options: tsOptions } = this.tsConfigProvider.getByConfigFilename(
        pathToTsconfig!,
      );
      const outDir = tsOptions.outDir || defaultOutDir;
      const onSuccess = this.createOnSuccessHook(configuration, outDir);
      const watchMode = true;

      await this.runBuild(options, watchMode, onSuccess);
    } catch (err) {
      console.error(chalk.red(err));
    }
  }

  public createOnSuccessHook(
    configuration: Required<Configuration>,
    outDir: string,
  ) {
    let childProcessRef: any;
    process.on('exit', code => childProcessRef && childProcessRef.kill(code));

    return () => {
      if (childProcessRef) {
        childProcessRef.kill();
      }
      const outputFilePath = configuration.projects
        ? join(outDir, configuration.sourceRoot, configuration.entryFile)
        : join(outDir, configuration.entryFile);

      let childProcessArgs: string[] = [];
      const argsStartIndex = process.argv.indexOf('--');
      if (argsStartIndex >= 0) {
        childProcessArgs = process.argv.slice(argsStartIndex + 1);
      }
      childProcessRef = spawn('node', [outputFilePath, ...childProcessArgs], {
        cwd: process.cwd(),
        stdio: 'pipe',
      });
      childProcessRef.stdout.pipe(process.stdout);
    };
  }
}
