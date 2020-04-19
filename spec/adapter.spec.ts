import {Adapter, Transaction} from '../src/adapter'
import {ResultMode} from '../src/types'
import {defaultLog, noopLog} from '../src/lib/log'

Adapter.defaultLog = false

describe('Adapter', () => {
  describe('constructor', () => {
    beforeAll(() => {
      Adapter.defaultLog = true
    })
    afterAll(() => {
      Adapter.defaultLog = false
    })

    it('accepts connection settings, pool and log', () => {
      const connectionSettings = {
        host: 'host',
        port: 1234,
        database: 'dbname',
        user: 'user',
        password: 'password',
      }
      const adapter = new Adapter({ ...connectionSettings, pool: 123, log: false })
      expect(adapter.connectionSettings).toMatchObject(connectionSettings)
      expect(adapter.pool).toEqual(123)
      expect(adapter.log).toEqual(noopLog)
    })

    it('has default values', () => {
      const a1 = new Adapter({})
      const a2 = new Adapter();
      [a1, a2].forEach(a => {
        expect(a.connectionSettings).toMatchObject({
          host: '127.0.0.1',
          port: 5432,
          database: 'postgres',
          user: process.env.USER || 'postgres',
          password: '',
        })
        expect(a.pool).toEqual(10)
        expect(a.log).toEqual(defaultLog)
      })
    })
  })

  describe('fromURL', () => {
    let envDbUrl: string | undefined
    beforeAll(() => {
      envDbUrl = process.env.DATABASE_URL
    })
    afterAll(() => {
      process.env.DATABASE_URL = envDbUrl
    })

    it('initialize Adapter using string url', () => {
      process.env.DATABASE_URL = undefined
      expect(() => Adapter.fromURL()).toThrow()

      const config = {
        user: 'user',
        password: 'password',
        host: 'host.com',
        port: 1234,
        database: 'database',
      }
      const url = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`

      process.env.DATABASE_URL = url
      expect(Adapter.fromURL().connectionSettings).toMatchObject(config)

      process.env.DATABASE_URL = undefined
      expect(Adapter.fromURL(url).connectionSettings).toMatchObject(config)
    })
  })

  describe('connect', () => {
    it('connects sockets', async () => {
      // for change with ssl mode on/off edit /usr/local/var/postgres/postgresql.conf
      // instead of creating own certificate you can test it over heroku database

      // to check scram-sha-256 need to set password_encryption = 'scram-sha-256' in postgresql.conf
      // and scram-sha-256 in pg_hba.conf

      expect(async () => {
        const db = Adapter.fromURL({pool: 1})
        await db.connect()
        await db.close()
      }).not.toThrow()
    })
  })

  describe('performQuery', () => {
    it('works after connect', async () => {
      const db = Adapter.fromURL({pool: 1})
      await db.connect()
      const result = await db.performQuery(ResultMode.value, 'SELECT 1')
      expect(result).toEqual(1)
      await db.close()
    })

    it('connects automatically', async () => {
      const db = Adapter.fromURL({pool: 1})
      const result = await db.performQuery(ResultMode.value, 'SELECT 1')
      expect(result).toEqual(1)
      await db.close()
    })

    it('can perform multiple queries in queue', async () => {
      const db = Adapter.fromURL({pool: 1})
      const results = await Promise.all([
        db.performQuery(ResultMode.value, 'SELECT 1'),
        db.performQuery(ResultMode.value, 'SELECT 2'),
        db.performQuery(ResultMode.value, 'SELECT 3'),
        db.performQuery(ResultMode.value, 'SELECT 4'),
        db.performQuery(ResultMode.value, 'SELECT 5'),
      ])
      expect(results).toEqual([1, 2, 3, 4, 5])
      await db.close()
    })

    it('can load wide table data', async () => {
      const date = Date.UTC(2020, 0, 1)
      let values = [
        // {sql: 'null', value: null},
        // {sql: '1', value: 1},
        // {sql: '2', value: 2},
        // {sql: '3', value: 3},
        // {sql: '1.5', value: 1.5},
        // {sql: '2.5', value: 2.5},
        // {sql: '3.5', value: 3.5},
        // {sql: 'false', value: false},
        {sql: 'true', value: true},
        // {sql: "'01.01.2020'::date", value: +date},
      ]
      // for (let i = 0; i < 5; i++)
      //   values = [...values, ...values]

      const db = Adapter.fromURL({pool: 1})
      const rows = await db.performQuery(
        ResultMode.arrays, `SELECT ${values.map(value => value.sql)}`
      ) as any[][]
      const row = rows[0]
      row.forEach((item, i) => {
        if (item?.constructor === Date)
          row[i] = +row[i]
      })
      expect(row).toEqual(values.map(value => value.value))
      await db.close()
    })

    it('can load many rows', async () => {
      const db = Adapter.fromURL({pool: 1})
      const values: any[] = []

      const lorem =
        "'Lorem ipsum dolor sit amet,consectetur adipiscing elit," +
        "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." +
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." +
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur." +
        "Excepteur sint occaecat cupidatat non proident," +
        "sunt in culpa qui officia deserunt mollit anim id est laborum.'"

      for (let i = 0; i < 1000; i++) {
        values.push([i + 1, lorem])
      }
      const results = await db.performQuery(
        ResultMode.arrays, `SELECT * FROM (VALUES ${
          values.map(values => `(${values.join(', ')})`).join(', ')
        }) t`
      ) as any[]
      expect(results.length).toEqual(values.length)
      await db.close()
    })

    it('can load multiple results', async () => {
      const db = Adapter.fromURL({pool: 1, log: false})
      const results = await db.value('SELECT 1; SELECT 2')
      expect(results).toEqual([1, 2])
      await db.close()
    })
  })

  describe('objects', () => {
    it('return objects', async () => {
      const db = Adapter.fromURL({pool: 1})
      const one = await db.objects('SELECT 1 as one')
      expect(one).toEqual([{one: 1}])
      const two = await db.objects`SELECT ${'string'} as one`
      expect(two).toEqual([{one: 'string'}])
      await db.close()
    })
  })

  describe('arrays', () => {
    it('return arrays', async () => {
      const db = Adapter.fromURL({pool: 1})
      const one = await db.arrays('SELECT 1 as one')
      expect(one).toEqual([[1]])
      const two = await db.arrays`SELECT ${'string'} as one`
      expect(two).toEqual([['string']])
      await db.close()
    })
  })

  describe('value', () => {
    it('return value', async () => {
      const db = Adapter.fromURL({pool: 1})
      const one = await db.value('SELECT 1 as one')
      expect(one).toEqual(1)
      const two = await db.value`SELECT ${'string'} as one`
      expect(two).toEqual('string')
      await db.close()
    })
  })

  describe('exec', () => {
    it('return nothing', async () => {
      const db = Adapter.fromURL({pool: 1})
      const one = await db.exec('SELECT 1 as one')
      expect(one).toEqual(undefined)
      const two = await db.exec`SELECT ${'string'} as one`
      expect(two).toEqual(undefined)
      await db.close()
    })
  })

  describe('transaction', () => {
    it('creates a transaction', async () => {
      const queries: string[] = []
      const db = Adapter.fromURL({pool: 1, log: {
        start: () => {},
        finish: (socket, {query}) => { queries.push(query) },
      }})
      const t = db.transaction()
      db.exec('SELECT 1')
      t.exec('SELECT 2')
      t.commit()
      await db.sync()
      expect(queries).toEqual(['BEGIN', 'SELECT 2', 'COMMIT', 'SELECT 1'])

      queries.length = 0
      db.transaction((t: Transaction) => {
        t.exec('SELECT 2')
      })
      db.exec('SELECT 1')
      await db.sync()

      const target = {key: 'value'}
      let value
      const wrapped = db.wrapperTransaction(target, (t) => {
        value = t.key
        t.exec('SELECT 1')
      })
      expect(value).toEqual(target.key)
      expect(wrapped.key).toEqual(target.key)
      await db.close()
    })
  })

  describe('prepared', () => {
    it('makes prepared statements', async () => {
      const db = Adapter.fromURL({pool: 1})
      const q = db.prepare('queryName', 'text', 'integer', 'date')
        `SELECT $1 AS text, $2 AS integer, $3 AS date`
      const result = await q.performQuery(0, ['text', 123, '01.01.2020'])
      const date = Date.UTC(2020, 0, 1)
      expect(result).toEqual([{text: 'text', integer: 123, date: new Date(date)}])
      await db.close()
    })
  })
})
