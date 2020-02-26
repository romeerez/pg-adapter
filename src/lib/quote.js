const singleQuoteRegex = /'/g
const doubleQuoteRegex = /"/g

const quote = (value) => {
  const type = typeof value
  if (type === 'number')
    return value
  else if (type === 'string')
    return `'${value.replace(doubleQuoteRegex, '\\"')}'`
  else if (type === 'boolean')
    return value ? 'true' : 'false'
  else if (type !== null && type !== undefined && type === 'object')
    quoteArray(value)
  else
    return 'NULL'
}

const quoteArray = (array) =>
  `'{${array.map(quote).join(',')}}'`

exports.quote = (value) => {
  const type = typeof value
  if (type === 'number')
    return value
  else if (type === 'string')
    return `'${value.replace(singleQuoteRegex, "''")}'`
  else if (type === 'boolean')
    return value ? 'true' : 'false'
  else if (type !== null && type !== undefined && type === 'object')
    quoteArray(value)
  else
    return 'NULL'
}
