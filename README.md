# socket-io-router
koa-like socket io router

## Installation
    npm i --save https://github.com/hgenru/socket-io-router.git

## Usage

    const co = require('co');
    const IO = require('socket.io');
    const Router = require('socket-io-router');

    const router = new Router(io);
    router.route('ping', (ctx) => ctx.success('pong'));

    router.route('async', co.wrap(function*(ctx, next) {
        let data = yield queryFromDb();
        ctx.success(data);
        return next();
    }));

    router.route('compose-middleware', [
        co.wrap(function*(ctx, next) {
            console.log('request');
            return next();
        }),
        co.wrap(function*(ctx, next) {
            let data = yield queryFromDb();
            ctx.success(data);
            return next();
        })
    ]);
