const {query} = require('./query')
const {skipMode} = require('./handlers/parseDescription')

const close = (transaction) => {
  const transactions = transaction.adapter.transactions
  transactions.splice(transactions.indexOf(transaction), 1)
}

const closedError = () =>
  Promise.reject('transaction is closed')

const finish = async (transaction, command) => {
  transaction.performQuery = closedError

  const promise = query(
    transaction, skipMode, command, new Error(), null, null, null, true
  )

  const resolve = (err) => {
    if (err) transaction.error = err
    if (transaction.error) transaction.reject(transaction.error)
    else transaction.resolve()
  }

  promise.then(resolve, resolve)

  try { await promise } catch (err) {}

  close(transaction)
}

const commit = (transaction) => finish(transaction, 'COMMIT')
const rollback = (transaction) => finish(transaction, 'ROLLBACK')

const performQuery = (transaction, mode, message) => {
  if (transaction.error)
    return Promise.reject(transaction.error)
  return new Promise((resolve, reject) => {
    query(transaction, mode, message, new Error(), resolve, (err) => {
      reject(err)
      if (transaction.error)
        return

      transaction.error = err
      let {task} = transaction
      while (task) {
        task.reject(err)
        task = task.next
      }
      transaction.task = null
      transaction.rollback()
    })
  })
}

exports.transaction = (adapter, parentTransaction, fn) => {
  const transaction = Object.create(parentTransaction)
  transaction.task = null
  transaction.connected = true
  transaction.adapter = adapter
  transaction.parentTransaction = parentTransaction
  transaction.commit = commit.bind(null, transaction)
  transaction.rollback = rollback.bind(null, transaction)
  transaction.performQuery = performQuery.bind(null, transaction)

  adapter.transactions.push(transaction)

  query(parentTransaction, skipMode, 'BEGIN', new Error(), null, null, transaction)

  const promise = new Promise((resolve, reject) => {
    transaction.resolve = resolve
    transaction.reject = reject
  })

  if (fn) {
    return Promise.all([promise, fn(transaction)])
  } else {
    transaction.promise = promise
    return transaction
  }
}
