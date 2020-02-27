const {decodeInt32} = require('../utils')
const {objectsMode, arraysMode, skipMode} = require('./parseDescription')

module.exports = {
  parseRow: (socket, data, pos) => {
    const {
      columnsCount,
      type,
      names,
      types,
      result,
      resultNum,
      parseResultMode: mode
    } = socket
    if (mode === skipMode)
      return

    const {decodeTypes} = socket.adapter

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
        const decode = decodeTypes[type || types[c]]
        if (decode)
          value = decode(data.slice(pos, pos + size))
        else
          value = data.toString('utf8', pos, pos + size)
        pos += size
      }
      if (mode === objectsMode)
        row[names[c]] = value
      else if (mode === arraysMode)
        row[c] = value
      else {
        if (resultNum === 0)
          socket.result = value
        else
          result[resultNum] = value
        socket.parseResultMode = skipMode
        return
      }
    }
    if (resultNum === 0)
      result.push(row)
    else
      result[resultNum].push(row)
  }
}
