const {decodeInt32, skipMessage} = require('../utils')
const {objectsMode, arraysMode, valueMode, skipMode} = require('./parseDescription')

module.exports = {
  parseRow: (socket, data, pos) => {
    const {task, columnsCount, type, names, types} = socket
    let {parseResultMode: mode, result} = task
    if (mode === skipMode)
      return

    const {decodeTypes} = socket.adapter
    let nextMessagePos
    if (mode === valueMode) {
      nextMessagePos = skipMessage(data, pos)
    }

    pos += 7

    let row
    if (mode === objectsMode)
      row = {}
    else if (mode === arraysMode)
      row = new Array(columnsCount)

    for (let c = 0; c < columnsCount; c++) {
      const size = decodeInt32(data, pos)
      pos += 4
      let value
      if (size === -1) {
        value = null
      } else {
        value = data.slice(pos, pos + size)
        const decode = decodeTypes[type || types[c]]
        if (decode)
          value = decode(value)
        else
          value = value.toString()
        pos += size
      }
      if (mode === objectsMode)
        row[names[c]] = value
      else if (mode === arraysMode)
        row[c] = value
      else {
        task.result = value
        pos = nextMessagePos
        task.parseResultMode = skipMode
        return
      }
    }
    result.push(row)
  }
}
