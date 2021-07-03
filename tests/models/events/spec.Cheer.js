const { assert } = require("chai");
const Cheer = require("../../../js/models/events/Cheer");

describe('Cheer.js', () => {
    it('default', () => {
        let event = new Cheer({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
            'bits': 222,
        });

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            bits: 222,
        });

        assert.isTrue(event instanceof Cheer);
    });
});