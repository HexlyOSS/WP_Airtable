const middy = require('middy')
const { httpEventNormalizer, ssm } = require('middy/middlewares')
const { getAirtableOrders, syncOrders } = require('./helpers/airtableHelpers')
const { getSinkSsmName } = require('./integrations')

const { getWooOrdersHandler } = require('./helpers/woo')

const { statusCoder } = require('./middleware/statuscoder')
const { ssmConfig } = require('./middleware/ssm-config')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const ssmOptions = {
  cache: true,
  paths: {},
  names: {
    WOO_C_KEY: 'WOO_C_KEY',
    WOO_C_SECRET: 'WOO_C_SECRET',
    WOO_REST_URL: 'WOO_REST_URL',
    AIRTABLE_API_KEY: 'AIRTABLE_API_KEY',
    AIRTABLE_ENDPOINT: 'AIRTABLE_ENDPOINT',
    AIRTABLE_BASE: 'AIRTABLE_BASE'
  }
}

const env = process.env.NODE_ENV || ''
if (env) {
  ssmOptions.paths.SSM = `/${env}`
}

let ssmMiddleware
if (process.env.SKIP_SSM === 'true') {
  ssmMiddleware = {
    before: (handler, next) => next()
  }
} else {
  ssmMiddleware = ssm(ssmOptions)
}

console.log('Skip SSM?', process.env.SKIP_SSM)

const middyHandler = fn => {
  return middy(fn)
    .use(httpEventNormalizer()) // outter most onion
    .use(statusCoder)
    .use(ssmMiddleware)
    .use(ssmConfig())
}

module.exports = {
  syncOrders: middyHandler(syncOrders),
  getAirtableOrders: middyHandler(getAirtableOrders),
  getWooOrders: middyHandler(getWooOrdersHandler),
  getIntegrations: middyHandler(getSinkSsmName)
}
