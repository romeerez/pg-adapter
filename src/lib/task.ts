import {DecodeFunction, PgError, ResultMode, RequestHandler} from '../types'

type params = {
  mode: ResultMode,
  query: string,
  error: PgError,
  decodeTypes: {[key: string]: DecodeFunction},
  finish: () => any,
}
type createRequestHandlerType = (params: params) => RequestHandler

export const createRequestHandler: createRequestHandlerType = ({
  mode, query, error, decodeTypes, finish
}) => ({
  parseResultMode: mode,
  query,
  error,
  decodeTypes,
  finish,
  parseInfo: {
    resultNumber: 0
  }
})
