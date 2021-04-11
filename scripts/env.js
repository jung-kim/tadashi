const execSync = require("child_process").execSync;
/*eslint-disable no-process-env*/
const environment = process.env.ENVIRONMENT ? process.env.ENVIRONMENT : 'local';

const env = require('@ladjs/env')({
    path: `./env/.env.${environment}`,
    includeProcessEnv: false
});
env.ENVIRONMENT = environment;
env.SERVICE = 'tachikomas';

if (process.env.CLIENT_SECRET) {
    if (environment === 'local') {
        env.CLIENT_SECRET = process.env.CLIENT_SECRET;
    } else {
        console.warn('Client secret can only be set for the "local", ignoring...');
    }
}

env.CLIENT_ID = process.env.CLIENT_ID;
env.GIT_HASH = execSync('git rev-parse --short HEAD').toString().trim();
env.TAG = `${env.ENVIRONMENT === 'local' ? `${env.ENVIRONMENT}-` : ''}${env.GIT_HASH}`;

module.exports = env;
/*eslint-enable no-process-env*/
