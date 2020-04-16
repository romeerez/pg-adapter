import {noop} from 'lib/buffer'
import {Task, PgError} from 'types'

const charKeyCodes: {[key: string]: any} = {
  S: (error: Partial<PgError>, message: string) => error.level = message,
  M: (error: Partial<PgError>, message: string) => error.message = message,
  D: (error: Partial<PgError>, message: string) => error.details = message,
  C: noop,
  H: (error: Partial<PgError>, message: string) => error.hint = message,
  P: (error: Partial<PgError>, message: string) => error.position = message,
  p: (error: Partial<PgError>, message: string) => error.innerPosition = message,
  q: (error: Partial<PgError>, message: string) => error.innerQuery = message,
  W: (error: Partial<PgError>, message: string) => error.trace = message,
  s: (error: Partial<PgError>, message: string) => error.schema = message,
  t: (error: Partial<PgError>, message: string) => error.table = message,
  c: (error: Partial<PgError>, message: string) => error.column = message,
  d: (error: Partial<PgError>, message: string) => error.dataType = message,
  n: (error: Partial<PgError>, message: string) => error.constraint = message,
  F: (error: Partial<PgError>, message: string) => error.file = message,
  L: (error: Partial<PgError>, message: string) => error.line = message,
  R: (error: Partial<PgError>, message: string) => error.process = message,
  V: noop
}

const codes: {[key: string]: any} = {}

for (let code in charKeyCodes) {
  codes[code.charCodeAt(0)] = charKeyCodes[code]
  delete charKeyCodes[code]
}

export const parseError = (task: Task, data: Buffer, pos: number) => {
  const error: Partial<PgError> = {}
  pos += 5
  const len = data.length
  error.query = task.query
  let last
  while (pos < len) {
    if (data[pos] === 0) {
      last = true
      break
    }

    const stringCode = String(data[pos])
    let code
    for (code in codes)
      if (code === stringCode)
        break
    if (code !== stringCode) break
    const nextPos = data.indexOf('\0', pos + 1) + 1
    codes[code](error, String(data.slice(pos + 1, nextPos - 1)))
    pos = nextPos
  }
  task.failed = true
  return Object.assign(task.error, error)
}
