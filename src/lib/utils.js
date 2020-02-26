const decodeInt32 = (data, i) =>
  data[i + 3] + (data[i + 2] << 8) + (data[i + 1] << 16) + (data[i] << 24)

const getMessageLength = (data, pos) =>
  decodeInt32(data, pos + 1)

module.exports = {
  decodeInt32, getMessageLength,

  noop: () => {},

  throwError: (err) => {throw err},

  encodeInt32: (buf, i, n) => {
    buf[i] = n >> 24 & 0xff
    buf[i + 1] = n >> 16 & 0xff
    buf[i + 2] = n >> 8 & 0xff
    buf[i + 3] = n & 0xff
  },

  decodeInt16: (data, i) =>
    data[i + 1] + (data[i] << 8),

  skipMessage: (data, pos) =>
    pos + getMessageLength(data, pos) + 1,

  getMessage: (data, pos = 0, offset = 0) =>
    data.slice(pos + offset + 5, getMessageLength(data, pos) + 1)
}
