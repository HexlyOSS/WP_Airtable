const middy = require('middy')
const { httpEventNormalizer, ssm } = require('middy/middlewares')
const {
  getAirtableOrders,
  syncOrders
} = require('./helpers/airtableHelpers')

const { getWooOrdersHandler } = require('./helpers/woo')

const { statusCoder } = require('./middleware/statuscoder')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const middyHandler = fn => {
  return middy(fn)
    .use(statusCoder)
    .use(ssm({
      cache: true,
      names: {
        WOO_C_KEY: 'WOO_C_KEY',
        WOO_C_SECRET: 'WOO_C_SECRET',
        WOO_REST_URL: 'WOO_REST_URL',
        AIRTABLE_API_KEY: 'AIRTABLE_API_KEY',
        AIRTABLE_ENDPOINT: 'AIRTABLE_ENDPOINT',
        AIRTABLE_BASE: 'AIRTABLE_BASE'
      }
    }))
    .use(httpEventNormalizer())
}

module.exports = {
  syncOrders: middyHandler(syncOrders),
  getAirtableOrders: middyHandler(getAirtableOrders),
  getWooOrders: middyHandler(getWooOrdersHandler)
}