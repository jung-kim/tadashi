const sinon = require('sinon');
const { assert } = require('chai');

const Chatters = require('../../../../js/events/stream/components/Chatters');
const filter = require('../../../../js/events/shared/chartFilter').getUserFilter();
const User = require('../../../../js/singletons/users/User');

const setStubs = () => {
    document.getElementById.reset();
    document.getElementById.returns({
        insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall'),
        classList: {
            add: sinon.stub().returns('addCall'),
            remove: sinon.stub().returns('removeCall'),
        }
    });
}

describe('Chatters.js', () => {
    afterEach(() => {
        reset();
        document.getElementById.reset();
    });

    it('Chatters', () => {
        setStubs();
        filter.changeSearchString();
        const c = new Chatters('viewers', [
            new User(undefined, 'aa'),
            new User(undefined, 'ab'),
            new User(11, 'bb'),
        ]);
        delete c.toNextPage;
        delete c.toPreviousPage;
        assert.deepOwnInclude(c, {
            _chatterContainerDom: 'insertAdjacentHTMLCall',
            _key: 'viewers',
            _pageNumber: 0,
            allChatters: [
                new User(undefined, 'aa'),
                new User(undefined, 'ab'),
                new User(11, 'bb'),
            ]
        });
        sinon.assert.callCount(document.getElementById, 5);

        setStubs();
        c._pageNumber = 16
        c.update([
            new User(undefined, 'aa'),
            new User(undefined, 'ab'),
            new User(11, 'bb'),
            new User(undefined, 'abc'),
        ]);
        assert.deepOwnInclude(c, {
            _chatterContainerDom: 'insertAdjacentHTMLCall',
            _key: 'viewers',
            _pageNumber: 0,
            allChatters: [
                new User(undefined, 'aa'),
                new User(undefined, 'ab'),
                new User(11, 'bb'),
                new User(undefined, 'abc'),
            ],
        });
        sinon.assert.callCount(document.getElementById, 3);

        setStubs();
        const junk = [];
        junk.length = 300;
        c._pageNumber = 1;
        c.update(junk);
        assert.deepOwnInclude(c, {
            _chatterContainerDom: 'insertAdjacentHTMLCall',
            _key: 'viewers',
            _pageNumber: 1,
            allChatters: junk,
        });
        sinon.assert.callCount(document.getElementById, 4);
    });

    it('_validatePageNumber', () => {
        setStubs();
        const c = new Chatters('viewers', ['aa', 'ab', 'bb']);

        c._pageNumber = 1;
        c._validatePageNumber();
        assert.equal(c._pageNumber, 0);
        c._pageNumber = -1;
        c._validatePageNumber();
        assert.equal(c._pageNumber, 0);

        const junk = [];
        junk.length = 300;
        c.update(junk);
        c._pageNumber = 1;
        c._validatePageNumber();
        assert.equal(c._pageNumber, 1);
        c._pageNumber = 2;
        c._validatePageNumber();
        assert.equal(c._pageNumber, 0);
        c._pageNumber = -1;
        c._validatePageNumber();
        assert.equal(c._pageNumber, 0);
    });

    it('getLeftIndex', () => {
        setStubs();
        const c = new Chatters('viewers', ['aa', 'ab', 'bb']);

        assert.equal(c.getLeftIndex(), 0);

        c._pageNumber = 1;
        assert.equal(c.getLeftIndex(), 250);
    });


    it('getRightIndex', () => {
        setStubs();
        const c = new Chatters('viewers', ['aa', 'ab', 'bb']);

        assert.equal(c.getRightIndex(), 3);

        c._pageNumber = 1;
        assert.equal(c.getRightIndex(), 3);

        const junk = [];
        junk.length = 300;
        c.update(junk);
        c._pageNumber = 1;
        assert.equal(c.getRightIndex(), 300);
    });

    it('page navigations', () => {
        setStubs();
        const junk = [];
        junk.length = 300;
        const c = new Chatters('viewers', junk);

        c._toNextPage();
        assert.equal(c._pageNumber, 1);

        c._toNextPage();
        assert.equal(c._pageNumber, 1);

        c._toPreviousPage();
        assert.equal(c._pageNumber, 0);

        c._toPreviousPage();
        assert.equal(c._pageNumber, 0);
    });
});