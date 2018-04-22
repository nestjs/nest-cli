const readdir = require('fs').readdir;
const { PackageManager } = require('./package-manager');
const { NpmPackageManager } = require('./npm.package-manager');
const { YarnPackageManager } = require('./yarn.package-manager');

class PackageManagerFactory {
  static create(name, logger) {
    switch (name) {
      case PackageManager.NPM:
        return new NpmPackageManager(logger);
      case PackageManager.YARN:
        return new YarnPackageManager(logger);
    }
  }

  static find(logger) {
    return new Promise((resolve) => {
      readdir(process.cwd(), (error, files) => {
        if (error) {
          resolve(this.create(PackageManager.NPM, logger));
        } else {
          if (files.findIndex((filename) => filename === 'yarn.lock') > -1) {
            resolve(this.create(PackageManager.YARN, logger))
          } else {
            resolve(this.create(PackageManager.NPM, logger));
          }
        }
      });
    });
  }
}

module.exports = { PackageManagerFactory };