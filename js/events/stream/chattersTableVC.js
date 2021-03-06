const _ = require('lodash');

const chartFilter = require('../shared/chartFilter');
const users = require('../../singletons/users');
const Chatters = require('./components/Chatters');

const VIEWER_TYPES = ["broadcaster", "vips", "moderators", "staff", "admins", "global_mods", "viewers"];
const RIGHT_PAGINATE_POSTFIX = '-page-right';
const LEFT_PAGINATE_POSTFIX = '-page-left';

const chattersHBS = templates[`./hbs/stream/chatters.hbs`];

require('../../helpers/signals').domSignals.add((payload) => {
    switch (payload.type) {
        case 'click':
            if (payload.id.endsWith(RIGHT_PAGINATE_POSTFIX)) {
                const key = payload.id.replace(RIGHT_PAGINATE_POSTFIX, '');
                chattersTableVC._chatters[key].toNextPage();
            } else if (payload.id.endsWith(LEFT_PAGINATE_POSTFIX)) {
                const key = payload.id.replace(LEFT_PAGINATE_POSTFIX, '');
                chattersTableVC._chatters[key].toPreviousPage();
            }
            break;
        case 'keyup':
            if (payload.id === 'chatters-search') {
                chattersTableVC.onChattersSearchKeyUp();
            }
            break;
    }
});

class ChattersTableVC {
    constructor() {
        this.loadChattersTable = _.debounce(this._loadChattersTable.bind(this));

        this.onChattersSearchKeyUp = _.debounce(() => {
            const searchValue = document.getElementById(`chatters-search`).value;

            chartFilter.update({ searchValue: searchValue });
        }, 1000);
    }

    _loadChattersTable() {
        this._chatters = this._chatters || {};

        for (const [key, allChatters] of Object.entries(users.getViewers()) || {}) {
            if (this._chatters[key]) {
                this._chatters[key].update(allChatters)
            } else {
                this._chatters[key] = new Chatters(key, allChatters);
            }
        }
    }

    initialize() {
        this.destroy();

        // fresh init, load handle bar and load bootstrap event wrapper
        document.getElementById(`chatters-table`).innerHTML = chattersHBS(VIEWER_TYPES);

        this.chattersAutocomplete = new Awesomplete(document.getElementById('chatters-search'), {
            minChars: 1,
            maxItems: 10,
            autoFirst: true,
            list: [':following', ':notfollowing']
        });

        this._helpDom = new BSN.Popover(document.getElementById(`chatters-help`), {
            title: 'Chatters View',
            content: `Displays current chatters in the channel refreshed at every minute.</br>
            </br>
            Chatters search can search via chatters name or any of the following flags.</br>
            <ul>
                <li><code>:following</code></li>
                <li><code>:notfollowing</code></li>
            </ul>`,
            placement: 'left'
        });
    }

    updateChattersList() {
        for (const key in this._chatters) {
            this._chatters[key].updateChattersList();
        }
    }

    destroy() {
        if (this.bsnChattersSearch) {
            this.bsnChattersSearch.dispose();
            this.bsnChattersSearch = undefined;
        }
    }
}

const chattersTableVC = new ChattersTableVC();

module.exports = chattersTableVC;
