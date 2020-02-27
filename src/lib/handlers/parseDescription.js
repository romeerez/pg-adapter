const {decodeInt32, decodeInt16} = require('../utils')

const objectsMode = 0
const arraysMode = 1
const valueMode = 2
const skipMode = 3

module.exports = {
  objectsMode, arraysMode, valueMode, skipMode,
  parseDescription: (socket, data, pos) => {
    const {task} = socket
    let result, mode = task.parseResultMode
    if (mode === skipMode)
      result = null
    else {
      const columnsCount = decodeInt16(data, pos + 5)
      if (mode === valueMode) {
        const to = data.indexOf('\0', pos + 7)
        socket.type = decodeInt32(data, to + 7)
        result = null
      } else {
        pos += 7
        const names = new Array(columnsCount)
        const types = new Uint32Array(columnsCount)
        for (let c = 0; c < columnsCount; c++) {
          const to = data.indexOf('\0', pos)
          names[c] = String(data.slice(pos, to))
          pos = to + 7
          types[c] = decodeInt32(data, pos)
          pos += 12
        }
        socket.names = names
        socket.types = types
        result = []
      }
      socket.columnsCount = columnsCount
    }
    if (socket.resultNum === 0)
      socket.result = result
    else if (socket.resultNum === 1)
      socket.result = [socket.result, result]
    else
      socket.result[socket.resultNum] = result
    socket.parseResultMode = socket.task.parseResultMode
  }
}
