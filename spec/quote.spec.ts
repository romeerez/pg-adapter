import {quote} from '../src/adapter'

const date = new Date()
date.setUTCFullYear(2020)
date.setUTCMonth(0)
date.setUTCDate(1)
date.setUTCHours(2)
date.setUTCMinutes(3)
date.setUTCSeconds(4)
date.setUTCMilliseconds(567)

describe('quote', () => {
  it('can quote number', () => {
    expect(quote(123)).toBe('123')
  })

  it('can quote string', () => {
    expect(quote('string')).toBe(`'string'`)
  })

  it('can quote boolean', () => {
    expect(quote(true)).toBe(`true`)
    expect(quote(false)).toBe(`false`)
  })

  it('can quote null and undefined', () => {
    expect(quote(null)).toBe(`NULL`)
    expect(quote(undefined)).toBe(`NULL`)
  })

  it('can quote date', () => {
    expect(quote(date)).toBe(`'2020-01-01T02:03:04.567Z'`)
  })

  it('can stringify JSON', () => {
    expect(quote({key: `val"ue`})).toBe(`'{"key":"val\\"ue"}'`)
  })

  it('can quote array', () => {
    expect(quote([1, 'string', true, date, {key: `val'"ue`}])).toBe(
      `'{1,"string",true,"2020-01-01T02:03:04.567Z","{\\"key\\":\\"val''\\\\"ue\\"}"}'`
    )
  })
})
