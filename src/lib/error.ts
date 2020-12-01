export class PgError extends Error {
  message: string
  code: string
  query?: string
  level?: string
  details?: string
  hint?: string
  position?: string
  innerPosition?: string
  innerQuery?: string
  trace?: string
  schema?: string
  table?: string
  column?: string
  dataType?: string
  constraint?: string
  file?: string
  line?: string
  process?: string

  constructor(message = '', code = '') {
    super(message)
    this.message = message
    this.code = code
  }
}
