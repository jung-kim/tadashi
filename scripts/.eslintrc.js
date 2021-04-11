var path = require('path');

const json = JSON.parse(require('fs').readFileSync(path.join(__dirname, '..', '/.eslintrc.json')).toString());

json.rules['no-sync'] = 'off';

module.exports = json;