"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.codes = void 0;
const crypto_1 = __importDefault(require("crypto"));
const buffer_1 = require("../buffer");
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
})(codes = exports.codes || (exports.codes = {}));
const makeAuthCleartext = (socket, creds) => respond(socket, Buffer.from(`p\0\0\0\0${creds.password}\0`, 'utf8'));
const md5 = (data) => crypto_1.default.createHash('md5').update(data).digest('hex');
const makeAuthMD5 = (socket, { password, user }, data) => {
    let message;
    const creds = md5(password + user);
    const salt = data.slice(9);
    message = 'md5' + md5(Buffer.concat([Buffer.from(creds), salt]));
    respond(socket, Buffer.from(`p\0\0\0\0${message}\0`, 'utf8'));
};
const makeAuthSASLInit = (socket, request) => {
    const clientNonce = crypto_1.default.randomBytes(18).toString('base64');
    request.authData = { clientNonce };
    const message = 'n,,n=*,r=' + clientNonce;
    const mechanism = 'SCRAM-SHA-256';
    const buffer = Buffer.from(`p\0\0\0\0${mechanism}\0\0\0\0\0${message}`);
    buffer_1.encodeInt32(buffer, 6 + mechanism.length, message.length);
    respond(socket, buffer);
};
const makeAuthSASLContinue = (socket, request, creds, data) => {
    if (!request.authData)
        throw new Error('Invalid SASL auth flow');
    const clientNonce = request.authData.clientNonce;
    if (!clientNonce)
        throw new Error('Invalid SASL auth flow');
    let nonce, salt, iteration;
    String(buffer_1.getMessage(data, 0, 4)).split(',').forEach(param => {
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
    const password = Buffer.from(creds.password, 'utf8');
    const saltBytes = Buffer.from(salt, 'base64');
    let ui1 = createHMAC(password, Buffer.concat([saltBytes, Buffer.from([0, 0, 0, 1])]));
    let saltedPassword = ui1;
    for (let i = iteration - 1; i > 0; i--) {
        ui1 = createHMAC(password, ui1);
        saltedPassword = xorBuffers(saltedPassword, ui1);
    }
    let clientKey = createHMAC(saltedPassword, 'Client Key');
    let storedKey = crypto_1.default.createHash('sha256').update(clientKey).digest();
    let messageWithoutProof = `c=biws,r=${nonce}`;
    let authMessage = `n=*,r=${clientNonce},r=${nonce},s=${salt},i=${iteration},${messageWithoutProof}`;
    let clientSignature = createHMAC(storedKey, authMessage);
    let clientProof = xorBuffers(clientKey, clientSignature).toString('base64');
    let serverKey = createHMAC(saltedPassword, 'Server Key');
    request.authData.signature = createHMAC(serverKey, authMessage).toString('base64');
    respond(socket, Buffer.from(`p\0\0\0\0${messageWithoutProof},p=${clientProof}`));
};
const makeAuthSASLFinal = (socket, request, data) => {
    var _a;
    const signature = (_a = request.authData) === null || _a === void 0 ? void 0 : _a.signature;
    if (!signature)
        throw new Error('Invalid SASL auth flow');
    if (!buffer_1.getMessage(data, 0, 4).includes('v=' + signature))
        throw new Error('SASL: server signature does not match');
};
const respond = (socket, buffer) => {
    buffer_1.encodeInt32(buffer, 1, buffer.length - 1);
    socket.write(buffer);
};
const createHMAC = (key, msg) => crypto_1.default.createHmac('sha256', key).update(msg).digest();
const xorBuffers = (a, b) => {
    const len = Math.max(a.length, b.length);
    let res = Buffer.alloc(len);
    for (let i = 0; i < len; i++)
        res[i] = a[i] ^ b[i];
    return res;
};
exports.auth = (socket, request, creds, data, pos) => {
    const authType = buffer_1.decodeInt32(data, pos + 5);
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
        return `unsupported auth type: kerberos`;
    else if (authType === codes.SCMCredential)
        return `unsupported auth type: SCM credential`;
    else if (authType === codes.GSS)
        return `unsupported auth type: GSS`;
    else if (authType === codes.SSPI)
        return `unsupported auth type: SSPI`;
    else
        return `unknown auth type with code ${authType}`;
};
