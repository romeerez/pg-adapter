"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUrl = void 0;
exports.parseUrl = (url = process.env.DATABASE_URL) => {
    if (!url)
        throw new Error('Provide url or DATABASE_URL env variable');
    const dbUrl = require('url').parse(url);
    const scheme = dbUrl.protocol.substr(0, dbUrl.protocol.length - 1);
    if (scheme.indexOf('postgres') === -1)
        throw new Error(`Database url ${url} does not seem to be postgres`);
    let [host, port] = dbUrl.host.split(':');
    const [user, password] = dbUrl.auth.split(':');
    return {
        host: host,
        port: +port || 5432,
        database: dbUrl.path.slice(1),
        user,
        password,
    };
};
