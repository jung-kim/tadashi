
const Sub = require('./Sub');

class MysterySubGift extends Sub {
    constructor(userstate, methods, numbOfSubs) {
        super(userstate, methods, 0);

        delete this.months;
        delete this.totalMonths;
        this.numSubs = numbOfSubs || userstate.numbOfSubs;
    }
}

module.exports = MysterySubGift;
