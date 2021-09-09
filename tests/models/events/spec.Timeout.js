const { assert } = require("chai");
const Timeout = require("../../../js/models/events/Timeout");

describe('Timeout.js', () => {
    it('default', () => {
        let event = new Timeout({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        });

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
        });

        assert.isTrue(event instanceof Timeout);
    });
});