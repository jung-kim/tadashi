/*eslint-disable no-global-assign,no-implicit-globals,no-native-reassign*/

const { eventSignals, domSignals } = require('../js/helpers/signals');
const sinon = require('sinon');
Handlebars = require('handlebars');
const glob = require('glob');
const fs = require('fs');
const tmi = require('tmi.js');
const moment = require('../js/helpers/moment');
const api = require('../js/simpletons/api');
const fetchMock = require('fetch-mock');
_ = require('lodash');
require('node-localstorage/register');

moment.tz.setDefault("America/Los_Angeles");

// doing this odd setup to stub out the constructor for the twitch client
// disable tmi client so we wouldn't connect to twich api during tests
tmi.Client = class fakeClient {
    on() {
        // do nothing 
    }
    join() {
        // do nothing 
    }
    part() {
        // do nothing 
    }
    connect() {
        // do nothing 
    }
    _isConnected() {
        // do nothing
    }
}
sinon.stub(api, 'queryTwitchApi').
    returns({
        featured: [{
            stream: {
                game: 'something',
                channel: {
                    name: 'testChan',
                    views: 123,
                    _id: 111
                }
            }
        }]
    });
require('../js/singletons/twitchClient');
sinon.reset();

// set up templates for handlebars
templates = {};
glob.sync('./hbs/**/*.hbs').forEach((hbsFile) => {
    const precompiled = Handlebars.precompile(fs.readFileSync(hbsFile).toString());

    // Yes I know, eval is disgusting.  But this is for test only and I don't really see
    // any other way to use precompiled handlebar templates in the serverside.
    // https://github.com/handlebars-lang/handlebars.js/issues/922
    /*eslint-disable no-eval*/
    templates[hbsFile] = Handlebars.template(eval(`(function(){return ${precompiled}}());`));
    /*eslint-enable no-eval*/
});

// stub out boostrap functions 
BSN = {
    Collapse: sinon.stub(),
    Popover: sinon.stub(),
    Dropdown: sinon.stub(),
    Alert: sinon.stub(),
}

// disable signal dispatch
eventSignals.dispatch = sinon.stub();
domSignals.dispatch = sinon.stub();

// flatpickr the time picking lib
flatpickr = sinon.stub();

// mock chart for chart.js
Chart = class Chart {
    constructor(dom, conf) {
        Object.assign(this, conf);
        this.dom = dom;
    }

    update() {
        // do nothing
    }

    destroy() {
        // do nothing
    }
}

// stub dom functions, I'm sure there is a npm package does this...
document = {
    getElementById: sinon.stub().withArgs(sinon.match.any).returns({}),
    getElementsByClassName: sinon.stub(),
    querySelector: sinon.stub().returns({}),
};

window = {
    addEventListener: sinon.stub().withArgs(sinon.match.any).returns({}),
}

const auth = require('../js/simpletons/auth');
const DataBucket = require('../js/simpletons/dataCache/models/DataBucket');
const constants = require('../js/helpers/constants');
const DataNode = require('../js/simpletons/dataCache/models/DataNode');
const User = require('../js/singletons/users/User');
const filter = require('../js/events/shared/chartFilter').getUserFilter();
const userIDFetcher = require('../js/singletons/users/userIDFetcher');
const users = require('../js/singletons/users');

Handlebars.registerHelper('userFollowsCSS', () => {
    // do nothing
});

Awesomplete = sinon.stub();

// global test rest func
reset = () => {
    sinon.verifyAndRestore();
    document.getElementById.reset();
    auth.logout();
    localStorage.clear();
    fetchMock.reset();
    filter.changeSearchString();
    flatpickr.reset();
    eventSignals.dispatch.reset();
    domSignals.dispatch.reset();
    userIDFetcher._isRunning = undefined;
    users.reset();
}

Twitch = {
    Embed: sinon.stub(),
};

getTestDataBucket = (count, name) => {
    const adjustedCount = count || 1;

    return new DataBucket({
        [constants.TYPE_CHAT]: new DataNode(adjustedCount, { [name || 'a']: adjustedCount }),
        [constants.TYPE_RESUB]: new DataNode(adjustedCount, { [name || 'b']: adjustedCount }),
        [constants.TYPE_CHEER]: new DataNode(adjustedCount, { [name || 'c']: adjustedCount }),
        [constants.TYPE_SUB]: new DataNode(adjustedCount, { [name || 'd']: adjustedCount }),
        [constants.TYPE_BAN]: new DataNode(adjustedCount, { [name || 'e']: adjustedCount }),
        [constants.TYPE_ANONGIFT]: new DataNode(adjustedCount, { [name || 'f']: adjustedCount }),
        [constants.TYPE_SUBGIFT]: new DataNode(adjustedCount, { [name || 'g']: adjustedCount }),
        [constants.TYPE_SUBMYSTERY]: new DataNode(adjustedCount, { [name || 'h']: adjustedCount }),
    });
}

getUserObject = (userID, name, following, followedBy, subscribedTo) => {
    const user = new User(userID, name);

    if (following) {
        user._following = new Set(following)
    }
    if (followedBy) {
        user._followedBy = new Set(followedBy)
    }
    if (subscribedTo) {
        user._subscribedTo = subscribedTo;
    }

    return user;
}

/*eslint-enable no-global-assign,no-implicit-globals,no-native-reassign*/