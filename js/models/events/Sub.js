const Common = require('./Common');

const getSubType = (methods) => {
    if (!methods) {
        return undefined;
    }
    return methods['prime'] ? 'prime' : methods['planName'];
}

const getSubRan = (methods) => {
    if (!methods) {
        return undefined;
    }
    return methods['plan'];
}

class Sub extends Common {
    constructor(userstate, methods, months) {
        super(userstate);
        this.months = months || userstate.months;
        this.totalMonths = userstate['msg-param-cumulative-months'] || userstate.totalMonths;
        this.subType = methods ? getSubType(methods) : userstate.subType;
        this.subRank = methods ? getSubRan(methods) : userstate.subRank;
    }
}

module.exports = Sub;
