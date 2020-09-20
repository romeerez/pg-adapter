'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var net = require('net');
var tls = require('tls');
var crypto = require('crypto');
var chalk = require('chalk');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var tls__default = /*#__PURE__*/_interopDefaultLegacy(tls);
var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

(function (ResultMode) {
    ResultMode[ResultMode["objects"] = 0] = "objects";
    ResultMode[ResultMode["arrays"] = 1] = "arrays";
    ResultMode[ResultMode["value"] = 2] = "value";
    ResultMode[ResultMode["skip"] = 3] = "skip";
})(exports.ResultMode || (exports.ResultMode = {}));

var parseUrl = function (url) {
    if (url === void 0) { url = process.env.DATABASE_URL; }
    if (!url)
        throw new Error('Provide url or DATABASE_URL env variable');
    var dbUrl = require('url').parse(url);
    var scheme = dbUrl.protocol.substr(0, dbUrl.protocol.length - 1);
    if (scheme.indexOf('postgres') === -1)
        throw new Error("Database url " + url + " does not seem to be postgres");
    var _a = dbUrl.host.split(':'), host = _a[0], port = _a[1];
    var _b = dbUrl.auth.split(':'), user = _b[0], password = _b[1];
    return {
        host: host,
        port: +port || 5432,
        database: dbUrl.path.slice(1),
        user: user,
        password: password,
    };
};

var encodeInt32 = function (buf, i, n) {
    buf[i] = n >> 24 & 0xff;
    buf[i + 1] = n >> 16 & 0xff;
    buf[i + 2] = n >> 8 & 0xff;
    buf[i + 3] = n & 0xff;
};
var decodeInt32 = function (data, i) {
    return data[i + 3] + (data[i + 2] << 8) + (data[i + 1] << 16) + (data[i] << 24);
};
var decodeInt16 = function (data, i) {
    return data[i + 1] + (data[i] << 8);
};
var getMessageLength = function (data, pos) {
    return decodeInt32(data, pos + 1);
};
var skipMessage = function (data, pos) {
    return pos + getMessageLength(data, pos) + 1;
};
var noop = function () { };
var getMessage = function (data, pos, offset) {
    if (pos === void 0) { pos = 0; }
    if (offset === void 0) { offset = 0; }
    return data.slice(pos + offset + 5, getMessageLength(data, pos) + 1);
};

var codes;
(function (codes) {
    codes[codes["success"] = 0] = "success";
    codes[codes["kerberosV5"] = 2] = "kerberosV5";
    codes[codes["cleartextPassword"] = 3] = "cleartextPassword";
    codes[codes["md5"] = 5] = "md5";
    codes[codes["SCMCredential"] = 6] = "SCMCredential";
    codes[codes["GSS"] = 7] = "GSS";
    codes[codes["SSPI"] = 9] = "SSPI";
    codes[codes["SASLInit"] = 10] = "SASLInit";
    codes[codes["SASLContinue"] = 11] = "SASLContinue";
    codes[codes["SASLFinal"] = 12] = "SASLFinal";
})(codes || (codes = {}));
var makeAuthCleartext = function (socket, creds) {
    return respond(socket, Buffer.from("p\0\0\0\0" + creds.password + "\0", 'utf8'));
};
var md5 = function (data) {
    return crypto__default['default'].createHash('md5').update(data).digest('hex');
};
var makeAuthMD5 = function (socket, _a, data) {
    var password = _a.password, user = _a.user;
    var message;
    var creds = md5(password + user);
    var salt = data.slice(9);
    message = 'md5' + md5(Buffer.concat([Buffer.from(creds), salt]));
    respond(socket, Buffer.from("p\0\0\0\0" + message + "\0", 'utf8'));
};
var makeAuthSASLInit = function (socket, request) {
    var clientNonce = crypto__default['default'].randomBytes(18).toString('base64');
    request.authData = { clientNonce: clientNonce };
    var message = 'n,,n=*,r=' + clientNonce;
    var mechanism = 'SCRAM-SHA-256';
    var buffer = Buffer.from("p\0\0\0\0" + mechanism + "\0\0\0\0\0" + message);
    encodeInt32(buffer, 6 + mechanism.length, message.length);
    respond(socket, buffer);
};
var makeAuthSASLContinue = function (socket, request, creds, data) {
    if (!request.authData)
        throw new Error('Invalid SASL auth flow');
    var clientNonce = request.authData.clientNonce;
    if (!clientNonce)
        throw new Error('Invalid SASL auth flow');
    var nonce, salt, iteration;
    String(getMessage(data, 0, 4)).split(',').forEach(function (param) {
        if (param[0] === 'r')
            nonce = param.slice(2);
        else if (param[0] === 's')
            salt = param.slice(2);
        else if (param[0] === 'i')
            iteration = param.slice(2);
    });
    if (!nonce)
        throw new Error('SASL: nonce missing');
    if (!salt)
        throw new Error('SASL: salt missing');
    if (!iteration)
        throw new Error('SASL: iteration missing');
    if (nonce && !nonce.startsWith(clientNonce))
        throw new Error('SASL: server nonce does not start with client nonce');
    var password = Buffer.from(creds.password, 'utf8');
    var saltBytes = Buffer.from(salt, 'base64');
    var ui1 = createHMAC(password, Buffer.concat([saltBytes, Buffer.from([0, 0, 0, 1])]));
    var saltedPassword = ui1;
    for (var i = iteration - 1; i > 0; i--) {
        ui1 = createHMAC(password, ui1);
        saltedPassword = xorBuffers(saltedPassword, ui1);
    }
    var clientKey = createHMAC(saltedPassword, 'Client Key');
    var storedKey = crypto__default['default'].createHash('sha256').update(clientKey).digest();
    var messageWithoutProof = "c=biws,r=" + nonce;
    var authMessage = "n=*,r=" + clientNonce + ",r=" + nonce + ",s=" + salt + ",i=" + iteration + "," + messageWithoutProof;
    var clientSignature = createHMAC(storedKey, authMessage);
    var clientProof = xorBuffers(clientKey, clientSignature).toString('base64');
    var serverKey = createHMAC(saltedPassword, 'Server Key');
    request.authData.signature = createHMAC(serverKey, authMessage).toString('base64');
    respond(socket, Buffer.from("p\0\0\0\0" + messageWithoutProof + ",p=" + clientProof));
};
var makeAuthSASLFinal = function (socket, request, data) {
    var _a;
    var signature = (_a = request.authData) === null || _a === void 0 ? void 0 : _a.signature;
    if (!signature)
        throw new Error('Invalid SASL auth flow');
    if (!getMessage(data, 0, 4).includes('v=' + signature))
        throw new Error('SASL: server signature does not match');
};
var respond = function (socket, buffer) {
    encodeInt32(buffer, 1, buffer.length - 1);
    socket.write(buffer);
};
var createHMAC = function (key, msg) {
    return crypto__default['default'].createHmac('sha256', key).update(msg).digest();
};
var xorBuffers = function (a, b) {
    var len = Math.max(a.length, b.length);
    var res = Buffer.alloc(len);
    for (var i = 0; i < len; i++)
        res[i] = a[i] ^ b[i];
    return res;
};
var auth = function (socket, request, creds, data, pos) {
    var authType = decodeInt32(data, pos + 5);
    if (authType === codes.success)
        return;
    if (authType === codes.cleartextPassword)
        makeAuthCleartext(socket, creds);
    else if (authType === codes.md5)
        makeAuthMD5(socket, creds, data);
    else if (authType === codes.SASLInit)
        makeAuthSASLInit(socket, request);
    else if (authType === codes.SASLContinue)
        makeAuthSASLContinue(socket, request, creds, data);
    else if (authType === codes.SASLFinal)
        makeAuthSASLFinal(socket, request, data);
    else if (authType === codes.kerberosV5)
        return "unsupported auth type: kerberos";
    else if (authType === codes.SCMCredential)
        return "unsupported auth type: SCM credential";
    else if (authType === codes.GSS)
        return "unsupported auth type: GSS";
    else if (authType === codes.SSPI)
        return "unsupported auth type: SSPI";
    else
        return "unknown auth type with code " + authType;
};

var complete = function (_a) {
    var parseInfo = _a.parseInfo;
    parseInfo.resultNumber++;
    parseInfo.skipNextValues = false;
};

var charKeyCodes = {
    S: function (error, message) { return error.level = message; },
    M: function (error, message) { return error.message = message; },
    D: function (error, message) { return error.details = message; },
    C: noop,
    H: function (error, message) { return error.hint = message; },
    P: function (error, message) { return error.position = message; },
    p: function (error, message) { return error.innerPosition = message; },
    q: function (error, message) { return error.innerQuery = message; },
    W: function (error, message) { return error.trace = message; },
    s: function (error, message) { return error.schema = message; },
    t: function (error, message) { return error.table = message; },
    c: function (error, message) { return error.column = message; },
    d: function (error, message) { return error.dataType = message; },
    n: function (error, message) { return error.constraint = message; },
    F: function (error, message) { return error.file = message; },
    L: function (error, message) { return error.line = message; },
    R: function (error, message) { return error.process = message; },
    V: noop
};
var codes$1 = {};
for (var code in charKeyCodes) {
    codes$1[code.charCodeAt(0)] = charKeyCodes[code];
    delete charKeyCodes[code];
}
var parseError = function (task, data, pos) {
    var error = {};
    pos += 5;
    var len = data.length;
    error.query = task.query;
    while (pos < len) {
        if (data[pos] === 0) {
            break;
        }
        var stringCode = String(data[pos]);
        var code = void 0;
        for (code in codes$1)
            if (code === stringCode)
                break;
        if (code !== stringCode)
            break;
        var nextPos = data.indexOf('\0', pos + 1) + 1;
        codes$1[code](error, String(data.slice(pos + 1, nextPos - 1)));
        pos = nextPos;
    }
    task.failed = true;
    return Object.assign(task.error, error);
};

var parseDescription = function (socket, request, data, pos) {
    var result;
    var mode = request.mode;
    var parseInfo = request.parseInfo;
    if (mode !== exports.ResultMode.skip) {
        var columnsCount = decodeInt16(data, pos + 5);
        if (mode === exports.ResultMode.value) {
            var to = data.indexOf('\0', pos + 7);
            parseInfo.type = decodeInt32(data, to + 7);
        }
        else {
            pos += 7;
            var names = new Array(columnsCount);
            var types = new Uint32Array(columnsCount);
            for (var c = 0; c < columnsCount; c++) {
                var to = data.indexOf('\0', pos);
                names[c] = String(data.slice(pos, to));
                pos = to + 7;
                types[c] = decodeInt32(data, pos);
                pos += 12;
            }
            parseInfo.names = names;
            parseInfo.types = types;
            result = [];
        }
        parseInfo.columnsCount = columnsCount;
    }
    var resultNumber = parseInfo.resultNumber;
    if (resultNumber === 0)
        request.result = result;
    else if (resultNumber === 1)
        request.result = [request.result, result];
    else
        request.result[resultNumber] = result;
};

var parseRow = function (socket, task, data, pos) {
    var mode = task.mode, parseInfo = task.parseInfo;
    if (mode === exports.ResultMode.skip || parseInfo.skipNextValues)
        return;
    pos += 7;
    var row;
    if (mode === exports.ResultMode.objects)
        row = parseObjects(parseInfo.columnsCount, task.decodeTypes, parseInfo.types, parseInfo.names, data, pos);
    else if (mode === exports.ResultMode.arrays)
        row = parseArrays(parseInfo.columnsCount, task.decodeTypes, parseInfo.types, parseInfo.names, data, pos);
    else if (mode === exports.ResultMode.value)
        return parseValue(parseInfo.columnsCount, task.decodeTypes, parseInfo.type, task, data, pos);
    if (parseInfo.resultNumber === 0)
        task.result.push(row);
    else
        task.result[parseInfo.resultNumber].push(row);
};
var parseObjects = function (columnsCount, decodeTypes, types, names, data, pos) {
    var row = {};
    for (var c = 0; c < (columnsCount); c++) {
        var size = decodeInt32(data, pos);
        pos += 4;
        var value = void 0;
        if (size === -1) {
            value = null;
        }
        else {
            var decode = decodeTypes[types[c]];
            if (decode)
                value = decode(data, pos, size);
            else
                value = data.toString('utf8', pos, pos + size);
            pos += size;
        }
        row[names[c]] = value;
    }
    return row;
};
var parseArrays = function (columnsCount, decodeTypes, types, names, data, pos) {
    var row = new Array(columnsCount);
    for (var c = 0; c < columnsCount; c++) {
        var size = decodeInt32(data, pos);
        pos += 4;
        var value = void 0;
        if (size === -1) {
            value = null;
        }
        else {
            var decode = decodeTypes[types[c]];
            if (decode)
                value = decode(data, pos, size);
            else
                value = data.toString('utf8', pos, pos + size);
            pos += size;
        }
        row[c] = value;
    }
    return row;
};
var parseValue = function (columnsCount, decodeTypes, type, task, data, pos) {
    for (var c = 0; c < columnsCount; c++) {
        var size = decodeInt32(data, pos);
        pos += 4;
        var value = void 0;
        if (size === -1) {
            value = null;
        }
        else {
            var decode = decodeTypes[type];
            if (decode)
                value = decode(data, pos, size);
            else
                value = data.toString('utf8', pos, pos + size);
            pos += size;
        }
        if (task.parseInfo.resultNumber === 0)
            task.result = value;
        else
            task.result[task.parseInfo.resultNumber] = value;
        task.parseInfo.skipNextValues = true;
        return;
    }
};

var codes$2;
(function (codes) {
    codes[codes["authenticationCode"] = 'R'.charCodeAt(0)] = "authenticationCode";
    codes[codes["backendKeyDataCode"] = 'K'.charCodeAt(0)] = "backendKeyDataCode";
    codes[codes["parameterStatusCode"] = 'S'.charCodeAt(0)] = "parameterStatusCode";
    codes[codes["readyForQueryCode"] = 'Z'.charCodeAt(0)] = "readyForQueryCode";
    codes[codes["rowDescriptionCode"] = 'T'.charCodeAt(0)] = "rowDescriptionCode";
    codes[codes["dataRowCode"] = 'D'.charCodeAt(0)] = "dataRowCode";
    codes[codes["commandCompleteCode"] = 'C'.charCodeAt(0)] = "commandCompleteCode";
    codes[codes["errorResponseCode"] = 'E'.charCodeAt(0)] = "errorResponseCode";
    codes[codes["noticeResponseCode"] = 'N'.charCodeAt(0)] = "noticeResponseCode";
    codes[codes["bindCode"] = 'B'.charCodeAt(0)] = "bindCode";
    codes[codes["parseCompleteCode"] = '1'.charCodeAt(0)] = "parseCompleteCode";
    codes[codes["bindCompleteCode"] = '2'.charCodeAt(0)] = "bindCompleteCode";
    codes[codes["closeCompleteCode"] = '3'.charCodeAt(0)] = "closeCompleteCode";
    codes[codes["copyDataCode"] = 'd'.charCodeAt(0)] = "copyDataCode";
    codes[codes["copyDoneCode"] = 'c'.charCodeAt(0)] = "copyDoneCode";
    codes[codes["copyFailCode"] = 'f'.charCodeAt(0)] = "copyFailCode";
    codes[codes["copyInResponseCode"] = 'G'.charCodeAt(0)] = "copyInResponseCode";
    codes[codes["copyOutResponseCode"] = 'H'.charCodeAt(0)] = "copyOutResponseCode";
    codes[codes["copyBothResponseCode"] = 'W'.charCodeAt(0)] = "copyBothResponseCode";
    codes[codes["functionCallResponseCode"] = 'V'.charCodeAt(0)] = "functionCallResponseCode";
    codes[codes["negotiateProtocolVersionCode"] = 'v'.charCodeAt(0)] = "negotiateProtocolVersionCode";
    codes[codes["noDataCode"] = 'n'.charCodeAt(0)] = "noDataCode";
    codes[codes["notificationResponseCode"] = 'A'.charCodeAt(0)] = "notificationResponseCode";
    codes[codes["emptyQueryResponseCode"] = 'I'.charCodeAt(0)] = "emptyQueryResponseCode";
    codes[codes["parameterDescriptionCode"] = 't'.charCodeAt(0)] = "parameterDescriptionCode";
    codes[codes["portalSuspendedCode"] = 's'.charCodeAt(0)] = "portalSuspendedCode";
})(codes$2 || (codes$2 = {}));
var copy = function (message, data, dataPos) {
    return data.copy(message.buffer, message.cutMessageAllocated, dataPos);
};
var listener = function (socket, message, creds, data, size) {
    if (size === void 0) { size = data.length; }
    var pos = 0;
    var len = message.cutMessageLength;
    if (len !== 0) {
        if (len > message.cutMessageAllocated + data.length) {
            copy(message, data, 0);
            message.cutMessageAllocated += data.length;
            return;
        }
        var copySize = len - message.cutMessageAllocated;
        copy(message, data, 0);
        message.cutMessageLength = 0;
        message.cutMessageAllocated = 0;
        listener(socket, message, creds, message.buffer, len);
        pos = copySize + 1;
    }
    len = getMessageLength(data, pos);
    var task = socket.task;
    while (pos < size) {
        if (pos + len > size) {
            if (message.buffer.length < len)
                message.buffer = Buffer.alloc(len + 1, message.buffer);
            copy(message, data, pos);
            message.cutMessageAllocated = size - pos;
            message.cutMessageLength = len;
            break;
        }
        var code = data[pos];
        if (code === codes$2.dataRowCode) {
            parseRow(socket, task, data, pos);
        }
        else if (code === codes$2.rowDescriptionCode) {
            parseDescription(socket, task, data, pos);
        }
        else if (code === codes$2.readyForQueryCode) {
            return task.finish(socket, task);
        }
        else if (code === codes$2.errorResponseCode || code === codes$2.noticeResponseCode) {
            var level = parseError(task, data, pos).level;
            if (level !== 'ERROR')
                return task.finish(socket, task);
        }
        else if (code === codes$2.authenticationCode) {
            auth(socket, task, creds, data, pos);
        }
        else if (code === codes$2.commandCompleteCode) {
            complete(task);
        }
        else {
            if (code !== codes$2.parameterStatusCode &&
                code !== codes$2.backendKeyDataCode) {
                console.warn("Handling of " + String.fromCharCode(code) + " code is not implemented yet");
            }
        }
        pos = skipMessage(data, pos);
        len = getMessageLength(data, pos);
    }
};
var handleMessage = function (socket, creds) {
    var message = {
        buffer: Buffer.alloc(10000),
        cutMessageLength: 0,
        cutMessageAllocated: 0,
    };
    socket.dataListener = function (data) { return listener(socket, message, creds, data); };
    socket.on('data', socket.dataListener);
};
var removeListener = function (socket) {
    if (socket.dataListener) {
        socket.removeListener('data', socket.dataListener);
        delete socket.dataListener;
    }
};

var finishTask = function (socket, task) {
    var adapter = task.adapter;
    var prepared = task.prepared;
    var prepareReady = prepared && !socket.prepared[prepared.name];
    if (!prepareReady)
        adapter.log.finish(socket, task);
    if (task.failed)
        task.reject(task.error);
    else if (!prepareReady)
        task.resolve(task.result);
    socket.task = undefined;
    if (prepareReady && !task.failed) {
        socket.prepared[prepared.name] = true;
        if (adapter.task)
            task.next = adapter.task;
        else
            adapter.lastTask = task;
        adapter.task = task;
        task.parseInfo.resultNumber = 0;
    }
    else if (adapter.lastTask === task) {
        adapter.lastTask = undefined;
    }
    next(adapter, socket);
};
var createTask = function (_a) {
    var adapter = _a.adapter, mode = _a.mode, query = _a.query, error = _a.error, decodeTypes = _a.decodeTypes, prepared = _a.prepared, resolve = _a.resolve, reject = _a.reject, _b = _a.finish, finish = _b === void 0 ? finishTask : _b;
    return ({
        adapter: adapter, mode: mode, query: query, error: error, decodeTypes: decodeTypes, prepared: prepared, resolve: resolve, reject: reject, finish: finish,
        parseInfo: {
            resultNumber: 0,
            skipNextValues: false
        }
    });
};
var addTaskToAdapter = function (adapter, task) {
    if (adapter.task) {
        adapter.lastTask.next = task;
        adapter.lastTask = task;
    }
    else {
        adapter.task = task;
        adapter.lastTask = task;
        for (var _i = 0, _a = adapter.sockets; _i < _a.length; _i++) {
            var socket = _a[_i];
            if (!socket.task) {
                next(adapter, socket);
                return;
            }
        }
    }
};
var queryCode = 'Q'.charCodeAt(0);
var next = function (adapter, socket) {
    var task = adapter.task;
    if (!task)
        return;
    socket.task = task;
    adapter.task = task.next;
    var query;
    if (!task.prepared || socket.prepared[task.prepared.name])
        query = task.query;
    else
        query = task.prepared.sql;
    var len = Buffer.byteLength(query) + 5;
    var buffer = Buffer.alloc(len + 1);
    buffer[0] = queryCode;
    encodeInt32(buffer, 1, len);
    buffer.fill(query, 5);
    buffer[len] = 0;
    adapter.log.start(socket, task);
    socket.write(buffer);
};

var checkSSLMessage = Buffer.alloc(8);
encodeInt32(checkSSLMessage, 0, 8);
encodeInt32(checkSSLMessage, 4, 80877103);
var SSLCode = 'S'.charCodeAt(0);
var versionBuf = Buffer.alloc(4);
encodeInt32(versionBuf, 0, 196608);
var Connect = /** @class */ (function () {
    function Connect(adapter, socket, settings) {
        this.adapter = adapter;
        this.socket = socket;
        this.settings = settings;
    }
    Connect.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.socket.prepared = {};
            _this.addTask(resolve, reject);
            _this.socketConnect().then(function () { return _this.checkSSL(); });
        });
    };
    Connect.prototype.addTask = function (resolve, reject) {
        var adapter = this.adapter;
        var error = new Error();
        var task = createTask({
            adapter: adapter, error: error, resolve: resolve, reject: reject,
            mode: exports.ResultMode.skip,
            query: 'Startup message',
            decodeTypes: {},
            finish: this.finish
        });
        this.task = task;
        this.socket.task = task;
    };
    Connect.prototype.socketConnect = function () {
        var _this = this;
        var _a = this.settings, port = _a.port, host = _a.host;
        return new Promise(function (resolve) {
            return _this.socket.connect(port, host, resolve);
        });
    };
    Connect.prototype.checkSSL = function () {
        var _this = this;
        this.socket.write(checkSSLMessage);
        var listener = function (data) {
            _this.sslResponseHandler(data, listener);
        };
        this.socket.on('data', listener);
    };
    Connect.prototype.sslResponseHandler = function (data, listener) {
        var _this = this;
        var _a = this, socket = _a.socket, host = _a.settings.host;
        socket.removeListener('data', listener);
        var code = data[0];
        if (code === SSLCode) {
            var options = {
                socket: socket,
                checkServerIdentity: tls__default['default'].checkServerIdentity,
                rejectUnauthorized: false,
                servername: net.isIP(host) === 0 ? host : undefined
            };
            var task = this.socket.task;
            this.socket = tls__default['default'].connect(options, function () {
                return _this.sendStartupMessage();
            });
            this.socket.task = task;
            this.socket.prepared = {};
        }
        else {
            this.sendStartupMessage();
        }
    };
    Connect.prototype.sendStartupMessage = function () {
        var socket = this.socket;
        handleMessage(socket, this.settings);
        var _a = this.settings, user = _a.user, database = _a.database;
        var message = "user\0" + user + "\0database\0" + database + "\0\0";
        var len = 8 + Buffer.byteLength(message);
        var buf = Buffer.alloc(len);
        encodeInt32(buf, 0, len);
        versionBuf.copy(buf, 4);
        buf.fill(message, 8);
        socket.write(buf);
    };
    Connect.prototype.finish = function (socket, task) {
        socket.task = undefined;
        if (task.failed)
            task.reject(task.error);
        else {
            task.resolve(socket);
            next(task.adapter, socket);
        }
    };
    return Connect;
}());
var connect = function (adapter, socket, settings) {
    return new Connect(adapter, socket, settings).connect();
};

var sync = function (_a) {
    var last = _a.lastTask;
    if (!last)
        return;
    var finish = last.finish;
    return new Promise(function (resolve) {
        last.finish = function (socket, task) {
            finish(socket, task);
            resolve();
        };
    });
};

var close = function (adapter) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, _a, socket;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, adapter.sync()];
            case 1:
                _b.sent();
                adapter.connected = false;
                for (_i = 0, _a = adapter.sockets; _i < _a.length; _i++) {
                    socket = _a[_i];
                    socket.destroy();
                    removeListener(socket);
                }
                return [2 /*return*/];
        }
    });
}); };

var trueCode = 'T'.charCodeAt(0);
var toInt = function (value, pos, size) {
    return parseInt(value.toString(undefined, pos, pos + size));
};
var toFloat = function (value, pos, size) {
    return parseFloat(value.toString(undefined, pos, pos + size));
};
var toIntFromBinary = function (value, pos, size) {
    return parseInt(value.toString(undefined, pos, pos + size), 2);
};
var toBoolean = function (value) {
    return value[0] === trueCode;
};
var toDate = function (value, pos, size) {
    return new Date(value.toString(undefined, pos, pos + size));
};
var defaultDecodeTypes = {
    20: toInt,
    21: toInt,
    23: toInt,
    700: toFloat,
    701: toFloat,
    1700: toFloat,
    1560: toIntFromBinary,
    1562: toIntFromBinary,
    16: toBoolean,
    1082: toDate,
    1114: toDate,
    1184: toDate,
};

var singleQuoteRegex = /'/g;
var doubleQuoteRegex = /"/g;
var quoteValue = (function (value) {
    var type = typeof value;
    if (type === 'number')
        return value;
    else if (type === 'string')
        return "\"" + value.replace(doubleQuoteRegex, '\\"').replace(singleQuoteRegex, "''") + "\"";
    else if (type === 'boolean')
        return value ? 'true' : 'false';
    else if (value instanceof Date)
        return "\"" + value.toISOString() + "\"";
    else if (Array.isArray(value))
        return quoteArray(value);
    else if (type === null || type === undefined)
        return 'NULL';
    else
        return "\"" + JSON.stringify(value).replace(doubleQuoteRegex, '\\"').replace(singleQuoteRegex, "''") + "\"";
});
var quoteArray = function (array) {
    return "'{" + array.map(quoteValue).join(',') + "}'";
};
var quote = (function (value) {
    var type = typeof value;
    if (type === 'number')
        return "" + value;
    else if (type === 'string')
        return "'" + value.replace(singleQuoteRegex, "''") + "'";
    else if (type === 'boolean')
        return value ? 'true' : 'false';
    else if (value instanceof Date)
        return "'" + value.toISOString() + "'";
    else if (Array.isArray(value))
        return quoteArray(value);
    else if (value === null || value === undefined)
        return 'NULL';
    else
        return "'" + JSON.stringify(value).replace(singleQuoteRegex, "''") + "'";
});

var process$1 = function (parts, args) {
    if (typeof parts === 'string')
        return parts;
    var result = new Array(parts.length + args.length);
    var last = parts.length - 1;
    parts.forEach(function (part, i) {
        if (i === 0)
            part = part.trimLeft();
        if (i === last)
            part = part.trimRight();
        var arg = args[i];
        result.push(part, arg && quote(args[i]));
    });
    return result.join('');
};
var sql = function (parts) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return process$1(parts, args);
};
var sql2 = function (parts, args) {
    return typeof parts === 'string' ? parts : process$1(parts, args);
};

var defaultLog = {
    start: function (socket) {
        socket.queryStartTime = process.hrtime();
    },
    finish: function (socket, task) {
        var time = (process.hrtime(socket.queryStartTime)[1] / 1000000).toFixed(1);
        if (task.failed)
            console.log(chalk__default['default'].bold.magenta("(" + time + "ms)") + ' ' + chalk__default['default'].bold.red(task.query));
        else
            console.log(chalk__default['default'].bold.cyanBright("(" + time + "ms)") + ' ' + chalk__default['default'].bold.blue(task.query));
    }
};
var noop$1 = function () { };
var noopLog = {
    start: noop$1,
    finish: noop$1,
};

var AdapterBase = /** @class */ (function () {
    function AdapterBase(_a) {
        var pool = _a.pool, decodeTypes = _a.decodeTypes, log = _a.log;
        this.sockets = new Array(pool).fill(null).map(function () {
            return new net.Socket({ readable: true, writable: true });
        });
        this.decodeTypes = decodeTypes;
        if (log === true)
            this.log = defaultLog;
        else if (log === false)
            this.log = noopLog;
        else
            this.log = log;
    }
    AdapterBase.prototype.connect = function () { };
    AdapterBase.prototype.performQuery = function (mode, query, args, prepared) {
        var _this = this;
        this.connect();
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var error, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!query.then) return [3 /*break*/, 2];
                        return [4 /*yield*/, query];
                    case 1:
                        query = _a.sent();
                        _a.label = 2;
                    case 2:
                        error = new Error();
                        task = createTask({
                            mode: mode, error: error, resolve: resolve, reject: reject, prepared: prepared,
                            adapter: this,
                            query: sql2(query, args),
                            decodeTypes: this.decodeTypes,
                        });
                        addTaskToAdapter(this, task);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    AdapterBase.prototype.query = function (sql) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return this.performQuery(exports.ResultMode.objects, sql, args);
    };
    AdapterBase.prototype.objects = function (sql) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return this.performQuery(exports.ResultMode.objects, sql, args);
    };
    AdapterBase.prototype.arrays = function (sql) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return this.performQuery(exports.ResultMode.arrays, sql, args);
    };
    AdapterBase.prototype.value = function (sql) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return this.performQuery(exports.ResultMode.value, sql, args);
    };
    AdapterBase.prototype.exec = function (sql) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return this.performQuery(exports.ResultMode.skip, sql, args);
    };
    return AdapterBase;
}());

var noop$2 = function () { };
var queries;
(function (queries) {
    queries["begin"] = "BEGIN";
    queries["commit"] = "COMMIT";
    queries["rollback"] = "ROLLBACK";
})(queries || (queries = {}));
var applyFn = function (t, fn) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fn(t)];
            case 1:
                _a.sent();
                t.commit();
                return [2 /*return*/];
        }
    });
}); };
var transaction = function (adapter, error, fn) {
    var t = new Transaction(adapter, error);
    var promises = [t.promise];
    if (fn)
        promises.push(applyFn(t, fn));
    return Promise.all(promises);
};
var wrapperTransaction = function (adapter, error, target, fn) {
    var t = new Transaction(adapter, error);
    var promises = [t.promise];
    var proxy = new Proxy(t, {
        get: function (t, name) { return t[name] || target[name]; }
    });
    if (fn)
        promises.push(applyFn(proxy, fn));
    return Promise.all(promises);
};
var Transaction = /** @class */ (function (_super) {
    __extends(Transaction, _super);
    function Transaction(adapter, error) {
        var _this = _super.call(this, { pool: 0, decodeTypes: adapter.decodeTypes, log: adapter.log }) || this;
        _this.failed = false;
        _this.afterBegin = function (socket, task) {
            var adapter = task.adapter;
            adapter.log.finish(socket, task);
            var index = adapter.sockets.indexOf(socket);
            adapter.sockets.splice(index, 1);
            _this.sockets[0] = socket;
            if (adapter.lastTask === task)
                adapter.lastTask = undefined;
            socket.task = undefined;
            next(_this, socket);
        };
        _this.finish = function (socket, task) {
            var transaction = task.adapter;
            transaction.log.finish(socket, task);
            var error = _this.failed ? _this.error : task.failed && task.error;
            error ? task.reject(error) : task.resolve(error);
            transaction.sockets.length = 0;
            transaction.task = task.next;
            transaction.adapter.sockets.push(socket);
            if (transaction.adapter.lastTask === task)
                transaction.adapter.lastTask = undefined;
            socket.task = undefined;
            next(transaction.adapter, socket);
        };
        _this.catch = function (err) {
            if (_this.failed)
                return;
            _this.error = err;
            _this.failed = true;
        };
        _this.adapter = adapter;
        _this.error = error;
        _this.resolve = noop$2;
        _this.reject = noop$2;
        _this.promise = new Promise(function (resolve, reject) {
            _this.resolve = resolve;
            _this.reject = reject;
        });
        _this.adapter.connect();
        var task = createTask({
            adapter: _this.adapter,
            error: _this.error,
            resolve: noop$2,
            reject: noop$2,
            decodeTypes: _this.adapter.decodeTypes,
            mode: exports.ResultMode.skip,
            query: queries.begin,
            finish: _this.afterBegin,
        });
        addTaskToAdapter(_this.adapter, task);
        return _this;
    }
    Transaction.prototype.transaction = function () {
        var error = new Error();
        return transaction(this, error);
    };
    Transaction.prototype.commit = function () {
        return this.end(queries.commit);
    };
    Transaction.prototype.rollback = function () {
        return this.end(queries.rollback);
    };
    Transaction.prototype.end = function (query, err) {
        if (query === void 0) { query = queries.commit; }
        var task = createTask({
            query: query,
            adapter: this,
            error: err || this.error,
            resolve: this.resolve,
            reject: this.reject,
            finish: this.finish,
            decodeTypes: this.adapter.decodeTypes,
            mode: exports.ResultMode.skip,
        });
        addTaskToAdapter(this, task);
        return this;
    };
    Transaction.prototype.performQuery = function (mode, query, args, prepared) {
        var promise = _super.prototype.performQuery.call(this, mode, query, args, prepared);
        promise.catch(this.catch);
        return promise;
    };
    Transaction.prototype.then = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = this.promise).then.apply(_a, args);
    };
    return Transaction;
}(AdapterBase));

var prepare = function (adapter, name) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return function (prepareTemplate, prepareArgs) {
        var arr = ['PREPARE ', name];
        if (args.length)
            arr.push("(" + args.join(', ') + ")");
        arr.push(' AS ');
        var last = prepareTemplate.length - 1;
        prepareTemplate.forEach(function (part, i) {
            if (i === 0)
                part = part.trimLeft();
            if (i === last)
                part = part.trimRight();
            arr.push(part, prepareArgs && prepareArgs[i]);
        });
        var prepared = Object.create(adapter);
        prepared.sql = arr.join('');
        prepared.name = name;
        prepared.performQuery = function (mode, args) {
            var sql = "EXECUTE " + name;
            if (args && args.length) {
                var parts = args[0];
                if (parts.raw)
                    sql += "(" + sql2(parts, args.slice(1)) + ")";
                else
                    sql += "(" + args.map(quote).join(', ') + ")";
            }
            return adapter.performQuery(mode, sql, undefined, prepared);
        };
        prepared.objects = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return prepared.performQuery(exports.ResultMode.objects, args);
        };
        prepared.arrays = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return prepared.performQuery(exports.ResultMode.arrays, args);
        };
        prepared.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return prepared.performQuery(exports.ResultMode.value, args);
        };
        prepared.exec = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return prepared.performQuery(exports.ResultMode.skip, args);
        };
        prepared.query = prepared.objects;
        return new Proxy(adapter, {
            get: function (target, name) { return prepared[name] || adapter[name]; }
        });
    };
};

var Adapter = /** @class */ (function (_super) {
    __extends(Adapter, _super);
    function Adapter(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.host, host = _c === void 0 ? '127.0.0.1' : _c, _d = _b.port, port = _d === void 0 ? 5432 : _d, _e = _b.database, database = _e === void 0 ? 'postgres' : _e, _f = _b.user, user = _f === void 0 ? process.env.USER || 'postgres' : _f, _g = _b.password, password = _g === void 0 ? '' : _g, _h = _b.pool, pool = _h === void 0 ? 10 : _h, _j = _b.log, log = _j === void 0 ? Adapter.defaultLog : _j, decodeTypes = _b.decodeTypes;
        var _this = _super.call(this, { pool: pool, decodeTypes: decodeTypes || defaultDecodeTypes, log: log }) || this;
        _this.connected = false;
        _this.sync = function () {
            return sync(_this);
        };
        _this.close = function () {
            return close(_this);
        };
        _this.connectionSettings = {
            host: host, port: port, database: database, user: user, password: password
        };
        _this.pool = pool;
        return _this;
    }
    Adapter.fromURL = function (urlOrOptions, options) {
        if (typeof urlOrOptions === 'object')
            return new this(__assign(__assign({}, parseUrl(process.env.DATABASE_URL)), urlOrOptions));
        else
            return new this(__assign(__assign({}, parseUrl(urlOrOptions)), options));
    };
    Adapter.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var promises, i, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.connected)
                            return [2 /*return*/];
                        this.connected = true;
                        promises = [];
                        for (i = 0; i < this.pool; i++)
                            promises.push(connect(this, this.sockets[i], this.connectionSettings));
                        _a = this;
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sockets = _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Adapter.prototype.transaction = function (fn) {
        var error = new Error();
        return transaction(this, error, fn);
    };
    Adapter.prototype.wrapperTransaction = function (target, fn) {
        var error = new Error();
        return wrapperTransaction(this, error, target, fn);
    };
    Adapter.prototype.prepare = function (name) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return prepare.apply(void 0, __spreadArrays([this, name], args));
    };
    Adapter.defaultLog = defaultLog;
    return Adapter;
}(AdapterBase));

exports.Adapter = Adapter;
exports.AdapterBase = AdapterBase;
exports.Transaction = Transaction;
exports.parseUrl = parseUrl;
exports.quote = quote;
exports.sql = sql;
