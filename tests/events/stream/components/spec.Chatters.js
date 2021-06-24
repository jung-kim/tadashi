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
        const key = 'a-key';
        const getElementStub = document.getElementById.
            onCall(0).
            returns({ insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall') }).
            onCall(1).
            returns('something');
        const collapse = BSN.Collapse.withArgs('something');

        const chatter = new Chatters(key);

        sinon.assert.calledTwice(getElementStub);
        sinon.assert.calledOnce(collapse);

        assert.isFunction(chatter.toPreviousPage);
        assert.isFunction(chatter.toNextPage);
        assert.isFunction(chatter.updateChattersList);
    });
});