"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noopLog = exports.defaultLog = void 0;
const chalk_1 = __importDefault(require("chalk"));
exports.defaultLog = {
    start: (socket) => {
        socket.queryStartTime = process.hrtime();
    },
    finish: (socket, task) => {
        const time = (process.hrtime(socket.queryStartTime)[1] / 1000000).toFixed(1);
        if (task.failed)
            console.log(chalk_1.default.bold.magenta(`(${time}ms)`) + ' ' + chalk_1.default.bold.red(task.query));
        else
            console.log(chalk_1.default.bold.cyanBright(`(${time}ms)`) + ' ' + chalk_1.default.bold.blue(task.query));
    }
};
const noop = () => { };
exports.noopLog = {
    start: noop,
    finish: noop,
};
