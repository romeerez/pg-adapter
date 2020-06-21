"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complete = void 0;
exports.complete = ({ parseInfo }) => {
    parseInfo.resultNumber++;
    parseInfo.skipNextValues = false;
};
