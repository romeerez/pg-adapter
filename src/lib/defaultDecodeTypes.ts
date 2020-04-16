const trueCode = 't'.charCodeAt(0)

const toInt = (value: Buffer, pos: number, size: number) =>
  parseInt(value.toString(undefined, pos, pos + size))

const toFloat = (value: Buffer, pos: number, size: number) =>
  parseFloat(value.toString(undefined, pos, pos + size))

const toIntFromBinary = (value: Buffer, pos: number, size: number) =>
  parseInt(value.toString(undefined, pos, pos + size), 2)

const toBoolean = (value: Buffer) =>
  value[0] === trueCode

const toDate = (value: Buffer, pos: number, size: number) =>
  new Date(value.toString(undefined, pos, pos + size))

export const defaultDecodeTypes = {
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
