const Common = require('./Common');

const getSubType = (userstate, methods) => {
    if (!methods) {
        return userstate.subType;
    }
    if (methods['prime']) {
        return 'prime';
    }
    return methods['planName'];
}

class Sub extends Common {
    constructor(userstate, methods, months) {
        super(userstate);
        this.months = months || userstate.months;
        this.totalMonths = userstate['msg-param-cumulative-months'] || userstate.totalMonths;
        this.subType = getSubType(userstate, methods);
        this.subRank = methods ? methods['plan'] : userstate.subRank;
    }
}

module.exports = Sub;
