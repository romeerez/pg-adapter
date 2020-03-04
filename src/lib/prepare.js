const {query} = require('./query')
const {objectsMode, arraysMode, valueMode, skipMode} = require('./handlers/parseDescription')
const {sql2} = require('./sql')
const quote = require('./quote')

exports.prepare = function(name, ...args) {
  return (prepareSql) => {
    const arr = ['PREPARE', name]
    if (args.length)
      arr.push(`(${args.join(', ')})`)
    arr.push('AS', prepareSql)
    const prepared = {}
    prepared.sql = arr.join(' ')
    prepared.name = name
    prepared.prepared = true
    prepared.performQuery = (mode, args) => {
      let message = `EXECUTE ${name}`
      if (args.length) {
        const parts = args[0]
        if (parts.raw)
          message += `(${sql2(parts, args.slice(1))})`
        else
          message += `(${args.map(quote).join(', ')})`
      }
      return query(this, mode, message, new Error(), {prepared})
    }

    prepared.objects = (...args) => prepared.performQuery(objectsMode, args)
    prepared.arrays = (...args) => prepared.performQuery(arraysMode, args)
    prepared.value = (...args) => prepared.performQuery(valueMode, args)
    prepared.exec = (...args) => prepared.performQuery(skipMode, args)
    prepared.query = prepared.objects

    return new Proxy(this, {
      get: (target, name) => prepared[name] || target[name]
    })
  }
}
