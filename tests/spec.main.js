const { assert } = require('chai');
const sinon = require('sinon');

describe('twitchClient.js', () => {
    beforeEach(() => {
        reset();
    });

    it('initialize', () => {
        const userFollowsCSS = sinon.stub(Handlebars, 'registerHelper').
            withArgs('userFollowsCSS', sinon.match.func);

        require('../js/main');

        sinon.assert.calledOnce(userFollowsCSS);
        assert.deepEqual(window.env, require('../js/env'));
        assert.isFunction(window.onload);
        assert.isFunction(window.authenticate);
        assert.isFunction(window.authLogout);
        assert.isFunction(window.minuteEventDispatcher);
        assert.isObject(window.minuteEventInterval);
        assert.isFunction(window.domEvent);

        clearInterval(window.minIntervalEvent);
    });
});