'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/collection-browser.cjs.prod.js')
} else {
  module.exports = require('./dist/collection-browser.cjs.js')
}
