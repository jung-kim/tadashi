const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const PORT = 5556;
const HOST = "localhost";

const twitchAPIEndpoint = "https://api.twitch.tv"
const tmiAPIEndpoint = "https://tmi.twitch.tv"

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/', createProxyMiddleware({
    target: twitchAPIEndpoint,
    changeOrigin: true,
    pathRewrite: {},
    router: {
        '/group/user': tmiAPIEndpoint,
    }
}));

app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);
});
