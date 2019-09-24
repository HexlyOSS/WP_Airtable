const middy = require('middy')
const { httpEventNormalizer } = require('middy/middlewares')
const axios = require('axios').default
require('dotenv').config()
const {
  AirtableCreateRecord,
  AirtableGetRecord,
  AirtableUpdateRecord
} = require('./airtable')

const port = 3004
const {
  WOO_C_KEY,
  WOO_C_SECRET,
  WOO_REST_URL
} = process.env
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

async function wooGetOrder(orderId) {
  return await axios.get(WOO_REST_URL + `/orders${ orderId ? `/${orderId}` : null }`, {
        auth: {
          username: WOO_C_KEY,
          password: WOO_C_SECRET
        }
      })
} 

async function syncOrdersHandler(event) {
  try {
      let airtablePostResult
      let airtableId
      let airtableNumberOfMatches = 0
      const { pathParameters: { orderId } } = event
      
      // if(!orderId) { throw new Error('Order Id required') }

      const { data: {
        id,
        billing,
        metadata, 
        line_items,
        status,
        date_created,
        total,
        currency
      } } = await wooGetOrder(orderId)
      const { first_name, last_name, email } = billing
      const name = `${first_name} ${last_name}`

      const AirtableGetRecordRes = await AirtableGetRecord('Orders')

      if(typeof AirtableGetRecordRes === 'object') {
        AirtableGetRecordRes.forEach(record => {
          const { fields: { wooOrderId }, id } = record
          if(wooOrderId == orderId) {
            airtableId = id
            airtableNumberOfMatches ++
            airtablePostResult = record
          }
        })
      }
      
      const obj = {
        wooOrderId: id,
        name,
        meta_data: metadata,
        line_items: JSON.stringify(line_items),
        email,
        status,
        date_created,
        total,
        currency
      }

      if(airtableNumberOfMatches === 0) {
        airtablePostResult = await AirtableCreateRecord(
          'Orders',
          obj
        )
      } else if(airtableNumberOfMatches === 1){
        airtablePostResult = await AirtableUpdateRecord(
          'Orders',
          obj,
          airtableId
        )
      } else {
        throw new Error('More than one record found!')
      }

      return airtablePostResult
  } catch (error) {
    const { message } = error
    console.error(error)
    return message
  }
}

const syncOrders = async (event, context, callback) => {
  const res = await syncOrdersHandler(event)
  console.log({res})

  return res
}

const main = async event => {
  console.log({event})
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
}

const getAirtableOrders = async event => {
  const { pathParameters: { orderId } } = event
  const res = await AirtableGetRecord('Orders', undefined, orderId)
  return res
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
}

const statusCoder = {
  after: (handler, next) => {
    const { response: {statusCode} } = handler
    if( handler.response && typeof(handler.response) === 'object'){
      handler.response = {
        statusCode: statusCode ? statusCode : 200,
        body: JSON.stringify(handler.response, null, 2)
      }
    } else {
      console.log({handler, msg: 'something\'s fishy'})
    }
    next()
  }
}

const middyHandler = fn => {
  return middy(fn)
    .use(httpEventNormalizer())
    .use(statusCoder)
}

module.exports = {
  main: middyHandler(main),
  syncOrders: middyHandler(syncOrders),
  getAirtableOrders: middyHandler(getAirtableOrders)
}