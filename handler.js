const middy = require('middy')
const { httpEventNormalizer } = require('middy/middlewares')
require('dotenv').config()
const {
  getAirtableOrders,
  syncOrders
} = require('./helpers/airtableHelpers')

const { wooGetOrderHandler } = require('./helpers/woo')

const { statusCoder } = require('./middleware/statuscoder')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const middyHandler = fn => {
  return middy(fn)
    .use(httpEventNormalizer())
    .use(statusCoder)
}

module.exports = {
  syncOrders: middyHandler(syncOrders),
  getAirtableOrders: middyHandler(getAirtableOrders),
  wooGetOrder: middyHandler(wooGetOrderHandler)
}