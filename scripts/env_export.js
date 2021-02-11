const fs = require('fs').promises;
const env = require('./env');

(async () => {
    await fs.writeFile('./js/env.js', `module.exports = ${JSON.stringify(env, null, 2)}`);
})();
