# pg-adapter

Adapter means client for sending *raw* sql to db and parse response, for full-featured ORM see [porm](https://www.npmjs.com/package/porm)

Why another adapter for Postgresql?
There is already `pg`, it's popular, has community. 

Well, this adapter may seem more convenient and faster in microbenchmarks
Microbenchmark vs `pg` vs `pg-native`: https://gist.github.com/romeerez/b3e45d9afffefe0f286046223dabb7e1

It's written on Typescript so examples are also on it.

## Table of Contents
* [Getting started](#getting-started)
* [Making queries](#making-queries)
* [Query variables](#query-variables)
* [Pool](#pool)
* [Log](#log)
* [Errors](#errors)
* [Types](#database-types)
* [Transactions](#transactions)
* [Prepared statements](#prepared-statements)
* [Sync](#sync)

## Getting started
```
npm install pg-adapter
yarn add pg-adapter
```

```typescript
import { Adapter } from 'pg-adapter'

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

Initializing from database url (Heroku compatible):

```js
const db = Adapter.fromURL(
  'postgres://user:password@host:port/database',
  { pool: 5, log: false } // second argument for options
)
```

If no url provided it will try `DATABASE_URL` env variable:

```js
const db = Adapter.fromURL()

// you can provide options
const db = Adapter.fromURL({pool: 8})
```

Url parsing function is available by importing:

```js
import { parseURL } from 'pg-adapter'

const config = parseURL('postgres://user:password@localhost:5432/db-name')

config === {
  host: 'localhost',
  port: 5432,
  database: 'db-name',
  user: 'user',
  password: 'password'
}
```

## Making queries

Let's assume we got `example` table with `id` and `name` column.

```js
await db.connect()
// if you forgot to connect it will connect automatically
// when making query

let objects = await db.objects('SELECT * FROM example')
// [{id: 1, name: 'vasya'}, {id: 2, name: 'petya'}]

let sameObjects = await db.query('SELECT * FROM example')
// .query is alias for .objects

const arrays = await db.arrays('SELECT * FROM example')
// [[1, 'vasya'], [2, 'petya']]

const value = await db.value('SELECT count(*) FROM users')
// 2

const nothing = await db.exec('TRUNCATE TABLE users CASCADE')
// ignore result (null)

await db.close() // it will wait till all queries finish
```

By default result has `any` type, but you can provide the type:
```ts
type ObjectType = {
  id: number
  name: string
}

const objects = await db.query<ObjectType>('SELECT * FROM example')
console.log(object.id, object.name)
```

For simplicity these methods above gives you only the result, in case if you need to get columns info there are methods `withFields`:

```js
const { fields, result } = await db.objectsWithFields('SELECT * FROM example')
const { fields, result } = await db.arraysWithFields('SELECT * FROM example')
const { fields, result } = await db.valueWithFields('SELECT * FROM example')
```

`fields` is an array of `FieldInfo`:
```ts
type FieldInfo = {
  name: string
  tableID: number
  columnID: number
  dataTypeID: number
  dataTypeSize: number // -1 for variable length
  dataTypeModifier: number // see pg_attribute.atttypmod
  format: number // 0 for text, 1 for binary
}
```

You can send multiple queries and receive array of results.
In general, I don't recommend it, but if you have small pool size and many clients
it can be efficient.

```js
const [a, b, c] = await db.value('SELECT 1; SELECT 2; SELECT 3')
// a = 1, b = 2, c = 3
```

You can specify types for ts compiler to know:

```typescript
const [a, b, c] = await db.value<[number, number, number]>('SELECT 1; SELECT 2; SELECT 3')
```

If Promise passed instead of string it will wait for it automatically:

```typescript
const result = await db.query(Promise.resolve('SELECT 1'))
```

## Query variables

[pg-promise](https://github.com/vitaly-t/pg-promise) library is included.

Second parameter of `query` and of other methods is handled by pg-promise:

```typescript
await db.query('SELECT * FROM table WHERE a = $1 AND b = $2', [1, 2])
```

To insert multiple values at once you can use pg-promise and pg-adapter in such way:
```typescript
import pgPromise from 'pg-promise'

const pgp = pgPromise({
  capSQL: true,
})

await db.query(
  pgp.helpers.insert(
    [{ name: 'first' }, { name: 'second' }],
    ['name'],
    'my-table',
  )
)
// INSERT INTO "my-table"("name") VALUES('first'),('second')
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

## Database types

By default only numbers, booleans and dates are parsed from database response.
If you want to parse some specific type, for example, json type, run this sql:

```sql
SELECT typname, oid, typarray FROM pg_type ORDER BY oid
```

This will give info for all types in database, get needed `oid`, write a parser function and add it to `decodeTypes`:

```js
const db = new Adapter(params)

const jsonFromBuffer = (buffer: Buffer, pos: number, size: number) => {
  return JSON.parse(buffer.slice(pos, pos + size).toString())
}

Object.assign(db.decodeTypes, {
  114: jsonFromBuffer, // for json
  3802: jsonFromBuffer, // for jsonb
})
```

Null from db won't get to parser.

## Transactions

`db.transaction` wraps your function with try-catch, and waits till all queries in function will finish, even non-awaited queries.
When all queries in transaction completes it will send commit query.
When error happens it will send rollback query.
You can use `t.commit()` and `t.rollback()` in transaction, then it won't do that automatically.

```js
// This transaction will wait for both queries and commit
await db.transaction(async t => {
  await t.exec('you can use await')
  t.exec('or just queries')
})

await db.transaction(async t => {
  await t.exec('do something')
  await t.commit()
  console.log('transaction was committed')
})

await db.transaction(async t => {
  await t.exec('do something')
  await t.rollback()
  console.log('transaction was rolled back')
})
```

## Prepared statements

Prepared statement is query which get parsed and planned just once **per connection** and then can be called many times.

Such query is bit faster.

```js
// provide array of TS types
const usersQuery = db.prepare<[string, number, Date]>({
  // name of query, must be unique
  name: 'usersQuery',
  // SQL types of arguments
  args: ['text', 'integer', 'date'],
  // query with positional arguments
  query: 'SELECT * FROM users WHERE name = $1 AND age = $2 AND last_activity >= $3'
})

const name = 'David'
const age = 74
// can be used with Date value
const users = await usersQuery.query(name, age, new Date())

// you can send SQL argument with db.raw
const users = await usersQuery.query(name, age, db.raw("now() - interval '1 year'"))
```

## Sync

`sync` method gives promise of all running tasks will be completed (or failed):

```js
db.exec('some query')
db.exec('another query')
await db.sync() // will wait for both
```
