'use strict';
const co = require('co');
const chai = require('chai');
chai.should();
chai.use(require('chai-like'));

const utils = require('./utils');

const Router = require('../lib');

describe('router', function() {
    let router;
    let server;
    let done;

    beforeEach(co.wrap(function*() {
        server = yield utils.createServer();
        router = new Router(server);
        done = utils.done();
    }));

    it('should registry route', function() {
        let middleware = function() {};
        router.route('test', middleware);
        router.routes.should.not.be.empty;
        router.routes[0].path.should.be.equal('test');
        router.routes[0].middleware.should.be;
    });

    it('should attach to socket', co.wrap(function*() {
        let middleware = done.resolve;
        router.route('test', middleware);
        let client = utils.createClient(server);
        yield client._connect;
        client.emit(':test');
        yield done;
    }));

    it('should confirure delimiter', co.wrap(function*() {
        let middleware = done.resolve;
        router = new Router(server, {delimiter: '&'});
        router.route('test', middleware);
        let client = utils.createClient(server);
        yield client._connect;
        client.emit('&test');
        yield done;
    }));
});
