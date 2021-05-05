module.exports = Object.freeze({
    TYPE_CHAT: 0,
    TYPE_RESUB: 1,
    TYPE_CHEER: 2,
    TYPE_SUB: 3,
    TYPE_BAN: 4,
    TYPE_ANONGIFT: 5,
    TYPE_SUBGIFT: 6,
    TYPE_SUBMYSTERY: 7,

    NUM_TYPES: 8,

    CHART_LABEL: ["chat", "re-subscription", "cheer", "subscription", "ban", "anonymous gift", "subscription gift", "subscription mystery"],
    CHART_BACKGROUND_COLOR: [
        "rgb(255, 255, 0, 0.3)",   // yellow
        "rgb(153, 255, 51, 0.3)",  // teal
        "rgb(51, 255, 255, 0.3)",  // sky blue
        "rgb(0, 128, 225, 0.3)",   // navy blue
        "rgb(255, 51, 153, 0.3)",  // red
        "rgb(102, 0, 204, 0.3)",   // purple
        "rgb(255, 128, 0, 0.3)",   // teal
        "rgb(128, 128, 128, 0.3)"  // grey
    ],
    CHART_BORDER_COLOR: [
        "rgb(255, 255, 0, 1.0)",   // yellow
        "rgb(153, 255, 51, 1.0)",  // teal
        "rgb(51, 255, 255, 1.0)",  // sky blue
        "rgb(0, 128, 225, 1.0)",   // navy blue
        "rgb(255, 51, 153, 1.0)",  // red
        "rgb(102, 0, 204, 1.0)",   // purple
        "rgb(255, 128, 0, 1.0)",   // teal
        "rgb(128, 128, 128, 1.0)"  // grey
    ],

    BUCKET_MIN: 60,
    BUCKET_FIVE: 300,
    BUCKET_HOUR: 3600,
    BUCKET_DAY: 86400,
    INTERVAL_BUCKETS: [60, 300, 3600, 86400],             // time bucket to collect on, in minutes

    TABS_OPTIONS: ['stream'],

    CSS_UNKNOWN: 'text-muted',
    CSS_FOLLOWING: 'stream-following',
    CSS_NOT_FOLLOWING: 'stream-not-following',

    MAX_VIEWERS_COUNTS_FOR_PROCESS: 1000,
});
