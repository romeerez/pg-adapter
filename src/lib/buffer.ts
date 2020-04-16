export const encodeInt32 = (buf: Buffer, i: number, n: number) => {
  buf[i] = n >> 24 & 0xff
  buf[i + 1] = n >> 16 & 0xff
  buf[i + 2] = n >> 8 & 0xff
  buf[i + 3] = n & 0xff
}

export const decodeInt32 = (data: Buffer, i: number) =>
  data[i + 3] + (data[i + 2] << 8) + (data[i + 1] << 16) + (data[i] << 24)

export const decodeInt16 = (data: Buffer, i: number) =>
  data[i + 1] + (data[i] << 8)

export const getMessageLength = (data: Buffer, pos: number) =>
  decodeInt32(data, pos + 1)

export const skipMessage = (data: Buffer, pos: number) =>
  pos + getMessageLength(data, pos) + 1

export const noop = () => {}

export const throwError = (err: Error) => { throw err }

export const getMessage = (data: Buffer, pos = 0, offset = 0) =>
  data.slice(pos + offset + 5, getMessageLength(data, pos) + 1)
