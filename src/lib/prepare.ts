import { AdapterBase } from './adapterBase'
import { ResultMode, Prepared } from '../types'
import { Value, quote } from './quote'

export const prepare = <Args extends Value[] = Value[]>(
  adapter: AdapterBase,
  name: string,
  args: string[],
  query: string,
): Prepared<Args> => {
  const arr: (number | string)[] = ['PREPARE "', name, '"']
  if (args.length) arr.push(`(${args.join(', ')})`)
  arr.push(' AS ', query)

  const prepared = Object.create(adapter) as Prepared<Args>
  prepared.sql = arr.join('')
  prepared.name = name
  prepared.performQuery = (mode, args) => {
    let sql = `EXECUTE "${name}"`
    if (args?.length) sql += `(${(args as Args).map(quote).join(', ')})`
    return adapter.performQuery(mode, sql, undefined, prepared as Prepared)
  }

  prepared.objects = (args: Args) =>
    prepared.performQuery(ResultMode.objects, args)
  prepared.arrays = (args: Args) =>
    prepared.performQuery(ResultMode.arrays, args)
  prepared.value = (args: Args) => prepared.performQuery(ResultMode.value, args)
  prepared.exec = (args: Args) => prepared.performQuery(ResultMode.skip, args)
  prepared.query = prepared.objects

  return (new Proxy(adapter, {
    get: (target: AdapterBase & Prepared, name: keyof AdapterBase & Prepared) =>
      prepared[name as keyof Prepared] || adapter[name as keyof AdapterBase],
  }) as unknown) as Prepared
}
