import {quote} from 'lib/quote'

const process = (parts: string | TemplateStringsArray, args: any[]) => {
  if (typeof parts === 'string')
    return parts

  const result = new Array(parts.length + args.length)
  const last = parts.length - 1
  parts.forEach((part, i) => {
    if (i === 0) part = part.trimLeft()
    if (i === last) part = part.trimRight()
    const arg = args[i]
    result.push(part, arg && quote(args[i]))
  })
  return result.join('')
}

export const sql = (parts: string | TemplateStringsArray, ...args: any[]) => process(parts, args)
export const sql2 = (parts: string | TemplateStringsArray, args?: any[]) =>
  typeof parts === 'string' ? parts : process(parts, args as any[])
