import { Value } from './quote'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { formatQuery } = require('pg-promise/lib/formatting')

export default function interpolate(query: string, args?: Value) {
  if (!args) return query

  return formatQuery(query, args)
}
