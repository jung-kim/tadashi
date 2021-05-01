const { assert } = require('chai');
const sinon = require('sinon');

const userFollowsCSS = sinon.stub(Handlebars, 'registerHelper').
    withArgs('userFollowsCSS', sinon.match.func);
const main = require('../js/main');
const auth = require('../js/simpletons/auth');
const twitchClient = require('../js/singletons/twitchClient');
const moment = require('../js/helpers/moment');
const chartFilter = require('../js/events/shared/chartFilter');
const utils = require('../js/helpers/utils');
const { domSignals, eventSignals } = require('../js/helpers/signals');
const users = require('../js/singletons/users');
const constants = require('../js/helpers/constants');

describe('main.js', () => {
    afterEach(() => {
        window.location = undefined;
        main.activityStatusDom = {};
        reset();
    });

    it('initialize', () => {
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

    describe('_eventSignalFunc', () => {
        it('alert', () => {
            const insertAdjacentHTML = sinon.stub();
            document.getElementById.withArgs('alerts').returns({
                insertAdjacentHTML: insertAdjacentHTML
            });

            main._eventSignalFunc({ alert: { body: 'hi' } });

            sinon.assert.calledOnce(insertAdjacentHTML);
            sinon.assert.calledOnce(BSN.Alert);
        });

        it('draw.nav.auth', () => {
            const configureAuthView = sinon.stub(main, 'configureAuthView');
            const configureConnectivityStatus = sinon.stub(main, 'configureConnectivityStatus');

            main._eventSignalFunc({ event: 'draw.nav.auth' });

            sinon.assert.calledOnce(configureAuthView);
            sinon.assert.calledOnce(configureConnectivityStatus);
        });

        it('data.cache.updated', () => {
            const configureConnectivityStatus = sinon.stub(main, 'configureConnectivityStatus');
            const updateLatestProcessTime = sinon.stub(main, 'updateLatestProcessTime');

            main._eventSignalFunc({ event: 'data.cache.updated' });

            sinon.assert.calledOnce(configureConnectivityStatus);
            sinon.assert.calledOnce(updateLatestProcessTime);
        });

        it('draw.nav.actvitiy-status', () => {
            const configureConnectivityStatus = sinon.stub(main, 'configureConnectivityStatus');

            main._eventSignalFunc({ event: 'draw.nav.actvitiy-status' });

            sinon.assert.calledOnce(configureConnectivityStatus);
        });
    });

    describe('getNearestId', () => {
        it('nested', () => {
            const nearestID = main.getNearestId({
                parentElement: {
                    id: undefined,
                    parentElement: {
                        id: 111,
                        parentElement: {
                            id: 222,
                        },
                    }
                }
            });

            assert.equal(nearestID, 111);
        });

        it('missing', () => {
            assert.equal(main.getNearestId({}), 'undefined');
        });
    });

    describe('getConnectivityLevel', () => {
        it('inactive', () => {
            sinon.stub(twitchClient, 'isConnected').returns(false);

            assert.equal(main.getConnectivityLevel(), 'cir-inactive');
        });

        it('active-no-auth', () => {
            sinon.stub(twitchClient, 'isConnected').returns(true);
            sinon.stub(auth, 'isAuthenticated').returns(false);

            assert.equal(main.getConnectivityLevel(), 'cir-active-no-auth');
        });

        it('active', () => {
            sinon.stub(twitchClient, 'isConnected').returns(true);
            sinon.stub(auth, 'isAuthenticated').returns(true);

            assert.equal(main.getConnectivityLevel(), 'cir-active');
        });
    });

    it('configureAuthView', () => {
        const navAuth = {};
        document.getElementById.withArgs('nav-auth').returns(navAuth);

        main.configureAuthView();

        assert.isString(navAuth.innerHTML);
    });

    it('_updateLatestProcessTime', () => {
        sinon.stub(moment, 'now').returns(88888);

        main._updateLatestProcessTime();

        assert.equal(main._latestProcessTime, 88888);
    });

    it('getLatestProcessTimeMS', () => {
        main._latestProcessTime = 999;

        assert.equal(main.getLatestProcessTimeMS(), 999);
    });

    describe('configureConnectivityStatus', () => {
        const ACTIVE = 'cir-active';
        const INACTIVE = 'cir-inactive';
        const ACTIVE_NO_AUTH = 'cir-active-no-auth';

        it('no change', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-active');

            main.activityStatusDom = {};
            main.currentConnectivityLevel = 'cir-active';

            main.configureConnectivityStatus();

            assert.deepEqual(main.activityStatusDom, {});
            assert.equal(main.currentConnectivityLevel, 'cir-active');
        });

        it('to active', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-active');

            main.activityStatusDom = {};
            main.currentConnectivityLevel = 'cir-inactive';

            main.configureConnectivityStatus();

            assert.deepEqual(main.activityStatusDom, {
                className: `blink circle cir-active`
            });
            assert.equal(main.currentConnectivityLevel, 'cir-active');
        });

        it('to inactive', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-inactive');

            main.activityStatusDom = {};
            main.currentConnectivityLevel = 'cir-active';

            main.configureConnectivityStatus();

            assert.deepEqual(main.activityStatusDom, {
                className: `circle cir-inactive`
            });
            assert.equal(main.currentConnectivityLevel, 'cir-inactive');
        });

        it('to active no auth', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-active-no-auth');

            main.activityStatusDom = {};
            main.currentConnectivityLevel = 'cir-active';

            main.configureConnectivityStatus();

            assert.deepEqual(main.activityStatusDom, {
                className: `blink circle cir-active-no-auth`
            });
            assert.equal(main.currentConnectivityLevel, 'cir-active-no-auth');
        });
    });

    it('env', () => {
        assert.deepEqual(window.env, require('./../js/env'));
    });

    describe('authenticate', () => {
        it('undefined', async () => {
            sinon.stub(auth, 'authenticate').returns(undefined);

            await window.authenticate();

            assert.isUndefined(window.location);
        });

        it('redirect', async () => {
            sinon.stub(auth, 'authenticate').returns('https://somewhere..com');

            await window.authenticate();

            assert.equal(window.location, 'https://somewhere..com');
        });
    });

    it('authLogout', () => {
        const logout = sinon.stub(auth, 'logout');

        window.authLogout();

        sinon.assert.calledOnce(logout);
    });

    it('minuteEventDispatcher', () => {
        sinon.stub(twitchClient, 'getChannel').returns('abc');
        sinon.stub(chartFilter, 'getUserFilter').returns('a filter');
        const setMinTopTimeoutEvent = sinon.stub(window, 'setMinTopTimeoutEvent');

        window.minuteEventDispatcher();

        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
            event: 'main.minute',
            channel: 'abc',
            filter: 'a filter',
        }));
        sinon.assert.calledOnce(setMinTopTimeoutEvent);
    });

    describe('domEvent', () => {
        it('id is provided', () => {
            window.domEvent({
                target: 'a-target',
                type: 'a-type',
            }, 'an-id');

            sinon.assert.calledOnce(domSignals.dispatch.withArgs({
                id: 'an-id',
                type: 'a-type',
                event: {
                    target: 'a-target',
                    type: 'a-type',
                }
            }));
        });

        it('id is not provided', () => {
            sinon.stub(main, 'getNearestId').withArgs('a-target').returns('an-id');

            window.domEvent({
                target: 'a-target',
                type: 'a-type',
            });

            sinon.assert.calledOnce(domSignals.dispatch.withArgs({
                id: 'an-id',
                type: 'a-type',
                event: {
                    target: 'a-target',
                    type: 'a-type',
                }
            }));
        });

    });

    describe('userFollowsCSS', () => {
        it('user does not exist', () => {
            sinon.stub(users, 'getUserByName').withArgs('abc').returns(undefined);

            assert.equal(main.userFollowsCSS('abc'), constants.CSS_UNKNOWN);
        });

        it('user exists and follows', () => {
            const isFollowing = sinon.stub().withArgs(111).returns(true);
            sinon.stub(twitchClient, 'getChannelID').returns(111);
            sinon.stub(users, 'getUserByName').withArgs('abc').returns({
                isFollowing: isFollowing
            });

            assert.equal(main.userFollowsCSS('abc'), constants.CSS_FOLLOWING);
        });

        it('user exists and not following', () => {
            const isFollowing = sinon.stub().withArgs(111).returns(false);
            sinon.stub(twitchClient, 'getChannelID').returns(111);
            sinon.stub(users, 'getUserByName').withArgs('abc').returns({
                isFollowing: isFollowing
            });

            assert.equal(main.userFollowsCSS('abc'), constants.CSS_NOT_FOLLOWING);
        });
    });

    it('setMinTopTimeoutEvent', () => {
        sinon.stub(utils, 'getNow').returns(moment(100));
        sinon.stub(moment, 'now').returns(60072);
        window.setMinTopTimeoutEvent();

        assert.equal(window.minTopTimeoutEvent._idleTimeout, 33);
        clearTimeout(window.minTopTimeoutEvent);
    });

    describe('onload', async () => {
        it('with hash', async () => {
            window.location = {
                hash: '?abcde=1'
            }
            const authenticate = sinon.stub(auth, 'authenticate').withArgs(new URLSearchParams('abcde=1'));
            const initializeClient = sinon.stub(twitchClient, 'initializeClient');
            const configureConnectivityStatus = sinon.stub(main, 'configureConnectivityStatus');
            const configureAuthView = sinon.stub(main, 'configureAuthView');
            const addEventListener = sinon.stub().withArgs('mouseenter', sinon.match.func)
            document.getElementById.withArgs('activity-status-popover').returns({
                addEventListener: addEventListener
            });
            main.activityStatusDom = {
                addEventListener: sinon.stub().withArgs('shown.bs.popover', sinon.match.func)
            }

            await window.onload();

            sinon.assert.calledOnce(authenticate);
            sinon.assert.calledOnce(initializeClient);
            sinon.assert.calledOnce(configureConnectivityStatus);
            sinon.assert.calledOnce(configureAuthView);
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: `stream.load` }));
            sinon.assert.calledOnce(main.activityStatusDom.addEventListener);
            sinon.assert.calledOnce(BSN.Popover.withArgs(main.activityStatusDom, sinon.match.object));
        });

        it('without hash', async () => {
            const authenticate = sinon.stub(auth, 'authenticate');
            const initializeClient = sinon.stub(twitchClient, 'initializeClient');
            const configureConnectivityStatus = sinon.stub(main, 'configureConnectivityStatus');
            const configureAuthView = sinon.stub(main, 'configureAuthView');
            const addEventListener = sinon.stub().withArgs('mouseenter', sinon.match.func)
            document.getElementById.withArgs('activity-status-popover').returns({
                addEventListener: addEventListener
            });
            main.activityStatusDom = {
                addEventListener: sinon.stub().withArgs('shown.bs.popover', sinon.match.func)
            }

            await window.onload();

            sinon.assert.notCalled(authenticate);
            sinon.assert.calledOnce(initializeClient);
            sinon.assert.calledOnce(configureConnectivityStatus);
            sinon.assert.calledOnce(configureAuthView);
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: `stream.load` }));
            sinon.assert.calledOnce(main.activityStatusDom.addEventListener);
            sinon.assert.calledOnce(BSN.Popover.withArgs(main.activityStatusDom, sinon.match.object));
        });
    });

    describe('activityStatusPopover', () => {
        it('active', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-active');
            const headerDom = {};
            const bodyDom = {};
            document.getElementsByClassName.withArgs('popover-header').returns([headerDom]);
            document.getElementsByClassName.withArgs('popover-body').returns([bodyDom]);

            main.activityStatusPopover();

            assert.equal(headerDom.innerHTML, 'Connected');
            assert.isTrue(bodyDom.innerHTML.startsWith('Data is being collected'));
        });

        it('inactive', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-inactive');
            const headerDom = {};
            const bodyDom = {};
            document.getElementsByClassName.withArgs('popover-header').returns([headerDom]);
            document.getElementsByClassName.withArgs('popover-body').returns([bodyDom]);

            main.activityStatusPopover();

            assert.equal(headerDom.innerHTML, 'Disconnected');
            assert.isTrue(bodyDom.innerHTML.startsWith('Data collection is halted'));
        });

        it('active-no-auth', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-active-no-auth');
            const headerDom = {};
            const bodyDom = {};
            document.getElementsByClassName.withArgs('popover-header').returns([headerDom]);
            document.getElementsByClassName.withArgs('popover-body').returns([bodyDom]);

            main.activityStatusPopover();

            assert.equal(headerDom.innerHTML, 'Connected with no Auth');
            assert.isTrue(bodyDom.innerHTML.startsWith('Data collection is limited'));
        });
    })
});