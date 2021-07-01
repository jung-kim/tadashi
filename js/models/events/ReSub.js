const Sub = require('./Sub');

class ReSub extends Sub {
    constructor(userstate, methods, months) {
        super(userstate, methods);
        this.months = months;
    }
}

module.exports = ReSub;