'use strict';
const co = require('co');
const freeport = require('freeport');
const promisify = require('native-promisify');
const IO = require('socket.io');
const Client = require('socket.io-client');

const createServer = co.wrap(function*() {
    let port = yield promisify(freeport);
    let server = new IO(port);
    return server;
});

const createClient = function(server) {
    const options = {
        transports: ['websocket'],
        'force new connection': true
    };
    let port = server.httpServer.address().port;
    let socketURL = `http://0.0.0.0:${port}`;
    let client = Client.connect(socketURL, options);
    client._connect = new Promise((r) => client.on('connect', r));
    return client;
};

function done() {
    let resolve;
    let reject;
    let promise = new Promise((rs, rj) => {
        resolve = rs;
        reject = rj;
    });
    promise.resolve = resolve;
    promise.reject = reject;
    return promise;
}

module.exports.done = done;
module.exports.createClient = createClient;
module.exports.createServer = createServer;
