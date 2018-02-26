import { Asset } from './asset';
import * as path from 'path';
import * as fs from 'fs';
import {ColorService} from "../../logger/color.service";
import {Logger, LoggerService} from "../../logger/logger.service";

export class ModuleLoader {
  constructor(
      private logger: Logger = LoggerService.getLogger()
  ) {}

  public async load(asset: Asset): Promise<Asset> {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleLoader.name }::load() -`, `asset : ${ JSON.stringify(asset, null, 2) }`);
    const directory: string = await this.findModuleDirectoryFrom(asset.directory, asset.filename);
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleLoader.name }::load() -`, `directory : ${ directory }`);
    const files: string[] = await this.read(directory);
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleLoader.name }::load() -`, `files : ${ files }`);
    const filename: string = files.find((filename) => filename.indexOf('module') !== -1);
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleLoader.name }::load() -`, `filename : ${ filename }`);
    const content: string = await this.getModuleContent(path.join(directory, filename));
    return {
      type: 'module',
      name: '',
      template: {
        name: '',
        content: content
      },
      directory: directory,
      filename: filename
    };
  }

  private async findModuleDirectoryFrom(directory: string, assetFilename: string): Promise<string> {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleLoader.name }::findModuleDirectoryFrom() -`, `directory : ${ directory }`, `assetFilename : ${ assetFilename }`);
    const files: string[] = await this.read(directory);
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleLoader.name }::findModuleDirectoryFrom() -`, `files : ${ files }`);
    if (files.find((filename) => this.isAModule(filename) && filename !== assetFilename) !== undefined) {
      return directory;
    } else {
      const parent = this.computeParentPathFrom(directory);
      return this.findModuleDirectoryFrom(parent, assetFilename);
    }
  }

  private async read(directory: string): Promise<string[]> {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleLoader.name }::read() -`, `files : ${ directory }`);
    return new Promise<string[]>((resolve) => {
      fs.readdir(directory, (error: NodeJS.ErrnoException, files: string[]) => {
        resolve(files);
      });
    });
  }

  private isAModule(filename) {
    return filename.indexOf('module') !== -1;
  }

  private computeParentPathFrom(directory: string): string {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleLoader.name }::computeParentPathFrom() -`, `directory : ${ directory }`);
    const elements: string[] = directory.split(path.sep);
    elements.pop();
    return elements.join(path.sep);
  }

  private async getModuleContent(moduleFilename: string): Promise<string> {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleLoader.name }::getModuleContent() -`, `moduleFilename : ${ moduleFilename }`);
    return new Promise<string>((resolve, reject) => {
      fs.readFile(moduleFilename, (error: NodeJS.ErrnoException, buffer: Buffer) => {
        if (error !== undefined && error !== null) {
          return reject(error);
        }
        return resolve(buffer.toString());
      });
    });
  }
}