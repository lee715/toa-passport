var keys = [
  // passport
  '_passport',
  'user',
  'account',
  'login',
  'logIn',
  'logout',
  'logOut',
  'isAuthenticated',
  'isUnauthenticated',
  'authInfo',

  // http.IncomingMessage
  'httpVersion',
  'headers',
  'trailers',
  'setTimeout',
  'method',
  'url',
  'statusCode',
  'socket',
  'connection',

  // Koa's context
  'cookies',
  'throw',

  // Others. Are not supported directly - require proper plugins/middlewares.
  'param',
  'route',
  'xhr',
  'baseUrl',
  'session',
  'body',
  'flash'
]

// remove duplicates
keys = keys.filter(function (key, i, self) {
  return self.indexOf(key) === i
})

// create a delegate for each key
var properties = module.exports = {}

keys.forEach(function (key) {
  properties[key] = {
    get: function () {
      var obj = getObject(this.ctx, key)
      if (!obj) return undefined

      // if its a function, call with the proper context
      if (typeof obj[key] === 'function') {
        return function () {
          return obj[key].apply(obj, arguments)
        }
      }

      // otherwise, simply return it
      return obj[key]
    },
    set: function (value) {
      var obj = getObject(this.ctx, key) || this.ctx.passport
      obj[key] = value
    }
  }
})

// test where the key is available, either in `ctx.passport`, Node's request,
// Koa's request or Koa's context
function getObject (ctx, key) {
  if (ctx.passport && (key in ctx.passport)) {
    return ctx.passport
  }

  if (key in ctx.request) {
    return ctx.request
  }

  if (key in ctx.req) {
    return ctx.req
  }

  if (key in ctx) {
    return ctx
  }

  return undefined
}
