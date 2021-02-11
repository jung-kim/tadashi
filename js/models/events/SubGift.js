const Sub = require('./Sub');

class SubGift extends Sub {
    constructor(userstate, methods, months) {
        super(userstate, months, methods);

        this.recipientDisplayName = userstate["msg-param-recipient-display-name"] || userstate.recipientDisplayName;
        this.recipientID = userstate["msg-param-recipient-id"] || userstate.recipientID;
    }
}

module.exports = SubGift;
