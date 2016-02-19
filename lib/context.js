'use strict';

module.exports = class Context {


    /**
     * constructor
     *
     * @param  {Router} router
     * @param  {Socket} socket
     * @param  {Event} event
     * @param  data
     * @return {Context}
     */
    constructor(router, socket, event, data) {
        this.router = router;

        this.event = event;

        this.socket = this.s = socket;
        this.data = data;
    }

    sendResult(postfix, data) {
        if (this.result) {
            throw Error('result function should call once');
        }
        let DELIMITER = this.router.options.delimiter;
        let responseEventName = this.event.name + DELIMITER + postfix;
        this.socket.emit(responseEventName, data);
        this.result = {
            status: postfix,
            data: this.successResult
        };;
    }

    /**
     * success - success callback. Should call once.
     *
     * @param  data
     * @return {undefined}
     */
    success(data) {
        let SUCCESS_POSTFIX = this.router.options.successPostfix;
        this.sendResult(SUCCESS_POSTFIX, data);
    }

    /**
     * error - error callback. Should call once.
     *
     * @param  data
     * @return {undefined}
     */
    error(data) {
        let ERROR_POSTFIX = this.router.options.errorPostfix;
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
        let DELIMITER = this.router.options.delimiter;
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
        let DELIMITER = this.router.options.delimiter;
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
        let DELIMITER = this.router.options.delimiter;
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
