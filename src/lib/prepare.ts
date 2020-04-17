import {AdapterBase} from './adapterBase'
import {ResultMode, Prepared} from '../types'
import {sql2} from './sql'
import {quote} from './quote'

export const prepare = (adapter: AdapterBase, name: string, ...args: any[]) => {
  return (prepareTemplate: TemplateStringsArray, prepareArgs?: any[]) => {
    const arr = ['PREPARE ', name]
    if (args.length)
      arr.push(`(${args.join(', ')})`)
    arr.push(' AS ')

    const last = prepareTemplate.length - 1
    prepareTemplate.forEach((part, i) => {
      if (i === 0) part = part.trimLeft()
      if (i === last) part = part.trimRight()
      arr.push(part, prepareArgs && prepareArgs[i])
    })

    const prepared = Object.create(adapter) as Prepared
    prepared.sql = arr.join('')
    prepared.name = name
    prepared.performQuery = (mode: ResultMode, args: any[]) => {
      let sql = `EXECUTE ${name}`
      if (args && args.length) {
        const parts = args[0]
        if (parts.raw)
          sql += `(${sql2(parts, args.slice(1))})`
        else
          sql += `(${args.map(quote).join(', ')})`
      }
      return adapter.performQuery(mode, sql, undefined, prepared)
    }

    prepared.objects = (...args: any[]) => prepared.performQuery(ResultMode.objects, args)
    prepared.arrays = (...args: any[]) => prepared.performQuery(ResultMode.arrays, args)
    prepared.value = (...args: any[]) => prepared.performQuery(ResultMode.value, args)
    prepared.exec = (...args: any[]) => prepared.performQuery(ResultMode.skip, args)
    prepared.query = prepared.objects

    return new Proxy(adapter, {
      get: (target, name) => (prepared as any)[name] || (adapter as any)[name]
    }) as unknown as Prepared
  }
}
