/*eslint-disable no-global-assign,no-implicit-globals,no-native-reassign*/

const eventSignals = require('../js/helpers/signals').eventSignals;
const sinon = require('sinon');
const Handlebars = require('handlebars');
const glob = require('glob');
const fs = require('fs');
const tmi = require('tmi.js');
const moment = require('../js/helpers/moment');
const api = require('../js/simpletons/api');
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
};

window = {
    addEventListener: sinon.stub().withArgs(sinon.match.any).returns({}),
}

const auth = require('../js/simpletons/auth');
const filter = require('../js/events/shared/chartFilter').getUserFilter();

Handlebars.registerHelper('userFollowsCSS', () => {
    // do nothing
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

Twitch = {
    Embed: sinon.stub().withArgs('twitch-embed', {
        width: '100%',
        height: '100%',
        channel: 'abc',
        autoplay: true,
        muted: true,
        allowfullscreen: false
    })
};

/*eslint-enable no-global-assign,no-implicit-globals,no-native-reassign*/