import {Socket} from 'net'
import {decodeInt32, decodeInt16, isPositiveInt16} from '../buffer'
import {Task, ResultMode, FieldInfo} from '../../types'

export const parseDescription = (socket: Socket, request: Task, data: Buffer, pos: number) => {
  let result
  const mode = request.mode
  const { parseInfo, getFieldsInfo } = request
  if (mode !== ResultMode.skip) {
    const columnsCount = decodeInt16(data, pos + 5)

    if (mode === ResultMode.value) {
      const to = data.indexOf('\0', pos + 7)
      parseInfo.type = decodeInt32(data, to + 7)

      if (getFieldsInfo) {
        const fieldsInfo = new Array(1)
        request.parseInfo.fieldsInfo = fieldsInfo
        collectFieldsInfo(fieldsInfo, data, 0, to + 1, String(data.slice(pos + 7, to)), parseInfo.type)
      }
    } else {
      pos += 7
      const names = new Array(columnsCount)
      const types = new Uint32Array(columnsCount)

      let fieldsInfo: FieldInfo[] | undefined
      if (getFieldsInfo) {
        fieldsInfo = new Array(columnsCount)
        request.parseInfo.fieldsInfo = fieldsInfo
      }

      for (let c = 0; c < columnsCount; c++) {
        let to = data.indexOf('\0', pos)
        names[c] = String(data.slice(pos, to))
        types[c] = decodeInt32(data, to + 7)

        if (fieldsInfo) {
          collectFieldsInfo(fieldsInfo, data, c, to + 1, names[c], types[c])
        }

        pos = to + 19
      }
      parseInfo.names = names
      parseInfo.types = types
      result = []
    }
    parseInfo.columnsCount = columnsCount
  }

  const {resultNumber} = parseInfo
  if (resultNumber === 0)
    request.result = result
  else if (resultNumber === 1)
    request.result = [request.result, result]
  else
    (request.result as any[])[resultNumber] = result
}

const collectFieldsInfo = (fieldsInfo: FieldInfo[], data: Buffer, index: number, pos: number, name: string, dataTypeID: number) => {
  fieldsInfo[index] = {
    name,
    tableID: decodeInt32(data, pos + 1),
    columnID: decodeInt16(data, pos + 5),
    dataTypeID,
    dataTypeSize: isPositiveInt16(data, pos + 11) ? decodeInt16(data, pos + 11) : -1,
    dataTypeModifier: decodeInt32(data, pos + 13),
    format: decodeInt16(data, pos + 17),
  }
}
