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

    it('should send success data', co.wrap(function*() {
        router = new Router(server);
        router.route('test', (ctx) => ctx.success(1));
        let client = utils.createClient(server);
        yield client._connect;
        client.on('1:test:success', (data) => {
            data.should.be.equal(1);
            done.resolve();
        });
        client.emit('1:test');
        yield done;
    }));

    it('should send error data', co.wrap(function*() {
        router = new Router(server);
        router.route('test', (ctx) => ctx.error(1));
        let client = utils.createClient(server);
        yield client._connect;
        client.on('2:test:error', (data) => {
            data.should.be.equal(1);
            done.resolve();
        });
        client.emit('2:test');
        yield done;
    }));

    it('should send error on throw', co.wrap(function*() {
        router = new Router(server);
        router.onerror = () => {};  // suppress log
        router.route('test', () => {
            throw new Error('wtf');
        });
        let client = utils.createClient(server);
        yield client._connect;
        client.on('2:test:error', (data) => {
            data.should.have.property('code', 503);
            done.resolve();
        });
        client.emit('2:test');
        yield done;
    }));

    it('should send error on throw with code', co.wrap(function*() {
        router = new Router(server);
        router.onerror = () => {};  // suppress log
        router.route('test', () => {
            throw {code: 403};
        });
        let client = utils.createClient(server);
        yield client._connect;
        client.on('2:test:error', (data) => {
            data.should.have.property('code', 403);
            done.resolve();
        });
        client.emit('2:test');
        yield done;
    }));

    it('test options = {sendEndEvent: true} on success', co.wrap(function*() {
        router = new Router(server, {sendEndEvent: true});
        router.route('test', () => {});
        let client = utils.createClient(server);
        yield client._connect;
        client.on('2:test:end', done.resolve);
        client.emit('2:test');
        yield done;
    }));

    it('test global middleware', co.wrap(function*() {
        router = new Router(server, {sendEndEvent: true});
        router.onerror = () => {};  // suppress log
        router.use((ctx, next) => {
            ctx.wtf = 1;
            next().then(() => {
                ctx.wtf.should.be.equal(2);
                done.resolve();
            });
        });
        router.route('test', [
            (ctx, next) => {
                --ctx.wtf;
                return next();
            },
            (ctx, next) => {
                ctx.wtf = ctx.wtf + 2;
                return next();
            },
        ]);
        let client = utils.createClient(server);
        yield client._connect;
        client.emit('2:test');
        yield done;
    }));
});
