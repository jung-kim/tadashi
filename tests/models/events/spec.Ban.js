const { assert } = require("chai");
const Ban = require("../../../js/models/events/Ban");

describe('Ban.js', () => {
    it('default', () => {
        let event = new Ban({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        });

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
        });

        assert.isTrue(event instanceof Ban);
    });
});