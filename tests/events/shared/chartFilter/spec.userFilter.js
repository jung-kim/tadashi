const { assert } = require("chai");
const sinon = require('sinon');

const filter = require("../../../../js/events/shared/chartFilter").getUserFilter();
const users = require("../../../../js/singletons/users");
const env = require("../../../../js/env");

describe('userFilter.js', () => {
    beforeEach(() => {
        sinon.verifyAndRestore();
        filter.changeSearchString('');
    })

    it('_isStringIncluded', () => {
        filter.changeSearchString();
        assert.isTrue(filter.isApplicable('abc'));
        assert.isTrue(filter.isApplicable('ZZZZ'));
        assert.isTrue(filter.isApplicable('ABc'));

        filter.changeSearchString('AAa');
        assert.isTrue(filter.isApplicable('AaA'));
        assert.isTrue(filter.isApplicable('aaa'));
        assert.isTrue(filter.isApplicable('fjwAaAfwo'));
        assert.isTrue(filter.isApplicable('fwoAAA'));
        assert.isTrue(filter.isApplicable('aaAgw'));
    });

    it('_isFollowing', () => {
        filter.changeSearchString(':following');
        sinon.stub(users, 'getUserByName').withArgs('a').returns(undefined);
        assert.isUndefined(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(getUserObject(1, 'a'));
        env.channelID = 22;
        assert.isUndefined(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(getUserObject(1, 'a', [22, 33]));
        env.channelID = 22;
        assert.isTrue(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(getUserObject(1, 'a', [], [22, 33]));
        env.channelID = 44;
        assert.isFalse(filter.isApplicable('a'));
    });

    it('_isNotFollowing', () => {
        filter.changeSearchString(':notFollowing');
        sinon.stub(users, 'getUserByName').withArgs('a').returns(undefined);
        assert.isUndefined(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(getUserObject(1, 'a'));
        env.channelID = 22;
        assert.isUndefined(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(getUserObject(1, 'a', [22, 33]));
        env.channelID = 22;
        assert.isFalse(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(getUserObject(1, 'a', [], [22, 33]));
        env.channelID = 44;
        assert.isTrue(filter.isApplicable('a'));
    });

    it('invalid flag', () => {
        filter.changeSearchString(':abc');
        assert.isTrue(filter.isApplicable());
        assert.isTrue(filter.isApplicable('!F@dfox@fwR??'));
    });

    it('isSameSearchString', () => {
        filter.changeSearchString('abc')
        assert.isTrue(filter.isSameSearchString(' AbC '));
        assert.isFalse(filter.isSameSearchString(' aa '));
    });

    it('_getCleanedSearchString', () => {
        assert.equal(filter._getCleanedSearchString(), '');
        assert.equal(filter._getCleanedSearchString(''), '');
        assert.equal(filter._getCleanedSearchString('  aAa '), 'aaa');
    });

    it('isValid', () => {
        filter.changeSearchString();
        assert.isFalse(filter.isValid());

        filter.changeSearchString('');
        assert.isFalse(filter.isValid());

        filter.changeSearchString('afw');
        assert.isTrue(filter.isValid());

        filter.changeSearchString(':following');
        assert.isTrue(filter.isValid());
    });

    it('filterUsers', () => {
        filter.changeSearchString();
        assert.deepEqual(filter.filterUsers([
            getUserObject(undefined, 'aa'),
            getUserObject(undefined, 'ab'),
            getUserObject(11, 'bb'),
        ]), [
            getUserObject(undefined, 'aa'),
            getUserObject(undefined, 'ab'),
            getUserObject(11, 'bb'),
        ]);

        filter.changeSearchString('a');
        assert.deepEqual(filter.filterUsers([
            getUserObject(undefined, 'aa'),
            getUserObject(undefined, 'ab'),
            getUserObject(11, 'bb'),
        ]), [
            getUserObject(undefined, 'aa'),
            getUserObject(undefined, 'ab'),
        ]);

        filter.changeSearchString('bb');
        assert.deepEqual(filter.filterUsers([
            getUserObject(undefined, 'aa'),
            getUserObject(undefined, 'ab'),
            getUserObject(11, 'bb'),
        ]), [
            getUserObject(11, 'bb'),
        ]);

        filter.changeSearchString('bbb');
        assert.deepEqual(filter.filterUsers([
            getUserObject(undefined, 'aa'),
            getUserObject(undefined, 'ab'),
            getUserObject(11, 'bb'),
        ]), []);
    });
});
