'use strict';
const EventEmitter = require('eventemitter2').EventEmitter2;

class Context {
    /**
     * constructor
     *
     * @param  {Object} options
     * @param  {Socket} socket
     * @param  {Event} event
     * @param  data
     * @return {Context}
     *
     * @example
     * // ctx.on('before-result', callback)
     * //`before-result` event fire before emit result (success or not);
     * // You may pass function return promise as callback.
     * ctx.on('prepesult', (ctx) => {
     *     return new Promise((resolve) => {
     *         ctx.result.data = 'my data';
     *         setTimeout(resolve, 200);
     *     });
     * });
     *
     * @example
     * // ctx.on('result', callback)
     * // `result` event fire after emit result (success or not)
     * ctx.on('result', (ctx) => {
     *     console.log(\`send result ${ctx.event.name}\`, ctx.result);
     * });
     */
    constructor(options, socket, event, data) {
        this.options = options;
        this.emitter = new EventEmitter();

        this.event = event;

        this.socket = this.s = socket;
        this.data = data;

        this.result = null;
        this.status = null;
    }

    sendResult(postfix, data) {
        if (this._resultLock) {
            throw Error('result function should call once');
        }
        let DELIMITER = this.options.delimiter;
        this.status = postfix;
        this.result = data;
        this._resultLock = true;
        this.emitter.emitAsync('before-result', this)
        .catch((err) => {
            let error = Context._formatError(err, this.options);
            postfix = this.options.errorPostfix;
            this.result = error;
            this.status = postfix;
        })
        .then(() => {
            let responseEventName = this.event.name + DELIMITER + this.status;
            this.socket.emit(responseEventName, this.result);
            this.emitter.emitAsync('result', this);
        });
    }

    static _formatError(err) {
        if (err.code) {
            return err;
        }
        return {
            code: 503,
            description: err
        };
    }

    /**
     * success - success callback. Should call once.
     *
     * @param  data
     * @return {undefined}
     */
    success(data) {
        let SUCCESS_POSTFIX = this.options.successPostfix;
        this.sendResult(SUCCESS_POSTFIX, data);
    }

    /**
     * error - error callback. Should call once.
     *
     * @param  data
     * @return {undefined}
     */
    error(data) {
        let ERROR_POSTFIX = this.options.errorPostfix;
        this.sendResult(ERROR_POSTFIX, data);
    }


    /**
     * emit - emit message with prefix `${uuid}:${requestName}:${path}`
     *
     * @param  {String} path
     * @param  data
     * @return {undefined}
     */
    emit(path, data) {
        let DELIMITER = this.options.delimiter;
        let eventName = this.event.name + DELIMITER + path;
        return this.socket.emit(eventName, data);
    }


    /**
     * broadcast - broadcast message with prefix `${requestName}:${path}`
     *
     * @param  {String} path
     * @param  data
     * @return {undefined}
     */
    broadcast(path, data) {
        let DELIMITER = this.options.delimiter;
        let eventName;
        if (path) {
            eventName = this.event.requestName + DELIMITER + path;
        } else {
            eventName = this.event.requestName;
        }
        return this.socket.broadcast.emit(eventName, data);
    }


    /**
     * to - broadcast message to spicific room
     *
     * @param  {String} roomName
     * @return {object}
     */
    to(roomName) {
        let DELIMITER = this.options.delimiter;
        let requestName = this.event.requestName;
        let room = this.socket.broadcast.to(roomName);
        return {
            emit: (path, data) => {
                let eventName = requestName;
                if (path) {
                    eventName = requestName + DELIMITER + path;
                }
                eventName = eventName.trim(DELIMITER);
                return room.emit(eventName, data);
            }
        };
    }
};

module.exports = Context;
