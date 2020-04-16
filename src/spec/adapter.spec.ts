import {Socket} from 'net'
import {Adapter} from 'adapter'

jest.mock('lib/parseUrl')
jest.mock('lib/connect')

describe('Adapter', () => {
  describe('constructor', () => {
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
      expect(adapter.log).toEqual(false)
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
        expect(a.log).toEqual(true)
      })
    })
  })

  describe('fromUrl', () => {
    it('initialize Adapter using string url', () => {
      expect(Adapter.fromURL()).toBeInstanceOf(Adapter)
      expect(Adapter.fromURL('string')).toBeInstanceOf(Adapter)
      expect(Adapter.fromURL({pool: 1})).toBeInstanceOf(Adapter)
      expect(Adapter.fromURL('string', {pool: 1})).toBeInstanceOf(Adapter)
    })
  })

  describe('connect', () => {
    it('connects sockets', async () => {
      const db = new Adapter({pool: 1})
      const socket = new Socket()
      const {connect} = require('lib/connect')
      connect.mockReturnValueOnce(Promise.resolve(socket))
      await db.connect()
      expect(db.sockets[0]).toEqual(socket)
    })
  })
})
