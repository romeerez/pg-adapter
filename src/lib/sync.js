exports.sync = (adapter) => {
  const promises = adapter.transactions.map((t) => t.promise)
  if (adapter.task) {
    const task = adapter.task.last
    const {resolve, reject} = task
    let promiseResolve, taskResolved
    const callback = () => {
      if (promiseResolve) promiseResolve()
      else taskResolved = true
    }
    task.resolve = (result) => {
      resolve(result)
      callback()
    }
    let error
    task.reject = (err) => {
      reject(err)
      error = err
      callback()
    }
    promises.push(new Promise((resolve, reject) => {
      promiseResolve = () =>
        error ? reject(error) : resolve()
      if (taskResolved)
        promiseResolve()
    }))
  }
  return Promise.all(promises)
}
