const { assert } = require("chai");
const Chat = require("../../../js/models/events/Chat");

describe('Chat.js', () => {
    it('default', () => {
        let event = new Chat({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        });

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
        });

        assert.isTrue(event instanceof Chat);
    });
});