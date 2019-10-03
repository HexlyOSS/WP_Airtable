const axios = require('axios').default

async function getWooOrders(orderId) {
  const { SSM_WOO_C_KEY, SSM_WOO_C_SECRET, SSM_WOO_REST_URL } = process.env
  try {
    const url =
      SSM_WOO_REST_URL +
      '/orders' +
      (orderId ? `/${orderId}` : '') +
      '?per_page=100'
    const res = await axios.get(url, {
      auth: {
        username: SSM_WOO_C_KEY,
        password: SSM_WOO_C_SECRET
      }
    })
    const { data } = res

    return res
  } catch (error) {
    // console.error('Failed hitting Woo', error)
    const e = new Error('Failed to connect to Woo')
    e.cause = error
    throw e
  }
}

async function getWooOrdersHandler(event) {
  const wooGetRes = await getWooOrders(event.pathParameters.orderId)
  if (wooGetRes) {
    const { data } = wooGetRes
    return data
  } else {
    return null
  }
}

function getMatchingRecords(AirtableGetRecordRes, orderId) {
  let airtableId
  let airtableNumberOfMatches = 0
  if (typeof AirtableGetRecordRes === 'object') {
    AirtableGetRecordRes.forEach(record => {
      const {
        fields: { wooOrderId },
        id
      } = record
      if (wooOrderId == orderId) {
        airtableId = id
        airtableNumberOfMatches++
      }
    })
  }
  return { airtableId, airtableNumberOfMatches }
}

module.exports = {
  getWooOrders,
  getWooOrdersHandler,
  getMatchingRecords
}
