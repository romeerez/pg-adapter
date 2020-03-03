# pg-adapter

Adapter means client for sending *raw* sql to db and parse response, for full-featured ORM see [porm](https://www.npmjs.com/package/porm)

Why another adapter for Postgresql?
There is already `pg`, it's popular, has community. 

Well, this adapter may seem more convenient and faster in microbenchmarks
(faster then pg-native too, for single connection and pool, bench: https://gitlab.com/snippets/1945002).

## Table of Contents
* [Getting started](#getting-started)
* [Making queries](#making-queries)
* [Escape values](#escape-values)
* [Pool](#pool)
* [Log](#log)
* [Errors](#errors)
* [Types](#types)
* [Transactions](#transactions)
* [Prepared statements](#prepared-statements)
* [Sync](#sync)

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

## Making queries

Let's assume we got `example` table with `id` and `name` column.

```js
await db.connect()
// if you forgot to connect it will connect automatically
// when making query

const objects = await db.objects('SELECT * FROM example')
// [{id: 1, name: 'vasya'}, {id: 2, name: 'petya'}]

const sameObjects = await db.query('SELECT * FROM example')
// .query is alias for .objects

const arrays = await db.arrays('SELECT * FROM example')
// [[1, 'vasya'], [2, 'petya']]

const value = await db.value('SELECT count(*) FROM users')
// 2

const nothing = await db.exec('TRUNCATE TABLE users CASCADE')
// ignore result (null)

await db.close() // it will wait till all queries finish
```

## Escape values

Queries can handle escaping by themselves using template strings:

```js
const rawValue = 'may contain sql injection'

// quoted value is safe:
db.query`SELECT * FROM table WHERE a = ${rawValue}`
// spaces on start and end will be trimmed
```

Better to use `sql` function, then the editor can highlight syntax:

```js
const {sql} = require('pg-adapter')

const value = 'value'
const safeSql = sql`SELECT * FROM table WHERE a = ${value}`
db.sql`template ${'string'}` // adapter instance includes it
```

For escaping single value there is `quote`:

```js
const {quote} = require('pg-adapter')

const value = 'value'
const safeSqlValue = quote(value)
const dbHasIt = db.quote(value)
```

You can send multiple queries and receive array of results.
In general, I don't recommend it, but if you have small pool size and many clients
it can be efficient.

```js
const [a, b, c] = await db.value('SELECT 1; SELECT 2; SELECT 3')
// a = 1, b = 2, c = 3
```

## Pool

It has very easy to use pool:
just pass parameter how many connections there will be.

```js
const db = new Adapter({pool: 2})

// this will take first connection
db.value('SELECT 1').then(console.log)

// this will take second connection
db.value('SELECT 2').then(console.log)

// this will wait for any free connection
db.value('SELECT 3').then(console.log)
```

Connection pool is hidden under the hood,
this means it's very easy to make many queries efficiently:

```js
const db = new Adapter({pool: 3})
const [donuts, muffins, chebureks] = await Promise.all([
  db.objects('SELECT * FROM donuts'),
  db.objects('SELECT * FROM muffins'),
  db.objects('SELECT * FROM chebureks'),
])
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

## Types

By default numbers, booleans and dates are parsing from response.
To add json parsing, for example:

```sql
SELECT typname, oid, typarray FROM pg_type ORDER BY oid
```

This will give info for all types in database, get needed `oid`.

```js
const db = new Adapter(params)
Object.assign(db.decodeTypes, {
  114: JSON.parse, // for json
  3802: JSON.parse, // for jsonb
})
```

Null from db won't get to parser.

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
  // try-catch is done in transaction function
  await t.exec('make several')
  await t.exec('queries')
  console.log('transaction failed')
  // commit automatically
})
promise.then(() => console.log('transaction complete'))
```

## Prepared statements

Prepared statement is query which get parsed and planned just once and then can be called many times.

Such query is bit faster.

```js
const usersQuery = db.prepare('usersQuery', 'text', 'integer', 'date')
  `SELECT * FROM users WHERE name = $1 AND age = $2 AND last_activity >= $3`
```

First argument is query name which must be unique, then query parameter types.
SQL is passed outside of `()` i.e db.prepare(name, ...args)`sql query`,
yes it looks strange, but that's how JS template strings works.

So, query can have interpolated args `${someValue}` which gets escaped.

```js
const name = 'David'
const age = 74
const users = await usersQuery.query`${name}, ${age}, now() - interval '1 year'`
```

Here again template string is used so two values escapes and last parameter is SQL statement.

```js
usersQuery.query(1, 2, "now() - interval '1 year'")
```

This is the same query, also works, just do not pass dangerous parameters that came from users.

## Sync

`sync` method gives promise of all running tasks will be completed (or failed):

```js
db.exec('some query')
db.exec('another query')
await db.sync() // will wait for both
```
