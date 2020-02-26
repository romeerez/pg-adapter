const {decodeInt32, decodeInt16, skipMessage} = require('../utils')

const objectsMode = 0
const arraysMode = 1
const valueMode = 2
const skipMode = 3

module.exports = {
  objectsMode, arraysMode, valueMode, skipMode,
  parseDescription: (socket, data, pos) => {
    const {task} = socket
    let mode = task.parseResultMode
    if (mode === skipMode) {
      pos = skipMessage(data, pos)
      socket.result = null
    } else {
      const columnsCount = decodeInt16(data, pos + 5)
      if (mode === valueMode) {
        const to = data.indexOf('\0', pos + 7)
        socket.type = decodeInt32(data, to + 7)
        pos = skipMessage(data, pos)
        socket.result = null
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
        task.result = []
      }
      socket.columnsCount = columnsCount
    }
  }
}
