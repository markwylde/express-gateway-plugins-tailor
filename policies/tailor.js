module.exports = {
  name: 'tailor',
  schema: {
    $id: 'http://express-gateway.io/schemas/policies/example-policy.json',
    type: 'object',
    properties: {
      compositionUrl: {
        type: 'string',
        default: 'http://example.com'
      }
    }
  },
  policy: (actionParams) => {
    return (req, res, next) => {
      const _originalWriteHead = res.writeHead
      const _originalWrite = res.write
      const _originalEnd = res.end

      let buffer = ''
      let head
      res.write = function (data) {
        buffer += data
      }
      res.writeHead = function (data) {
        head = data
      }
      res.end = function (data) {
        buffer = 'INJECTED' + buffer

        res.removeHeader('content-length')
        res.removeHeader('x-gateway-layout')
        res.removeHeader('x-powered-by')

        _originalWriteHead.call(res, head)
        _originalWrite.call(res, buffer)
        _originalEnd.call(res)
      }
      next()
    }
  }
}
