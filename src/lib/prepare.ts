import { AdapterBase } from './adapterBase'
import { ResultMode, Prepared } from '../types'
import { sql2 } from './sql'
import { Value, quote } from './quote'

export const prepare = (
  adapter: AdapterBase,
  name: string,
  ...args: unknown[]
) => {
  return (
    prepareTemplate: TemplateStringsArray,
    prepareArgs?: (number | string)[],
  ) => {
    const arr: (number | string)[] = ['PREPARE ', name]
    if (args.length) arr.push(`(${args.join(', ')})`)
    arr.push(' AS ')

    const last = prepareTemplate.length - 1
    prepareTemplate.forEach((part, i) => {
      if (i === 0) part = part.trimLeft()
      if (i === last) part = part.trimRight()
      arr.push(part)
      if (prepareArgs) arr.push(prepareArgs[i])
    })

    const prepared = Object.create(adapter) as Prepared
    prepared.sql = arr.join('')
    prepared.name = name
    prepared.performQuery = (
      mode: ResultMode,
      args: TemplateStringsArray | Value[],
    ) => {
      let sql = `EXECUTE ${name}`
      if (args && args.length) {
        const parts = args[0]
        if (((parts as unknown) as TemplateStringsArray).raw)
          sql += `(${sql2(
            (parts as unknown) as TemplateStringsArray,
            args.slice(1),
          )})`
        else sql += `(${(args as Value[]).map(quote).join(', ')})`
      }
      return adapter.performQuery(mode, sql, undefined, prepared)
    }

    prepared.objects = (...args: TemplateStringsArray | Value[]) =>
      prepared.performQuery(ResultMode.objects, args)
    prepared.arrays = (...args: TemplateStringsArray | Value[]) =>
      prepared.performQuery(ResultMode.arrays, args)
    prepared.value = (...args: TemplateStringsArray | Value[]) =>
      prepared.performQuery(ResultMode.value, args)
    prepared.exec = (...args: TemplateStringsArray | Value[]) =>
      prepared.performQuery(ResultMode.skip, args)
    prepared.query = prepared.objects

    return (new Proxy(adapter, {
      get: (
        target: AdapterBase & Prepared,
        name: keyof AdapterBase & Prepared,
      ) =>
        prepared[name as keyof Prepared] || adapter[name as keyof AdapterBase],
    }) as unknown) as Prepared
  }
}
