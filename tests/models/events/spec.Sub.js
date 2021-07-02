
const { assert } = require('chai');
const Sub = require('../../../js/models/events/Sub');

describe('Sub.js', () => {
    it('just user state', () => {
        const s = new Sub({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        });

        assert.deepEqual(s, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            subType: undefined,
            methods: undefined,
        });
    });

    it('with prime methods', () => {
        const s = new Sub({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        }, {
            plan: 'prime',
            prime: true
        }, 222);

        assert.deepEqual(s, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            subType: 'prime',
            methods: {
                plan: 'prime',
                prime: true,
            },
        });
    });


    it('with none prime methods', () => {
        const s = new Sub({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        }, {
            plan: 'a-plan',
        }, 222);

        assert.deepEqual(s, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            subType: 'a-plan',
            methods: {
                plan: 'a-plan',
            },
        });
    });
});