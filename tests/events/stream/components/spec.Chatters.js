const sinon = require('sinon');
const { assert } = require('chai');

const Chatters = require('../../../../js/events/stream/components/Chatters');
const filter = require('../../../../js/events/shared/chartFilter').getUserFilter();
const testUtils = require('../../../testUtils');
const users = require('../../../../js/singletons/users');

describe('Chatters.js', () => {
    beforeEach(() => {
        reset();
    });

    it('constructor', () => {
        const getElementStub = document.getElementById.
            onCall(0).
            returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
            onCall(1).
            returns('something');
        const collapse = BSN.Collapse.withArgs('something');

        const chatter = new Chatters('a-key');

        sinon.assert.calledTwice(getElementStub);
        sinon.assert.calledOnce(collapse);

        assert.isFunction(chatter.toPreviousPage);
        assert.isFunction(chatter.toNextPage);
        assert.isFunction(chatter.updateChattersList);
    });

    it('_validatePageNumber', () => {
        document.getElementById.
            onCall(0).
            returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
            onCall(1).
            returns('something');
        const chatter = new Chatters('a-key');

        chatter.allChatters = [0, 1, 2, 3]

        chatter._validatePageNumber();
        assert.equal(chatter._pageNumber, 0);

        chatter._pageNumber = -1;
        chatter._validatePageNumber()
        assert.equal(chatter._pageNumber, 0);

        chatter.allChatters = new Array(260).fill(1)
        chatter._pageNumber = 1;
        chatter._validatePageNumber()
        assert.equal(chatter._pageNumber, 1);


        chatter._pageNumber = 5;
        chatter._validatePageNumber()
        assert.equal(chatter._pageNumber, 0);
    });

    it('_updatePaginationNumbers', () => {
        document.getElementById.
            onCall(0).
            returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
            onCall(1).
            returns('something');
        const chatter = new Chatters('a-key');
        chatter.allChatters = [];

        chatter._updatePaginationNumbers();
        sinon.assert.calledTwice(document.getElementById);

        chatter.allChatters = new Array(260).fill(1);
        const dom = {};
        document.getElementById.withArgs('a-key-pagination-numbers').returns(dom);
        sinon.stub(chatter, 'getLeftIndex').returns('0');
        sinon.stub(chatter, 'getRightIndex').returns('250');

        chatter._updatePaginationNumbers();

        assert.deepEqual(dom.textContent, '0 ~ 250');
    });

    describe('_updateChattersList', () => {
        it('undefined user-info', () => {
            document.getElementById.
                onCall(0).
                returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
                onCall(1).
                returns('something');
            const chatter = new Chatters('a-key');
            sinon.stub(chatter, '_getPage').returns('a-page');
            const listChattersDom = {};
            document.getElementById.withArgs(`a-key-list-chatters`).returns(listChattersDom);
            document.getElementsByClassName.withArgs('user-info').returns(undefined);

            chatter._updateChattersList();

            assert.equal(listChattersDom.innerHTML, '');
            sinon.assert.notCalled(BSN.Popover);
        });

        it('valid user-info', () => {
            document.getElementById.
                onCall(0).
                returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
                onCall(1).
                returns('something');
            const chatter = new Chatters('a-key');
            sinon.stub(chatter, '_getPage').returns('a-page');
            const listChattersDom = {};
            document.getElementById.withArgs(`a-key-list-chatters`).returns(listChattersDom);
            document.getElementsByClassName.withArgs('user-info').returns([
                { id: 'chatters-subs-abc', firstElementChild: 'child1' }
            ]);
            sinon.stub(users, 'getUserByName').withArgs('abc').returns(getUserObject(123, 'abc'));

            chatter._updateChattersList();

            assert.equal(listChattersDom.innerHTML, '');
            sinon.assert.calledOnce(BSN.Popover.withArgs('child1', {
                title: 'abc',
                content: 'following: undefined<br>is_subscribed: false',
            }));
        });
    });
});