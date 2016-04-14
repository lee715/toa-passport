var _initialize = require('passport/lib/middleware/initialize')
var _authenticate = require('passport/lib/middleware/authenticate')

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
 * @param {GeneratorFunction} callback
 * @return {GeneratorFunction}
 * @api private
 */
function authenticate (passport, name, options, callback) {
  // normalize arguments
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  options = options || {}

  if (callback && callback.constructor.name !== 'GeneratorFunction') {
    throw TypeError('Your custom authentication callback must be a Generator Function')
  }

  return function * passportAuthenticate () {
    var ctx = this
    var _callback = callback
    callback = function (err, user, info) {
      try {
        _callback(err, ctx, user, info)
        callback.done(null)
      } catch (e) {
        callback.done(e)
      }
    }
    var middleware = _authenticate(passport, name, options, callback)
    // this functions wraps the connect middleware
    // to catch `next`, `res.redirect` and `res.end` calls
    yield function (done) {
      // mock the `req` object
      var req = createReqMock(ctx)
      req.session = ctx.session
      // mock the `res` object
      var res = {
        redirect: function (url) {
          ctx.redirect(url)
          done(null, false)
        },
        setHeader: ctx.set.bind(ctx),
        end: function (content) {
          if (content) ctx.body = content
          done(null, false)
        },
        set statusCode(status) {
          ctx.status = status
        },
        get statusCode() {
          return ctx.status
        }
      }

      if (callback) {
        callback.done = done
      }

      // call the connect middleware
      middleware(req, res, done)
    }
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
var properties = require('./request')
function createReqMock (ctx) {
  var req = Object.create(ctx.request, properties)
  return req
}
