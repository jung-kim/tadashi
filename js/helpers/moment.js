module.exports = (() => {
    if (typeof moment === 'undefined') {
        return require('moment-timezone');
    } else {
        return moment
    }
})();
