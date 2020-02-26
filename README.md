## pg-adapter

(adapter means client for sending *raw* sql to db and parse response)

Why another adapter for Postgresql?
There is already `pg`, it's popular, has community. 

Well, it may seem more convenient and faster in microbenchmark.

## Getting started
```
npm install pg-adapter
yarn add pg-adapter
```
```js
const Adapter = require('pg-adapter')

// All these values are defaults
const db = new Adapter({
  host: '127.0.0.1',
  port: 5432,
  database: 'postgres',
  user: 'current user (process.env.USER) or postgres',
  password: '',
  pool: 10,
  log: true,
})
```

## Querying

Let's assume we got `exapmle` table with `id` and `name` column.

```js
await db.connect() // if you forgot to connect it will connect automatically when making query

const objects = await db.objects('SELECT * FROM example')
objects === [{id: 1, name: 'vasya'}, {id: 2, name: 'petya'}]

const arrays = await db.arrays('SELECT * FROM example')
arrays === [[1, 'vasya'], [2, 'petya']]

const value = await db.value('SELECT count(*) FROM users')
value === 2

const nothing = await db.exec('TRUNCATE TABLE users CASCADE')
nothing === undefined

await db.close() // it will wait till all queries finish
```

## Log

`pg-adapter` has single dependency - chalk -
for nice outputting executed queries to show query time, like this:

```
(1.3ms) SELECT * FROM users
```

But with color. Blue color for completed and red for error query.

Log can be disabled via constructor property `log` from above.

## Errors

When error happens it's stacktrace points to place where you were making this query.
Which is not true for `pg` adapter, so considered as feature.

## Pool

It has very easy to use pool:
just pass parameter how many connections there will be.

```js
const db = new Adapter({pool: 2})

// this will take first connection
db.value('SELECT 1').then(console.log)

// this will take first connection
db.value('SELECT 2').then(console.log)

// this will take first connection
db.value('SELECT 3').then(console.log)
```

## Transactions

First syntax:

```js
const t = db.transaction()

// it got a promise for full transaction
t.promise.then(() => console.log('transaction complete'))

try {
  await t.exec('make several')
  await t.exec('queries')
  await t.commit() // or t.rollback()
} catch (error) {
  console.log('transaction failed')
}
```

Second syntax:

```js
const promise = db.transaction(async t => {
  try {
    await t.exec('make several')
    await t.exec('queries')
  } catch (error) {
    console.log('transaction failed')
  }
  // commit automatically
})
promise.then(() => console.log('transaction complete'))
```

### Sync

`sync` method gives promise of all running tasks will be completed (or failed):

```js
db.exec('some query')
db.exec('another query')
await db.sync() // will wait for both
```
