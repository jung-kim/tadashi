const { assert } = require("chai");

const Filter = require("../../../../js/events/shared/chartFilter/Filter");
const users = require("../../../../js/singletons/users");
const sinon = require('sinon');
const User = require("../../../../js/singletons/users/User");
const twitchClient = require("../../../../js/singletons/twitchClient");

describe('Filter.js', () => {
    afterEach(() => {
        sinon.verifyAndRestore();
    })

    it('_isStringIncluded', () => {
        let filter = new Filter();

        assert.isTrue(filter.isApplicable('abc'));
        assert.isTrue(filter.isApplicable('ZZZZ'));
        assert.isTrue(filter.isApplicable('ABc'));

        filter = new Filter('AAa');
        assert.isTrue(filter.isApplicable('AaA'));
        assert.isTrue(filter.isApplicable('aaa'));
        assert.isTrue(filter.isApplicable('fjwAaAfwo'));
        assert.isTrue(filter.isApplicable('fwoAAA'));
        assert.isTrue(filter.isApplicable('aaAgw'));
    });

    it('_isFollowing', () => {
        const filter = new Filter(':following');

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
        const filter = new Filter(':notFollowing');

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

    it('isEqual', () => {
        let filter = new Filter();
        assert.isTrue(filter.isEqual(new Filter()));
        assert.isFalse(filter.isEqual(new Filter('a')));
        assert.isFalse(filter.isEqual(new Filter(':following')));

        filter = new Filter('a');
        assert.isFalse(filter.isEqual(new Filter()));
        assert.isTrue(filter.isEqual(new Filter('a')));
        assert.isTrue(filter.isEqual(new Filter('A')));
        assert.isFalse(filter.isEqual(new Filter('aaaa')));
        assert.isFalse(filter.isEqual(new Filter(':following')));


        filter = new Filter(':following');
        assert.isFalse(filter.isEqual(new Filter()));
        assert.isFalse(filter.isEqual(new Filter('a')));
        assert.isFalse(filter.isEqual(new Filter('A')));
        assert.isFalse(filter.isEqual(new Filter('aaaa')));
        assert.isTrue(filter.isEqual(new Filter(':following')));
    });

    it('invalid flag', () => {
        let filter = new Filter(':abc');
        assert.isTrue(filter.isApplicable());
        assert.isTrue(filter.isApplicable('!F@dfox@fwR??'));
    });
});
