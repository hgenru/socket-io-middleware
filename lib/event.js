'use strict';

module.exports = class Event {
    constructor(requestName, currentName) {
        this.requestName = requestName;
        this.name = currentName;
    }
};
