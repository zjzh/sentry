/* eslint-env node */
/* eslint import/no-nodejs-modules:0 no-console:0 */

const sane = require('sane');
const {execSync} = require('child_process');

const watcherPy = sane('src/sentry');
const watcherJson = sane('api-docs');

const watchers = [watcherPy, watcherJson];

let isCurrentlyRunning = false;

const makeApiDocsCommand = function () {
  if (isCurrentlyRunning) {
    console.log('currently building');
    return;
  }
  console.log('rebuilding...');
  try {
    isCurrentlyRunning = true;
    output = execSync('SENTRY_DEVENV_NO_REPORT=1 make build-api-docs', {
      stdio: 'inherit',
    });
  } catch (e) {
    isCurrentlyRunning = false;
    return;
  }
  if (output) {
    console.log(output.toString());
  }
  isCurrentlyRunning = false;
};

for (const w of watchers) {
  w.on('change', makeApiDocsCommand);
  w.on('add', makeApiDocsCommand);
  w.on('delete', makeApiDocsCommand);
}
console.log('rebuilding API docs on changes');
