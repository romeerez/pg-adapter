const singleQuoteRegex = /'/g
const doubleQuoteRegex = /"/g

const quoteValue = (value: any) => {
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

const quoteArray = (array: any[]) =>
  `'{${array.map(quoteValue).join(',')}}'`

export const quote = (value: any) => {
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
