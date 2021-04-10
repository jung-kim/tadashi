
const { assert } = require('chai');
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

    describe('_domSignalsEvent', () => {
        it('click pageniate right', () => {
            chattersTableVC._chatters = {
                viewers: {
                    toNextPage: sinon.stub()
                }
            }
            chattersTableVC._domSignalsEvent({
                type: 'click',
                id: 'viewers-page-right',
            });

            sinon.assert.calledOnce(chattersTableVC._chatters.viewers.toNextPage);
        });

        it('click pageniate left', () => {
            chattersTableVC._chatters = {
                viewers: {
                    toPreviousPage: sinon.stub()
                }
            }
            chattersTableVC._domSignalsEvent({
                type: 'click',
                id: 'viewers-page-left',
            });

            sinon.assert.calledOnce(chattersTableVC._chatters.viewers.toPreviousPage);
        });

        it('keyup', () => {
            const onChattersSearchKeyUp = sinon.stub(chattersTableVC, 'onChattersSearchKeyUp');

            chattersTableVC._domSignalsEvent({
                type: 'keyup',
                id: 'chatters-search',
            });
            chattersTableVC._domSignalsEvent({
                type: 'keyup',
                id: 'something-else',
            });

            sinon.assert.calledOnce(onChattersSearchKeyUp);
        });
    });

    it('initialize', () => {
        const destroy = sinon.stub(chattersTableVC, 'destroy');

        const chattersTable = {};
        const chattersSearch = {};

        Awesomplete = sinon.stub().withArgs(chattersSearch, {
            minChars: 1,
            maxItems: 10,
            autoFirst: true,
            list: [':following', ':notfollowing']
        });

        document.getElementById.onCall(0).returns(chattersTable);
        document.getElementById.onCall(1).returns(chattersSearch);

        chattersTableVC.initialize();

        assert.isString(chattersTable.innerHTML);
        sinon.assert.calledOnce(Awesomplete);
    });
});
