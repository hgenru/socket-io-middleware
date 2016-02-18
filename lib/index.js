'use strict';
const assert = require('assert');
const EventEmitter = require('eventemitter2').EventEmitter2;
const wildcard = require('socketio-wildcard');
const compose = require('koa-compose');

const DEFAULT_DELIMITER = ':';
const DEFAULT_SUCCESS_POSTFIX = 'success';
const DEFAULT_ERROR_POSTFIX = 'error';
const DEFAULT_END_POSTFIX = 'end';

const Event = require('./event');
const Context = require('./context');


class Router {

    constructor(io, opt) {
        this.io = io;
        this.routes = [];
        this.clients = [];

        opt = opt || {};
        this.options = {};
        this.options.delimiter = opt.delimiter || DEFAULT_DELIMITER;
        this.options.successPostfix = opt.successPostfix || DEFAULT_SUCCESS_POSTFIX;
        this.options.errorPostfix = opt.successPostfix || DEFAULT_ERROR_POSTFIX;
        this.options.endPostfix = opt.endPostfix || DEFAULT_END_POSTFIX;

        if (!opt.noWildcard) {
            io.use(wildcard());
        }

        this.io.on('connection', (s) => this._attachToSocket(s));
    }

    _attachToSocket(socket) {
        let emitter = new EventEmitter({
            delimiter: this.options.delimiter,
            wildcard: true
        });
        this.clients.push(socket);
        socket._emitter = emitter;
        for (let route of this.routes) {
            this._registryRoute(socket, route);
        }
        socket.on('*', (packet) => {
            emitter.emit.apply(emitter, packet.data);
        });
    }

    _registryRoute(socket, route) {
        const self = this;
        let requestName = route.path;
        let func = route.middleware;
        let nameWithUUID = `*${this.options.delimiter}${requestName}`;
        socket._emitter.on(nameWithUUID, function(data) {
            let event = new Event(requestName, this.event);
            let context = new Context(self, socket, event, data);
            func(context).then().catch(self.onerror);
        });
    }

    onerror(err) {
        assert(err instanceof Error, `non-error thrown: ${err}`);

        let msg = err.stack || err.toString();
        console.error();
        console.error(msg.replace(/^/gm, '  '));
        console.error();
    }

    route(path, middlewares) {
        if (!Array.isArray(middlewares)) {
            middlewares = [middlewares];
        }
        let middleware = compose(middlewares);
        this.routes.push({
            path: path,
            middleware: middleware
        });
    }
}

module.exports = Router;
