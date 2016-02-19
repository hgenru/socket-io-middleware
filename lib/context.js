'use strict';

module.exports = class Context {
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

    success(data) {
        let SUCCESS_POSTFIX = this.router.options.successPostfix;
        this.sendResult(SUCCESS_POSTFIX, data);
    }

    error(data) {
        let ERROR_POSTFIX = this.router.options.errorPostfix;
        this.sendResult(ERROR_POSTFIX, data);
    }

    emit(path, data) {
        let DELIMITER = this.router.options.delimiter;
        let eventName = this.event.name + DELIMITER + path;
        return this.socket.emit(eventName, data);
    }

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
