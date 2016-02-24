# socket-io-router

# Installation
    npm i --save https://github.com/hgenru/socket-io-router.git

# Usage

    const IO = require('socket.io')
    const Router = require('socket-io-router');

    const router = new Router(io);
    router.route('ping', (ctx) => ctx.success('pong'));


# Context()

## ctx.on('before-result', callback)
`before-result` event fire before emit result (success or not);
You may pass function return promise as callback.

    ctx.on('prepesult', (ctx) => {
        return new Promise((resolve) => {
            ctx.result.data = 'my data';
            setTimeout(resolve, 200);
        });
    });

## ctx.on('result', callback)
`result` event fire after emit result (success or not)

    ctx.on('result', (ctx) => {
        console.log(\`send result ${ctx.event.name}\`, ctx.result);
    });

More documentation coming soon
