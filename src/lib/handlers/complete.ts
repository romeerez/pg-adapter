import {Task} from '../../types'

export const complete = ({parseInfo}: Task) => {
  parseInfo.resultNumber++
  parseInfo.skipNextValues = false
}
