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
    let socket;
    let event;

    beforeEach(co.wrap(function*() {
        server = yield utils.createServer();
        socket = new SocketMock();
        router = new Router(server);
        event = new Event('test', ':test');
    }));

    it('check properties', function() {
        let data = {test: 'example'};
        let event = new Event('test', ':test');
        let context = new Context(router, socket, event, data);

        context.should.have.property('socket', socket);
        context.should.have.property('s', socket);

        context.should.have.property('data', data);
    });

    it('check success', function(done) {
        let data = {test: 'example'};
        let context = new Context(router, socket, event, data);
        socket.socketClient.on(':test:success', (data) => {
            data.should.be.equal('data');
            done();
        });
        context.success('data');
    });

    it('check error', function(done) {
        let data = {test: 'example'};
        let context = new Context(router, socket, event, data);
        socket.socketClient.on(':test:error', (data) => {
            data.should.be.equal('data');
            done();
        });
        context.error('data');
    });

    it('success should call once', () => {
        let context = new Context(router, socket, event);
        context.success('data');
        chai.expect(() => context.success('err')).to.throw(/call once/);
    });

    it('result callback should call once', () => {
        let context = new Context(router, socket, event);
        context.success('data');
        chai.expect(() => context.error('err')).to.throw(/call once/);
    });

    it('ctx.emit should append postfix in emit()', (done) => {
        let context = new Context(router, socket, event);
        socket.socketClient.on(':test:fuck', done);
        context.emit('fuck');
    });

    it('ctx.broadcast(arg) should append postfix', (done) => {
        let context = new Context(router, socket, event);
        socket.onEmit('test:fuck', () => done());
        context.broadcast('fuck');
    });

    it('ctx.broadcast(arg) should not append postfix if arg is null', (done) => {
        let context = new Context(router, socket, event);
        socket.onEmit('test', (data) => {
            data.should.be.equal('fuuu');
            done();
        });
        context.broadcast(null, 'fuuu');
    });

    it('to(roomName) should broadcast message to room', (done) => {
        let context = new Context(router, socket, event);
        socket.onEmit('test:ttt', (data) => {
            socket.broadcastLog[0].room.should.be.equal('test-room');
            data.a.should.be.equal('ggg');
            done();
        });
        context.to('test-room').emit('ttt', {a: 'ggg'});
    });

    it('to(roomName).emit(path, data) path may be null', (done) => {
        let context = new Context(router, socket, event);
        socket.onEmit('test', (data) => {
            socket.broadcastLog[0].room.should.be.equal('test-room');
            data.a.should.be.equal('ccc');
            done();
        });
        context.to('test-room').emit(null, {a: 'ccc'});
    });

    it('test on("before-result") and on("result")', function(done) {
        let context = new Context(router, socket, event);
        context.emitter.on('before-result', (ctx) => {
            ctx.result.data = 'notfuck';
        });
        context.emitter.on('result', (ctx) => {
            ctx.result.data.should.be.equal('notfuck');
            done();
        });
        context.success('fuck');
    });

    it('on("before-result") should may prevent success()', function(done) {
        let context = new Context(router, socket, event);
        context.emitter.on('before-result', () => {
            return Promise.reject({wtf: 'fuck you'});
        });
        context.emitter.on('result', (ctx) => {
            ctx.result.status.should.be.equal('error');
            ctx.result.data.code.should.be.equal(503);
            done();
        });
        context.success('fuck');
    });
});
