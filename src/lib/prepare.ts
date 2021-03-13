import { AdapterBase } from './adapterBase'
import { ResultMode, Prepared } from '../types'
import { sql2 } from './sql'
import { Value, quote } from './quote'

export const prepare = (
  adapter: AdapterBase,
  name: string,
  args: string[],
  query: string,
) => {
  const arr: (number | string)[] = ['PREPARE "', name, '"']
  if (args.length) arr.push(`(${args.join(', ')})`)
  arr.push(' AS ', query)

  const prepared = Object.create(adapter) as Prepared
  prepared.sql = arr.join('')
  prepared.name = name
  prepared.performQuery = (mode: ResultMode, args?: Value[]) => {
    let sql = `EXECUTE "${name}"`
    if (args?.length) sql += `(${(args as Value[]).map(quote).join(', ')})`
    return adapter.performQuery(mode, sql, undefined, prepared)
  }

  prepared.objects = (...args: Value[]) =>
    prepared.performQuery(ResultMode.objects, args)
  prepared.arrays = (...args: Value[]) =>
    prepared.performQuery(ResultMode.arrays, args)
  prepared.value = (...args: Value[]) =>
    prepared.performQuery(ResultMode.value, args)
  prepared.exec = (...args: Value[]) =>
    prepared.performQuery(ResultMode.skip, args)
  prepared.query = prepared.objects

  return (new Proxy(adapter, {
    get: (target: AdapterBase & Prepared, name: keyof AdapterBase & Prepared) =>
      prepared[name as keyof Prepared] || adapter[name as keyof AdapterBase],
  }) as unknown) as Prepared
}
