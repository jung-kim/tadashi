/*eslint complexity: ["error", 25]*/

const signals = require('../../helpers/signals').signals;
const chattersTableVC = require('./chattersTableVC');
const twitchEmbededVC = require('./twitchEmbededVC');
const navOptionVC = require('./navOptionVC');
const dateTimeRangeVC = require('./dateTimeRangeVC');
const chartFilter = require('../shared/chartFilter');

signals.add(async (payload) => {
    switch (payload.event) {
        case 'stream.load':
            document.getElementById("main").innerHTML = templates[`./hbs/stream/index.hbs`]();

            chattersTableVC.initialize();
            navOptionVC.populateStreamInfo();
            navOptionVC.initialize();
            twitchEmbededVC.initialize();
            dateTimeRangeVC.initialize();

            signals.dispatch({ event: 'stream.load.ready' });
            break;
        case 'chatters.data.update.data':
            chattersTableVC.loadChattersTable();
            break;
        case 'filter.change':
            if (payload.changed && payload.changed.filter) {
                chattersTableVC.loadChattersTable();
            }
            if (payload.changed && payload.changed.channel && getCurrentTab().tab === 'stream') {
                navOptionVC.populateStreamInfo();
            }
            break;
        case 'filter.interval.change':
            document.getElementById('interval-selector-btn').innerText = payload.label;
            chartFilter.update({ intervalLevel: payload.intervalLevel });
            break;
        case 'main.minute':
            navOptionVC.populateStreamInfo();
            break;
        case 'date.change':
            dateTimeRangeVC.setDate();
            break;
        case 'main.minute.top':
            dateTimeRangeVC.minProgressed();
            break;
        case 'channel.input.update':
            navOptionVC.populateStreamInfo();
            break;
        case 'stream.cleanup':
            navOptionVC.destroy();
            dateTimeRangeVC.destroy();
            chattersTableVC.destroy();
            chartFilter.destroy();
            break;
        case 'chatters.data.update.partial':
            chattersTableVC.updateChattersList();
            break;
    }
});
