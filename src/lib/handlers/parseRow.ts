import { Socket } from 'net'
import { decodeInt32 } from '../buffer'
import { DecodeTypes, ResultMode, Task } from '../../types'

export const parseRow = (
  socket: Socket,
  task: Task,
  data: Buffer,
  pos: number,
) => {
  const { mode, parseInfo } = task
  if (mode === ResultMode.skip || parseInfo.skipNextValues) return

  pos += 7

  let row
  if (mode === ResultMode.objects)
    row = parseObjects(
      parseInfo.columnsCount as number,
      task.decodeTypes,
      parseInfo.types as Uint32Array,
      parseInfo.names as string[],
      data,
      pos,
    )
  else if (mode === ResultMode.arrays)
    row = parseArrays(
      parseInfo.columnsCount as number,
      task.decodeTypes,
      parseInfo.types as Uint32Array,
      parseInfo.names as string[],
      data,
      pos,
    )
  else if (mode === ResultMode.value)
    return parseValue(
      parseInfo.columnsCount as number,
      task.decodeTypes,
      parseInfo.type as number,
      task,
      data,
      pos,
    )

  if (parseInfo.resultNumber === 0) (task.result as unknown[]).push(row)
  else (task.result as unknown[][])[parseInfo.resultNumber].push(row)
}

const parseObjects = (
  columnsCount: number,
  decodeTypes: DecodeTypes,
  types: Uint32Array,
  names: string[],
  data: Buffer,
  pos: number,
) => {
  const row = {}
  for (let c = 0; c < columnsCount; c++) {
    const size = decodeInt32(data, pos)
    pos += 4
    let value
    if (size === -1) {
      value = null
    } else {
      const decode = decodeTypes[types[c]]
      if (decode) value = decode(data, pos, size)
      else value = data.toString('utf8', pos, pos + size)
      pos += size
    }
    ;(row as { [key: string]: unknown })[(names as string[])[c]] = value
  }
  return row
}

const parseArrays = (
  columnsCount: number,
  decodeTypes: DecodeTypes,
  types: Uint32Array,
  names: string[],
  data: Buffer,
  pos: number,
) => {
  const row = new Array(columnsCount)

  for (let c = 0; c < (columnsCount as number); c++) {
    const size = decodeInt32(data, pos)
    pos += 4
    let value
    if (size === -1) {
      value = null
    } else {
      const decode = decodeTypes[types[c]]
      if (decode) value = decode(data, pos, size)
      else value = data.toString('utf8', pos, pos + size)
      pos += size
    }
    ;(row as unknown[])[c] = value
  }
  return row
}

const parseValue = (
  columnsCount: number,
  decodeTypes: DecodeTypes,
  type: number,
  task: Task,
  data: Buffer,
  pos: number,
) => {
  for (let c = 0; c < (columnsCount as number); c++) {
    const size = decodeInt32(data, pos)
    pos += 4
    let value
    if (size === -1) {
      value = null
    } else {
      const decode = decodeTypes[type]
      if (decode) value = decode(data, pos, size)
      else value = data.toString('utf8', pos, pos + size)
      pos += size
    }
    if (task.parseInfo.resultNumber === 0) task.result = value
    else (task.result as unknown[])[task.parseInfo.resultNumber] = value
    task.parseInfo.skipNextValues = true
    return
  }
}
