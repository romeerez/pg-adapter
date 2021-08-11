import { noop } from '../buffer'
import { Task, PgNotice } from '../../types'

const charKeyCodes: {
  [key: string]: (error: PgNotice, message: string) => void
} = {
  S: (error, message) => (error.level = message),
  M: (error, message) => (error.message = message),
  D: (error, message) => (error.details = message),
  C: (error, message) => (error.code = message),
  H: (error, message) => (error.hint = message),
  P: (error, message) => (error.position = message),
  p: (error, message) => (error.innerPosition = message),
  q: (error, message) => (error.innerQuery = message),
  W: (error, message) => (error.trace = message),
  s: (error, message) => (error.schema = message),
  t: (error, message) => (error.table = message),
  c: (error, message) => (error.column = message),
  d: (error, message) => (error.dataType = message),
  n: (error, message) => (error.constraint = message),
  F: (error, message) => (error.file = message),
  L: (error, message) => (error.line = message),
  R: (error, message) => (error.process = message),
  V: noop,
}

const codes: { [key: string]: (error: PgNotice, message: string) => void } = {}

for (const code in charKeyCodes) {
  codes[code.charCodeAt(0)] = charKeyCodes[code]
  delete charKeyCodes[code]
}

export const parseError = (task: Task, data: Buffer, pos: number) => {
  const error = {} as PgNotice
  pos += 5
  const len = data.length
  error.query = task.query
  while (pos < len) {
    if (data[pos] === 0) break

    const stringCode = String(data[pos])
    let code = ''
    for (code in codes) if (code === stringCode) break
    if (code !== stringCode) break
    const nextPos = data.indexOf('\0', pos + 1) + 1
    codes[code](error, String(data.slice(pos + 1, nextPos - 1)))
    pos = nextPos
  }
  return error
}
