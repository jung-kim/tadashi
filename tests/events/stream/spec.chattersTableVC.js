
const { assert } = require('chai');
const _ = require('lodash');
const sinon = require('sinon');

const chattersTableVC = require('../../../js/events/stream/chattersTableVC');
const users = require('../../../js/singletons/users');
const testUtils = require('../../testUtils');

describe('chattersTableVC', () => {
    beforeEach(() => {
        reset();
    });

    it('_loadChattersTable', () => {
        testUtils.setChattersStubs();
        sinon.stub(users, 'getViewers').returns({
            'broadcaster': ['a', 'b'],
            'viewers': ['c', 'd', 'e']
        });

        chattersTableVC._loadChattersTable();

        assert.equal(Object.keys(chattersTableVC._chatters).length, 2);
        assert.deepEqual(chattersTableVC._chatters.broadcaster.allChatters, ['a', 'b']);
        assert.deepEqual(chattersTableVC._chatters.viewers.allChatters, ['c', 'd', 'e']);

        sinon.verifyAndRestore();
        sinon.stub(users, 'getViewers').returns({
            'broadcaster': ['a', 'b', 'c'],
            'viewers': ['d', 'e'],
            'vips': ['f']
        });

        chattersTableVC._loadChattersTable();

        assert.equal(Object.keys(chattersTableVC._chatters).length, 3);
        assert.deepEqual(chattersTableVC._chatters.broadcaster.allChatters, ['a', 'b', 'c']);
        assert.deepEqual(chattersTableVC._chatters.viewers.allChatters, ['d', 'e']);
        assert.deepEqual(chattersTableVC._chatters.vips.allChatters, ['f']);
    });

    it('destroy', () => {
        const dispose = sinon.stub();
        chattersTableVC.bsnChattersSearch = { dispose: dispose };
        chattersTableVC.destroy();
        sinon.assert.calledOnce(dispose);
        assert.isUndefined(chattersTableVC.bsnChattersSearch);
    });

    it('updateChattersList', () => {
        chattersTableVC._chatters = {
            'a': { updateChattersList: sinon.stub() },
            'b': { updateChattersList: sinon.stub() },
        }
        chattersTableVC.updateChattersList();

        sinon.assert.calledOnce(chattersTableVC._chatters.a.updateChattersList);
        sinon.assert.calledOnce(chattersTableVC._chatters.b.updateChattersList)
    });
});
