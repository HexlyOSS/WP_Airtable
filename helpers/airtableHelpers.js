const {
  AirtableCreateRecord,
  AirtableGetRecord,
  AirtableUpdateRecord
} = require('../airtable')

const airtable = require('../airtable')

const { getMatchingRecords, getWooOrders } = require('./woo')

const getAirtableOrders = async event => {
  const {
    pathParameters: { orderId }
  } = event
  const res = await airtable.getOrders(orderId)

  return res
}

const syncOrders = async event => {
  const res = await syncOrdersHandler(event.pathParameters.orderId)

  return res
}

async function syncOrdersHandler(orderId) {
  // try {
  let airtablePostResult = []

  const getWooOrdersRes = await getWooOrders(orderId)
  let { data } = getWooOrdersRes
  if (!getWooOrdersRes) {
    return new Error('Res was undefined')
  }

  if (!data.length) {
    data = [data]
  }

  for (const order of data) {
    const {
      id,
      billing,
      metadata,
      line_items,
      status,
      date_created,
      total,
      currency
    } = order
    if (!billing) {
      return getWooOrdersRes
    }
    const { first_name, last_name, email } = billing
    const name = `${first_name} ${last_name}`

    const AirtableGetRecordRes = await AirtableGetRecord('Orders')

    const { airtableId, airtableNumberOfMatches } = getMatchingRecords(
      AirtableGetRecordRes,
      id
    )

    const mRes = await mergeRecords(
      id,
      name,
      metadata,
      line_items,
      email,
      status,
      date_created,
      total,
      currency,
      airtableNumberOfMatches,
      airtableId
    )

    airtablePostResult.push(mRes)
  }

  return airtablePostResult
  // } catch (error) {
  //   // console.error('Failed to sync orders?', error)
  //   const e = new Error('Failed to sync orders: ' + error.message)
  //   e.cause = error
  //   throw e
  // }
}

async function mergeRecords(
  id,
  name,
  metadata,
  line_items,
  email,
  status,
  date_created,
  total,
  currency,
  airtableNumberOfMatches,
  airtableId
) {
  let airtablePostResult
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

  if (airtableNumberOfMatches === 0) {
    airtablePostResult = await AirtableCreateRecord('Orders', obj)
  } else if (airtableNumberOfMatches === 1) {
    airtablePostResult = await AirtableUpdateRecord('Orders', obj, airtableId)
  } else {
    throw new Error('More than one record found!')
  }

  return airtablePostResult
}

module.exports = {
  getAirtableOrders,
  syncOrders
}
