const { assert } = require('chai');
const User = require('../../../js/singletons/users/User');

describe('User.js', () => {
    it('new()', () => {
        const u1 = new User(123, 'abc');
        assert.equal(u1._id, 123);
        assert.equal(u1._userName, 'abc');
        assert.isUndefined(u1._follows);

        const u2 = new User(123, 'abc', { 1: 'ab', 8: 'ee' });
        assert.equal(u2._id, 123);
        assert.equal(u2._userName, 'abc');
        assert.deepEqual(u2._follows, new Set([1, 8]));
    });

    it('addFollows()', () => {
        const u1 = new User(123, 'abc');

        u1.addFollows();
        assert.deepEqual(u1._follows, undefined);

        u1.addFollows({
            data: [
                { to_id: '1', to_name: 'ab' },
                { to_id: '8', to_name: 'ee' }
            ]
        });
        assert.deepEqual(u1._follows, new Set([1, 8]));


        u1.addFollows({
            data: [
                { to_id: '1', to_name: 'ab' },
                { to_id: '8', to_name: 'ee' },
                { to_id: '2', to_name: 'b' }
            ]
        });
        assert.deepEqual(u1._follows, new Set([1, 8, 2]));
    });

    it('isFollowing()', () => {
        const u1 = new User(123, 'abc');

        assert.isUndefined(u1.isFollowing(1));

        u1.addFollows({
            data: [
                { to_id: '1', to_name: 'ab' },
                { to_id: '8', to_name: 'ee' }
            ]
        });
        assert.isTrue(u1.isFollowing(1));
        assert.isFalse(u1.isFollowing(4));
    });

    it('isApplicable', () => {
        const u1 = new User(123, 'abc');
        assert.isFalse(u1.isApplicable('aaa'));

        assert.isTrue(u1.isApplicable('a'));
    });

    it('gets', () => {
        const u1 = new User(123, 'abc');
        assert.equal(u1.getID(), 123);
        assert.equal(u1.getUserName(), 'abc');
    });
});