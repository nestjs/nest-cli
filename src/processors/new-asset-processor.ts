import * as gitclone from "git-clone";
import * as jsonfile from "jsonfile";
import * as path from "path";
import * as fs from "fs";
import { NestConfig } from "../nest-config";

type AssetType = 'module' | 'controller' | 'component' | 'middleware' | 'gateway' | 'gateway-middleware' | 'filter';

export class NewAssetProcessor {
    public constructor(
        private _config: NestConfig,
        private _assetType: AssetType,
        private _name: string,
        private _destinationFile: string
    ) {
        if (!this._destinationFile.endsWith(".ts")) {
            this._destinationFile += ".ts";
        }
    }

    public async process() {
        if (['middleware', 'gateway', 'gateway-middleware', 'filter'].find(a => a === this._assetType)) {
            return Promise.reject(`The asset type ${this._assetType} is not yet supported by Nest CLI's generate`);
        }

        return new Promise((resolve, reject) => {
            function rejectCleanup(err) {
                rd.destroy();
                wr.end();
                reject(err);
            }
            
            var rd = fs.createReadStream(path.join(__dirname, `/../../generation-templates/${this._assetType}.${this._config.language}.template`));
            rd.on('error', rejectCleanup);

            var wr = fs.createWriteStream(this._destinationFile);
            wr.on('error', rejectCleanup);
            wr.on('finish', resolve);

            rd.pipe(wr);
        });
    }
}