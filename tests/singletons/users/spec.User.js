const { assert } = require('chai');
const User = require('../../../js/singletons/users/User');

describe('User.js', () => {
    it('new()', () => {
        const u1 = new User(123, 'abc');
        assert.equal(u1._id, 123);
        assert.equal(u1._userName, 'abc');
        assert.deepEqual(u1._following, {});
        assert.deepEqual(u1._followedBy, {});

        const u2 = new User(undefined, 'abc');
        assert.isUndefined(u2._id);
        assert.equal(u2._userName, 'abc');
        assert.deepEqual(u2._following, {});
        assert.deepEqual(u2._followedBy, {});
    });

    describe('addFollowing()', () => {
        it('default', () => {
            const u1 = new User(123, 'abc');
            assert.deepEqual(u1._following, {});

            u1.addFollowing(new User(1, 'a'));
            assert.deepEqual(u1._following, {
                1: new User(1, 'a'),
            });


            u1.addFollowing(new User(2, 'b'));
            assert.deepEqual(u1._following, {
                1: new User(1, 'a'),
                2: new User(2, 'b'),
            });
        });

        it('undefined', () => {
            const u1 = new User(123, 'abc');

            try {
                u1.addFollowing();
                assert.fail('should not have succeeded');
            } catch (err) {
                assert.equal(err, 'user is missing id and cannot be added to following')
            }
        });

        it('missing id', () => {
            const u1 = new User(123, 'abc');

            try {
                u1.addFollowing(new User(undefined, 'aaa'));
                assert.fail('should not have succeeded');
            } catch (err) {
                assert.equal(err, 'user is missing id and cannot be added to following')
            }
        });
    });

    describe('addFollowedBy()', () => {
        it('default', () => {
            const u1 = new User(123, 'abc');
            assert.deepEqual(u1._followedBy, {});

            u1.addFollowedBy(new User(1, 'a'));
            assert.deepEqual(u1._followedBy, {
                1: new User(1, 'a'),
            });


            u1.addFollowedBy(new User(2, 'b'));
            assert.deepEqual(u1._followedBy, {
                1: new User(1, 'a'),
                2: new User(2, 'b'),
            });
        });

        it('undefined', () => {
            const u1 = new User(123, 'abc');

            try {
                u1.addFollowedBy();
                assert.fail('should not have succeeded');
            } catch (err) {
                assert.equal(err, 'user is missing id and cannot be added to followed by')
            }
        });

        it('missing id', () => {
            const u1 = new User(123, 'abc');

            try {
                u1.addFollowedBy(new User(undefined, 'aaa'));
                assert.fail('should not have succeeded');
            } catch (err) {
                assert.equal(err, 'user is missing id and cannot be added to followed by')
            }
        });
    });

    it('isFollowing()', () => {
        const u1 = new User(123, 'abc');

        assert.isFalse(u1.isFollowing(1));

        u1.addFollowing(new User(1, 'a'));
        assert.isTrue(u1.isFollowing(1));
        assert.isFalse(u1.isFollowing(4));
    });

    it('isFollowedBy()', () => {
        const u1 = new User(123, 'abc');

        assert.isFalse(u1.isFollowedBy(1));

        u1.addFollowedBy(new User(1, 'a'));
        assert.isTrue(u1.isFollowedBy(1));
        assert.isFalse(u1.isFollowedBy(4));
    });

    it('getFollowedBySummary', () => {
        const u1 = new User(123, 'abc');

        assert.deepEqual(u1.getFollowedBySummary(1), { followingCurrent: 0, admiringCurrent: 0 });

        u1.addFollowedBy(new User(1, 'a'));
        u1.addFollowedBy(new User(2, 'b'));
        u1.addFollowedBy(new User(3, 'c'));

        assert.deepEqual(u1.getFollowedBySummary(1), { followingCurrent: 0, admiringCurrent: 3 });

        // have b and c follow a
        u1._followedBy[2].addFollowing(u1._followedBy[1]);
        u1._followedBy[3].addFollowing(u1._followedBy[1]);

        assert.deepEqual(u1.getFollowedBySummary(1), { followingCurrent: 2, admiringCurrent: 1 });
    });

    it('getFollowedByCounts', () => {
        const u1 = new User(123, 'abc');

        assert.equal(u1.getFollowedByCounts(), 0);

        u1.addFollowedBy(new User(1, 'a'));
        u1.addFollowedBy(new User(2, 'b'));
        u1.addFollowedBy(new User(3, 'c'));

        assert.equal(u1.getFollowedByCounts(), 3);
    });
});