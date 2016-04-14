var passport = require('passport')
var Passport = require('passport').Passport
var framework = require('./framework/toa')()

passport.framework(framework)

var ToaPassport = function () {
  Passport.call(this)
  this.framework(framework)
}
require('util').inherits(ToaPassport, Passport)

// Export default singleton.
module.exports = passport

// Expose constructor
module.exports.ToaPassport = ToaPassport
