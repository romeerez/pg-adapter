const {Adapter} = require('../src/adapter')

const newDb = () =>
  new Adapter({
    host: '127.0.0.1',
    port: 5432,
    database: 'pgtest',
    user: 'pgtest',
    password: 'test',
    pool: 1,
  })

// SQL to create test role:
//   set password_encryption = 'scram-sha-256';
// create role npgtest login password 'test';
// pg_hba:
// host    all             npgtest             ::1/128            scram-sha-256
// host    all             npgtest             0.0.0.0/0            scram-sha-256
test('connect', async () => {
  const db = newDb()
  const promise = db.connect()
  expect(db.connected).toBe(true)
  await promise
  expect(db.sockets[0].connected)
  console.log((await db.query`SELECT * FROM users WHERE ${true}`).length)
  await db.close()
})
