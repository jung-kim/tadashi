const { assert } = require("chai");

const filter = require("../../../../js/events/shared/chartFilter/filter");
const users = require("../../../../js/singletons/users");
const sinon = require('sinon');
const User = require("../../../../js/singletons/users/User");
const twitchClient = require("../../../../js/singletons/twitchClient");

describe('Filter.js', () => {
    afterEach(() => {
        sinon.verifyAndRestore();
        filter.changeSearchString('');
    })

    it('_isStringIncluded', () => {
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
        sinon.stub(users, 'getUserByName').withArgs('a').returns(new User(1, 'a'));
        sinon.stub(twitchClient, 'getChannelID').returns(22);
        assert.isUndefined(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(new User(1, 'a', { 22: 'bb', 33: 'cc' }));
        sinon.stub(twitchClient, 'getChannelID').returns(22);
        assert.isTrue(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(new User(1, 'a', { 22: 'bb', 33: 'cc' }));
        sinon.stub(twitchClient, 'getChannelID').returns(44);
        assert.isFalse(filter.isApplicable('a'));
    });

    it('_isNotFollowing', () => {
        filter.changeSearchString(':notFollowing');
        sinon.stub(users, 'getUserByName').withArgs('a').returns(undefined);
        assert.isUndefined(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(new User(1, 'a'));
        sinon.stub(twitchClient, 'getChannelID').returns(22);
        assert.isUndefined(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(new User(1, 'a', { 22: 'bb', 33: 'cc' }));
        sinon.stub(twitchClient, 'getChannelID').returns(22);
        assert.isFalse(filter.isApplicable('a'));

        sinon.verifyAndRestore();
        sinon.stub(users, 'getUserByName').withArgs('a').returns(new User(1, 'a', { 22: 'bb', 33: 'cc' }));
        sinon.stub(twitchClient, 'getChannelID').returns(44);
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
});
