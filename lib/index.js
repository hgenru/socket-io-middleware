'use strict';
const assert = require('assert');
const EventEmitter = require('eventemitter2').EventEmitter2;
const wildcard = require('socketio-wildcard');
const compose = require('koa-compose');

const DEFAULT_DELIMITER = ':';
const DEFAULT_SUCCESS_POSTFIX = 'success';
const DEFAULT_ERROR_POSTFIX = 'error';
const DEFAULT_END_POSTFIX = 'end';
const DEFAULT_SEND_END_EVENT = false;

const Event = require('./event');
const Context = require('./context');


class Router {
    /**
     * constructor - create new router
     *
     * @param  {SocketIO} io
     * @param  {Object} opt - {delimiter: ':'}
     * @return {Router}
     */
    constructor(io, opt) {
        this.io = io;
        this.routes = [];
        this.clients = [];
        this.middlewares = [];

        opt = opt || {};
        this.options = {};
        // configurable
        this.options.delimiter = opt.delimiter || DEFAULT_DELIMITER;
        this.options.sendEndEvent = opt.hasOwnProperty('sendEndEvent') ?
                    opt.sendEndEvent : DEFAULT_SEND_END_EVENT;
        // not configurable params
        this.options.successPostfix = DEFAULT_SUCCESS_POSTFIX;
        this.options.errorPostfix = DEFAULT_ERROR_POSTFIX;
        this.options.endPostfix = DEFAULT_END_POSTFIX;

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
        let funcArray = [];
        let globalMiddlewares = this.middlewares;
        funcArray.push.apply(funcArray, globalMiddlewares);
        funcArray.push(route.middleware);
        let func = compose(funcArray);
        let nameWithUUID = `*${this.options.delimiter}${requestName}`;
        socket._emitter.on(nameWithUUID, function(data) {
            let event = new Event(requestName, this.event);
            let context = new Context(self.options, socket, event, data);
            func(context)
                .then()
                .catch((err) => {
                    let error = Context._formatError(err);
                    if (!context.result) {
                        context.error(error);
                    } else {
                        console.warn('the result has already been sent, but try throw error', err);
                    }
                    if (error.code === 503) {
                        self.onerror(err);
                    }
                })
                .then(() => {
                    if (self.options.sendEndEvent) {
                        context.emit(self.options.endPostfix);
                    }
                });
        });
    }

    /**
     * onerror - error handler
     *
     * @param  {Error} err
     * @private
     */
    onerror(err) {
        assert(err instanceof Error, `non-error thrown: ${err}`);

        let msg = err.stack || err.toString();
        console.error();
        console.error(msg.replace(/^/gm, '  '));
        console.error();
    }



    /**
     * route - add new route
     *
     * @param  {String} path
     * @param  {function|function[]} middlewares - function may return promise
     * @return {undefined}
     *
     * @example // success response
     * let router = new Router(io);
     * router.route('ping', (ctx, next) => {
     *     ctx.success('pong');
     *     return next();
     * });
     *
     * @example // error response
     * let router = new Router(io);
     * router.route('err-ping', (ctx, next) => {
     *     ctx.success('because f*ck you!');
     *     return next();
     * });
     *
     * @example // error response (throw)
     * let router = new Router(io);
     * router.route('err-ping', (ctx, next) => {
     *     throw {err: 'wtf', code: 400, description: 'WTF!?'};
     *     // error always prevent next()
     * });
     *
     * @example // compose middlewares
     * let router = new Router(io);
     * router.route('compose', [
     *     (ctx, next) => {
     *         ctx.result = 1;
     *         return next();
     *     },
     *     (ctx, next) => {
     *         ctx.result++;
     *         return next();
     *     },
     *     (ctx, next) => {
     *         ctx.success(ctx.result);  // return 2
     *     }
     * ]);
     *
     * @example // async handler
     * let co = require('co');
     * let router = new Router(io);
     * router.route('async', co.wrap(function*(ctx, next) {
     *     let data = yield loadFromDataBase();
     *     ctx.success(data);
     * }));
     */
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


    /**
     * use - global middleware
     * @param  {function|function[]} middlewares - function may return promise
     * @return {undefined}
     *
     * @example
     * let router = new Router(io);
     * router.use((ctx, next) => {
     *     console.info(`request ${ctx.event.name}`, ctx.data);
     *     next().then(() => {
     *         console.info(
     *             `request ${ctx.event.name} end with ${ctx.status}`,
     *             ctx.result
     *         );
     *     });
     * });
     * router.route('ping', (ctx) => {ctx.success('pong')});
     */
    use(middlewares) {
        if (!Array.isArray(middlewares)) {
            middlewares = [middlewares];
        }
        let middleware = compose(middlewares);
        this.middlewares.push(middleware);
    }
}

Router.defaultOptions = {
    delimiter: DEFAULT_DELIMITER,
    sendEndEvent: false,
    successPostfix: DEFAULT_SUCCESS_POSTFIX,
    errorPostfix: DEFAULT_ERROR_POSTFIX,
    endPostfix: DEFAULT_END_POSTFIX
};

Router.Context = Context;
Router.Event = Event;

module.exports = Router;
