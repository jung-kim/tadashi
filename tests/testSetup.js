const eventSignals = require('../js/helpers/signals').eventSignals;
const sinon = require('sinon');
const Handlebars = require('handlebars');
const glob = require('glob');
const fs = require('fs');
const tmi = require('tmi.js');
const moment = require('../js/helpers/moment');
_ = require('lodash');
require('node-localstorage/register');

moment.tz.setDefault("America/Los_Angeles");

const constants = require('../js/helpers/constants');

// doing this odd setup to stub out the constructor for the twitch client
// disable tmi client so we wouldn't connect to twich api during tests
tmi.Client = class fakeClient {
    on() { }
    join() { }
    part() { }
    connect() { }
}
sinon.stub(require('../js/simpletons/api'), 'queryTwitchApi')
    .returns({
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
    templates[hbsFile] = Handlebars.template(eval("(function(){return " + precompiled + "}());"));
});

// stub out boostrap functions 
BSN = {
    Collapse: sinon.stub(),
    Popover: sinon.stub(),
    Dropdown: sinon.stub()
}

// disable signal dispatch
eventSignals.dispatch = sinon.stub();

// flatpickr the time picking lib
flatpickr = sinon.stub();

// mock chart for chart.js
Chart = class Chart {
    constructor(dom, conf) {
        Object.assign(this, conf);
        this.dom = dom;
    }

    update() { }

    destroy() { }
}

// stub dom functions, I'm sure there is a npm package does this...
document = {
    getElementById: sinon.stub().withArgs(sinon.match.any).returns({}),
};

window = {
    addEventListener: sinon.stub().withArgs(sinon.match.any).returns({}),
}

const users = require('../js/singletons/users');
const auth = require('../js/simpletons/auth');
const filter = require('../js/events/shared/chartFilter').getUserFilter();

// setup `userFollowsCSS` helper, remove this once we can include main.js
Handlebars.registerHelper('userFollowsCSS', (userName) => {
    const user = users.getUserByName(userName);

    if (!user) {
        return constants.CSS_UNKNOWN;
    }

    switch (user.isFollowing(twitchClient.getChannelID())) {
        case true:
            return constants.CSS_FOLLOWING;
        case false:
            return constants.CSS_NOT_FOLLOWING;
        default:
            return constants.CSS_UNKNOWN;
    }
});

Awesomplete = sinon.stub();

// global test rest func
reset = () => {
    sinon.verifyAndRestore();
    document.getElementById.reset();
    auth._authToken = undefined;
    filter.changeSearchString();
    flatpickr.reset();
    eventSignals.dispatch.reset();
}
