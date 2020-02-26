const trueCode = 't'.charCodeAt(0)

const toInt = (value) =>
  parseInt(value.toString())

const toFloat = (value) =>
  parseFloat(value.toString())

const toIntFromBinary = (value) =>
  parseInt(value.toString(), 2)

const toBoolean = (value) =>
  value[0] === trueCode

const toDate = (value) =>
  new Date(value.toString())

module.exports = {
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
}

