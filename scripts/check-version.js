const RELEASE_VERSION = process.argv[2];
if (RELEASE_VERSION === undefined) {
  console.log('missing RELEASE_VERSION input');
  process.exit(1);
}
const APP_VERSION = `${ require('../package.json').version }`;
if (APP_VERSION === RELEASE_VERSION) {
  process.exit(0);
} else {
  console.log(`tag '${ RELEASE_VERSION }' version and package.json '${ APP_VERSION }' must equal.`);
  process.exit(1);
}
