const sinon = require('sinon');
const { assert } = require('chai');

const Chatters = require('../../../../js/events/stream/components/Chatters');
const users = require('../../../../js/singletons/users');
const testUtils = require('../../../testUtils');

describe('Chatters.js', () => {
    beforeEach(() => {
        testUtils.reset();
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
            sinon.stub(chatter, '_getPage').returns([]);
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
            sinon.stub(chatter, '_getPage').returns([]);
            const listChattersDom = {};
            document.getElementById.withArgs(`a-key-list-chatters`).returns(listChattersDom);
            document.getElementsByClassName.withArgs('user-info').returns([
                { id: 'chatters-subs-abc', firstElementChild: 'child1' }
            ]);
            sinon.stub(users, 'getUserByName').withArgs('abc').returns(testUtils.getUserObject(123, 'abc'));

            chatter._updateChattersList();

            assert.equal(listChattersDom.innerHTML, '');
            sinon.assert.calledOnce(BSN.Popover.withArgs('child1', {
                title: 'abc',
                content: 'following: undefined<br>is_subscribed: false',
            }));
        });
    });

    it('getLeftIndex', () => {
        document.getElementById.
            onCall(0).
            returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
            onCall(1).
            returns('something');
        const chatter = new Chatters('a-key');

        chatter._pageNumber = 2;

        assert.equal(chatter.getLeftIndex(), 500);
    });

    it('getRightIndex', () => {
        document.getElementById.
            onCall(0).
            returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
            onCall(1).
            returns('something');
        const chatter = new Chatters('a-key');
        chatter._pageNumber = 0;

        chatter.allChatters = [1, 2, 3, 4, 5, 6];

        assert.equal(chatter.getRightIndex(), 6);
    });

    describe('_toNextPage', () => {
        it('can move to next', () => {
            document.getElementById.
                onCall(0).
                returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
                onCall(1).
                returns('something');
            const chatter = new Chatters('a-key');

            const _updatePaginationNumbers = sinon.stub(chatter, '_updatePaginationNumbers');
            const _updateChattersList = sinon.stub(chatter, '_updateChattersList');

            chatter._pageNumber = 0;
            chatter.allChatters = new Array(260).fill(1);

            chatter._toNextPage();

            assert.equal(chatter._pageNumber, 1);
            sinon.assert.calledOnce(_updatePaginationNumbers);
            sinon.assert.calledOnce(_updateChattersList);
        });

        it('cannot move to next', () => {
            document.getElementById.
                onCall(0).
                returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
                onCall(1).
                returns('something');
            const chatter = new Chatters('a-key');

            const _updatePaginationNumbers = sinon.stub(chatter, '_updatePaginationNumbers');
            const _updateChattersList = sinon.stub(chatter, '_updateChattersList');

            chatter._pageNumber = 0;
            chatter.allChatters = new Array(10).fill(1);

            chatter._toNextPage();

            assert.equal(chatter._pageNumber, 0);
            sinon.assert.notCalled(_updatePaginationNumbers);
            sinon.assert.notCalled(_updateChattersList);
        });
    });

    it('_getPage', () => {
        document.getElementById.
            onCall(0).
            returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
            onCall(1).
            returns('something');
        const chatter = new Chatters('a-key');
        sinon.stub(chatter, 'getLeftIndex').returns(2);
        sinon.stub(chatter, 'getRightIndex').returns(6);

        chatter.allChatters = [0, 1, 2, 3, 4, 5, 6, 7, 8, 8];

        assert.deepEqual(chatter._getPage(), [2, 3, 4, 5]);
    });

    describe('_toPreviousPage', () => {
        it('can move to previous', () => {
            document.getElementById.
                onCall(0).
                returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
                onCall(1).
                returns('something');
            const chatter = new Chatters('a-key');
            const _updatePaginationNumbers = sinon.stub(chatter, '_updatePaginationNumbers');
            const _updateChattersList = sinon.stub(chatter, '_updateChattersList');

            chatter._pageNumber = 4;

            chatter._toPreviousPage();

            assert.equal(chatter._pageNumber, 3);
            sinon.assert.calledOnce(_updatePaginationNumbers);
            sinon.assert.calledOnce(_updateChattersList);
        });

        it('cannot move to previous', () => {
            document.getElementById.
                onCall(0).
                returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
                onCall(1).
                returns('something');
            const chatter = new Chatters('a-key');
            const _updatePaginationNumbers = sinon.stub(chatter, '_updatePaginationNumbers');
            const _updateChattersList = sinon.stub(chatter, '_updateChattersList');

            chatter._pageNumber = 0;

            chatter._toPreviousPage();

            assert.equal(chatter._pageNumber, 0);
            sinon.assert.notCalled(_updatePaginationNumbers);
            sinon.assert.notCalled(_updateChattersList);

        })
    });

    describe('update', () => {
        afterEach(() => {
            document.getElementById = sinon.stub().withArgs(sinon.match.any).returns({});
        });

        it('empty', () => {
            document.getElementById.
                onCall(0).
                returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
                onCall(1).
                returns('something');
            const chatter = new Chatters('a-key');

            const _validatePageNumber = sinon.stub(chatter, '_validatePageNumber');
            const _updateChattersList = sinon.stub(chatter, '_updateChattersList');
            const addOrRemove = sinon.stub().withArgs('d-none');
            const countObj = {};
            document.getElementById = sinon.stub();
            document.getElementById.
                withArgs('a-key-paginator').
                returns({ classList: { add: addOrRemove } });
            document.getElementById.
                withArgs('a-key-count').
                returns(countObj);

            chatter.update([]);

            sinon.assert.calledOnce(_validatePageNumber);
            sinon.assert.calledOnce(addOrRemove);
            sinon.assert.calledOnce(_updateChattersList);
            assert.deepEqual(countObj, { textContent: 0 });
        });


        it('none-empty', () => {
            document.getElementById.
                onCall(0).
                returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
                onCall(1).
                returns('something');
            const chatter = new Chatters('a-key');

            const _validatePageNumber = sinon.stub(chatter, '_validatePageNumber');
            const _updateChattersList = sinon.stub(chatter, '_updateChattersList');
            const _updatePaginationNumbers = sinon.stub(chatter, '_updatePaginationNumbers');
            const addOrRemove = sinon.stub().withArgs('d-none');
            const countObj = {};
            document.getElementById = sinon.stub();
            document.getElementById.
                withArgs('a-key-paginator').
                returns({ classList: { remove: addOrRemove } });
            document.getElementById.
                withArgs('a-key-count').
                returns(countObj);

            chatter.update(new Array(260).fill(1));

            sinon.assert.calledOnce(_validatePageNumber);
            sinon.assert.calledOnce(addOrRemove);
            sinon.assert.calledOnce(_updateChattersList);
            sinon.assert.calledOnce(_updatePaginationNumbers);
            assert.deepEqual(countObj, { textContent: 260 });
        });
    });
});