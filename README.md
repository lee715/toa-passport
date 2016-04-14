# toa-passport

[Passport](https://github.com/jaredhanson/passport) middleware for Toa

[![NPM][npm]](https://npmjs.org/package/toa-passport)

## Usage

```js
app.use(require('toa-passport').initialize())

// usage of toa-passport is as same as the original passport, except the context of toa will be
// afferented to callback funtion
router.get('/github/login', passport.authenticate('github'))
router.get('/github/callback', passport.authenticate('github', {
  failureRedirect: '/notify'
}, function (err, ctx, user, info) {
}))
```