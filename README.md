# socket-io-router

## Installation
    npm i --save https://github.com/hgenru/socket-io-router.git

## Usage

    const IO = require('socket.io')
    const Router = require('socket-io-router');

    const router = new Router(io);
    router.route('ping', (ctx) => ctx.success('pong'));
