let momentTemp;
try {
    momentTemp = moment;
} catch (e) {
    momentTemp = require('moment-timezone');
}

module.exports = momentTemp;
