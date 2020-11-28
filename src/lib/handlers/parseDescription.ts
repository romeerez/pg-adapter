import { Socket } from 'net'
import { decodeInt32, decodeInt16 } from '../buffer'
import { Task, ResultMode } from '../../types'

export const parseDescription = (
  socket: Socket,
  request: Task,
  data: Buffer,
  pos: number,
) => {
  let result
  const mode = request.mode
  const { parseInfo } = request
  if (mode !== ResultMode.skip) {
    const columnsCount = decodeInt16(data, pos + 5)
    if (mode === ResultMode.value) {
      const to = data.indexOf('\0', pos + 7)
      parseInfo.type = decodeInt32(data, to + 7)
    } else {
      pos += 7
      const names = new Array(columnsCount)
      const types = new Uint32Array(columnsCount)
      for (let c = 0; c < columnsCount; c++) {
        const to = data.indexOf('\0', pos)
        names[c] = String(data.slice(pos, to))
        pos = to + 7
        types[c] = decodeInt32(data, pos)
        pos += 12
      }
      parseInfo.names = names
      parseInfo.types = types
      result = []
    }
    parseInfo.columnsCount = columnsCount
  }

  const { resultNumber } = parseInfo
  if (resultNumber === 0) request.result = result
  else if (resultNumber === 1) request.result = [request.result, result]
  else (request.result as unknown[])[resultNumber] = result
}
