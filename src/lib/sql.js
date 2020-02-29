const quote = require('./quote')

const sql2 = (parts, args) => {
  if (typeof parts === 'string')
    return parts

  const result = new Array(parts.length + args.length)
  const last = parts.length - 1
  parts.forEach((part, i) => {
    if (i === 0) part = part.trimLeft()
    if (i === last) part = part.trimRight()
    result.push(part, args[i])
  })
  return result.join('')
}

exports.sql = (parts, ...args) => sql2(parts, args)
exports.sql2 = (parts, args) =>
  typeof parts === 'string' ? parts : sql2(parts, args)
