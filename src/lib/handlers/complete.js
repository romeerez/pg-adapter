"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complete = ({ parseInfo }) => {
    parseInfo.resultNumber++;
    parseInfo.skipNextValues = false;
};
