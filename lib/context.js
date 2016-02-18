'use strict';

module.exports = class Context {
    constructor(router, socket, event, data) {
        this.router = router;

        this.event = event;

        this.socket = this.s = socket;
        this.data = data;
    }

    success(data) {
        data = data || {};
        let DELIMITER = this.router.options.delimiter;
        let SUCCESS_POSTFIX = this.router.options.successPostfix;
        let responseEventName = this.event.name + DELIMITER + SUCCESS_POSTFIX;
        this.successResult = data;
        this.socket.emit(responseEventName, data);
    }

    error(data) {
        data = data || {};
        let DELIMITER = this.router.options.delimiter;
        let ERROR_POSTFIX = this.router.options.errorPostfix;
        let responseEventName = this.event.name + DELIMITER + ERROR_POSTFIX;
        this.errorResult = data;
        this.socket.emit(responseEventName, data);
    }

    emit(path, data) {
        let DELIMITER = this.router.options.delimiter;
        let eventName = this.event.requestName + DELIMITER + path;
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

    getResult() {
        let SUCCESS_POSTFIX = this.router.options.successPostfix;
        let ERROR_POSTFIX = this.router.options.errorPostfix;
        if (this.success_result) {
            return {
                status: SUCCESS_POSTFIX,
                data: this.successResult
            };
        } else if (this.error_result) {
            return {
                status: ERROR_POSTFIX,
                data: this.errorResult
            };
        }
    }
};
