const axios = require('axios').default

async function wooGetOrder(orderId) {
  const {
    WOO_C_KEY,
    WOO_C_SECRET,
    WOO_REST_URL
  } = process.env
  try {
    const url = WOO_REST_URL + '/orders' + (orderId ? `/${orderId}` : '')
    const res = await axios.get(url, {
      auth: {
        username: WOO_C_KEY,
        password: WOO_C_SECRET
      }
    })

    return res
  } catch (error) {
    const { response } = error
    console.error({ response })
    return response
  }
}

async function wooGetOrderHandler (event) {
  const wooGetRes = await wooGetOrder(event.pathParameters.orderId)
  if(wooGetRes) {
    const { data } = wooGetRes
    return data
  } else {
    return null
  }

}

function getMatchingRecords(AirtableGetRecordRes, orderId) {
  let airtableId
  let airtableNumberOfMatches = 0
  if(typeof AirtableGetRecordRes === 'object') {
    AirtableGetRecordRes.forEach(record => {
      const { fields: { wooOrderId }, id } = record
      if(wooOrderId == orderId) {
        airtableId = id
        airtableNumberOfMatches ++
      }
    })
  }
  return { airtableId, airtableNumberOfMatches }
}

module.exports = {
  wooGetOrder,
  wooGetOrderHandler,
  getMatchingRecords
}