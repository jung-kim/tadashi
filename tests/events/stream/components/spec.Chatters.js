const sinon = require('sinon');
const { assert } = require('chai');

const Chatters = require('../../../../js/events/stream/components/Chatters');
const filter = require('../../../../js/events/shared/chartFilter').getUserFilter();
const testUtils = require('../../../testUtils');
const users = require('../../../../js/singletons/users');

describe('Chatters.js', () => {
    afterEach(() => {
        reset();
        document.getElementById.reset();
        document.getElementsByClassName.reset();
    });

    it('Chatters', () => {
        testUtils.setChattersStubs();
        filter.changeSearchString();
        const c = new Chatters('viewers', [
            getUserObject(undefined, 'aa'),
            getUserObject(undefined, 'ab'),
            getUserObject(11, 'bb'),
        ]);
        delete c.toNextPage;
        delete c.toPreviousPage;
        assert.deepOwnInclude(c, {
            _chatterContainerDom: 'insertAdjacentHTMLCall',
            _key: 'viewers',
            _pageNumber: 0,
            allChatters: [
                getUserObject(undefined, 'aa'),
                getUserObject(undefined, 'ab'),
                getUserObject(11, 'bb'),
            ]
        });
        sinon.assert.callCount(document.getElementById, 5);

        testUtils.setChattersStubs();
        c._pageNumber = 16
        c.update([
            getUserObject(undefined, 'aa'),
            getUserObject(undefined, 'ab'),
            getUserObject(11, 'bb'),
            getUserObject(undefined, 'abc'),
        ]);
        assert.deepOwnInclude(c, {
            _chatterContainerDom: 'insertAdjacentHTMLCall',
            _key: 'viewers',
            _pageNumber: 0,
            allChatters: [
                getUserObject(undefined, 'aa'),
                getUserObject(undefined, 'ab'),
                getUserObject(11, 'bb'),
                getUserObject(undefined, 'abc'),
            ],
        });
        sinon.assert.callCount(document.getElementById, 3);

        testUtils.setChattersStubs();
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
        testUtils.setChattersStubs();
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
        testUtils.setChattersStubs();
        const c = new Chatters('viewers', ['aa', 'ab', 'bb']);

        assert.equal(c.getLeftIndex(), 0);

        c._pageNumber = 1;
        assert.equal(c.getLeftIndex(), 250);
    });


    it('getRightIndex', () => {
        testUtils.setChattersStubs();
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
        testUtils.setChattersStubs();
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

    it('_updateChattersList', () => {
        document.getElementsByClassName
            .withArgs('user-info')
            .returns([
                { id: 'chatters-subs-aaa', firstElementChild: 'first-elem1' },
                { id: 'chatters-subs-bbb', firstElementChild: 'first-elem2' },
            ]);

        sinon.stub(users, 'getUserByName')
            .withArgs('aaa').returns(getUserObject(111, 'aaa'))
            .withArgs('bbb').returns(getUserObject(222, 'bbb'));

        testUtils.setChattersStubs();
        const c = new Chatters('viewers', []);

        const firstPopover = BSN.Popover.withArgs('first-elem1', {
            title: 'aaa',
            content: 'following: undefined<br>is_subscribed: false',
        });
        sinon.assert.calledOnce(firstPopover);
        const secondPopover = BSN.Popover.withArgs('first-elem2', {
            title: 'bbb',
            content: 'following: undefined<br>is_subscribed: false',
        });
        sinon.assert.calledOnce(secondPopover);

    });
});