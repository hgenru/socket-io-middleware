'use strict';
const co = require('co');
const chai = require('chai');
chai.should();
chai.use(require('chai-like'));

const utils = require('./utils');

const SocketMock = require('socket-io-mock');
const Context = require('../lib/context');
const Event = require('../lib/event');
const Router = require('../lib');

describe('context', function() {
    let router;
    let server;
    let done;

    beforeEach(co.wrap(function*() {
        server = yield utils.createServer();
        router = new Router(server);
        done = utils.done();
    }));

    it('check properties', function() {
        let socket = new SocketMock();
        let data = {test: 'example'};
        let event = new Event('test', ':test');
        let context = new Context(router, socket, event, data);

        context.should.have.property('socket', socket);
        context.should.have.property('s', socket);

        context.should.have.property('data', data);
    });
});
