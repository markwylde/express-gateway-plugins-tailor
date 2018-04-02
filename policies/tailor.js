const Tailor = require('node-tailor')
const axios = require('axios')

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
        res.write = _originalWrite
        res.writeHead = _originalWriteHead

        if (res._headers['location']) {
          res.status(head)
          res.location(res._headers['location'])
          res.end = _originalEnd
          res.end()
        } else {
          const tailor = new Tailor({
            fetchTemplate: async function (request, parseTemplate) {
              res.removeHeader('content-length')
              res.removeHeader('x-gateway-layout')
              res.removeHeader('x-powered-by')
              //const layout = await axios(actionParams.compositionUrl)
              const layout = `
                <html>
                  <head>
                    <script type="slot" name="head"></script>
                  </head>

                  <body>
                    <div class="breadcrumbs">
                      <script type="slot" name="breadcrumbs"></script>
                    </div>

                    <div class="content">
                      <script type="slot" name="body"></script>
                    </div>
                  </body>
                </html>
              `.trim()
              return parseTemplate(layout, buffer)
            }
          })

          tailor.on('error', function (err) {
            console.log(err)
            res.status(head).send(buffer)
          })
          tailor.on('end', function () {
            res.end = _originalEnd
          })

          tailor.requestHandler(req, res)
        }
      }
      next()
    }
  }
}
