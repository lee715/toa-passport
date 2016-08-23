var _initialize = require('passport/lib/middleware/initialize')
var _authenticate = require('passport/lib/middleware/authenticate')
var properties = require('./request')
// var thunk = require('thunks')()

/**
 * Passport's initialization middleware for Koa.
 *
 * @return {GeneratorFunction}
 * @api private
 */
function initialize (passport) {
  var middleware = _initialize(passport)
  return function * passportInitialize () {
    var ctx = this

    this.passport = {}
    var userProperty = passport._userProperty || 'user'
    // check ctx.req has the userProperty
    if (!ctx.req.hasOwnProperty(userProperty)) {
      Object.defineProperty(ctx.req, userProperty, {
        enumerable: true,
        get: function () {
          return ctx.passport[userProperty]
        },
        set: function (val) {
          ctx.passport[userProperty] = val
        }
      })
    }

    var req = createReqMock(ctx)

    // add aliases for passport's request extensions to Koa's context
    var login = ctx.req.login
    var logout = ctx.req.logout

    ctx.login = ctx.logIn = function (user, options) {
      return login.bind(req, user, options)
    }
    ctx.req.login = ctx.req.logIn = login.bind(req)
    ctx.logout = ctx.logOut = ctx.req.logout = ctx.req.logOut = logout.bind(req)
    ctx.isAuthenticated = ctx.req.isAuthenticated = ctx.req.isAuthenticated.bind(req)
    ctx.isUnauthenticated = ctx.req.isUnauthenticated = ctx.req.isUnauthenticated.bind(req)

    yield middleware.bind(middleware, req, ctx)
  }
}

/**
 * Passport's authenticate middleware for Koa.
 *
 * @param {String|Array} name
 * @param {Object} options
 * @param {Function} callback(err, user, info, status, isDone)
 * @return {Function}
 * @api private
 */
function authenticate (passport, name, options) {
  return function (callback) {
    var called = false
    var _callback = function () {
      if (called) return false
      called = true
      return callback.apply(null, arguments)
    }
    var ctx = this
    var middleware = _authenticate(passport, name, options, _callback)

    // mock the `req` object
    var req = createReqMock(ctx)
    req.session = ctx.session

    // mock the `res` object
    var res = {
      redirect: function (url) {
        ctx.redirect(url)
        _callback()
      },
      setHeader: ctx.set.bind(ctx),
      end: function (content) {
        if (content) ctx.body = content
        _callback()
      },
      set statusCode (status) {
        ctx.status = status
      },
      get statusCode () {
        return ctx.status
      }
    }

    middleware(req, res, _callback)
  }
}

/**
 * Passport's authorize middleware for Koa.
 *
 * @param {String|Array} name
 * @param {Object} options
 * @param {GeneratorFunction} callback
 * @return {GeneratorFunction}
 * @api private
 */
function authorize (passport, name, options, callback) {
  options = options || {}
  options.assignProperty = 'account'

  return authenticate(passport, name, options, callback)
}

/**
 * Framework support for Koa.
 *
 * This module provides support for using Passport with Koa. It exposes
 * middleware that conform to the `fn*(next)` signature and extends
 * Node's built-in HTTP request object with useful authentication-related
 * functions.
 *
 * @return {Object}
 * @api protected
 */
module.exports = function () {
  return {
    initialize: initialize,
    authenticate: authenticate,
    authorize: authorize
  }
}

// create request mock
function createReqMock (ctx) {
  var req = Object.create(ctx.request, properties)
  return req
}
