exports.parseURL = (url = process.env.DATABASE_URL) => {
  const dbUrl = require('url').parse(url)
  const scheme = dbUrl.protocol.substr(0, dbUrl.protocol.length - 1)
  if (scheme.indexOf('postgres') === -1)
    throw new Error(`Database url ${url} does not seem to be postgres`)

  let [host, port] = dbUrl.host.split(':')
  return {
    host: host,
    port: port || 5432,
    database: dbUrl.path,
    user: dbUrl.auth.substr(0, dbUrl.auth.indexOf(':')),
    password: dbUrl.auth.substr(dbUrl.auth.indexOf(':') + 1, dbUrl.auth.length),
  }
}
