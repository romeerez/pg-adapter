import {
  AdapterProps,
  ConnectionSettingType,
  Log,
  ResultMode,
  Prepared,
} from './types'
import { PgError } from './lib/error'
import { parseUrl } from './lib/parseUrl'
import { connect } from './lib/connect'
import { sync } from './lib/sync'
import { close } from './lib/close'
import { defaultDecodeTypes } from './lib/defaultDecodeTypes'
import { AdapterBase } from './lib/adapterBase'
import { transaction, wrapperTransaction, Transaction } from './lib/transaction'
import { defaultLog } from './lib/log'
import { prepare } from './lib/prepare'
import { Value } from './lib/quote'

export { quote, raw } from './lib/quote'
export { sql } from './lib/sql'
export { parseUrl } from './lib/parseUrl'
export { Transaction, AdapterBase, AdapterProps, ResultMode, PgError, Prepared }

export class Adapter extends AdapterBase {
  static defaultLog: boolean | Log = defaultLog

  connectionSettings: ConnectionSettingType
  pool: number
  connected = false

  constructor({
    host = '127.0.0.1',
    port = 5432,
    database = 'postgres',
    user = process.env.USER || 'postgres',
    password = '',
    pool = 10,
    log = Adapter.defaultLog,
    decodeTypes,
  }: AdapterProps = {}) {
    super({ pool, decodeTypes: decodeTypes || defaultDecodeTypes, log })
    this.connectionSettings = {
      host,
      port,
      database,
      user,
      password,
    }
    this.pool = pool
  }

  static fromURL(urlOrOptions?: string | AdapterProps, options?: AdapterProps) {
    if (typeof urlOrOptions === 'object')
      return new this({
        ...parseUrl(process.env.DATABASE_URL),
        ...urlOrOptions,
      })
    else return new this({ ...parseUrl(urlOrOptions), ...options })
  }

  async connect() {
    if (this.connected) return

    this.connected = true
    const promises = []
    for (let i = 0; i < this.pool; i++)
      promises.push(connect(this, this.sockets[i], this.connectionSettings))
    this.sockets = await Promise.all(promises)
  }

  sync = () => sync(this)

  close = () => close(this)

  transaction(fn?: (t: Transaction) => void) {
    const error = new PgError()
    return transaction(this, error, fn)
  }

  wrapperTransaction<T>(target: T, fn?: (t: T & Transaction) => void) {
    const error = new PgError()
    return wrapperTransaction(this, error, target, fn)
  }

  prepare<Args extends Value[] = Value[]>({
    name,
    args,
    query,
  }: {
    name: string
    args: string[]
    query: string
  }) {
    return prepare<Args>(this, name, args, query)
  }
}
