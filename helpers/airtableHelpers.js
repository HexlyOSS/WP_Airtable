const {
  AirtableCreateRecord,
  AirtableGetRecord,
  AirtableUpdateRecord
} = require('../airtable')

const airtable = require('../airtable')

const { getMatchingRecords, getWooOrders } = require('./woo')

const getAirtableOrders = async event => {
  const { pathParameters: { orderId } } = event
  const res = await airtable.getOrders(orderId)
  
  return res
}

const syncOrders = async event => {
  const res = await syncOrdersHandler(event.pathParameters.orderId)

  return res
}

async function syncOrdersHandler(orderId) {
  try {
    const getWooOrdersRes = await getWooOrders(orderId)
    if(!getWooOrdersRes) {
      return new Error('Res was undefined')
    }
    const { data: {
      id,
      billing,
      metadata, 
      line_items,
      status,
      date_created,
      total,
      currency
    } } = getWooOrdersRes
    if(!billing) {
      return getWooOrdersRes
    }
    const { first_name, last_name, email } = billing
    const name = `${first_name} ${last_name}`

    const AirtableGetRecordRes = await AirtableGetRecord('Orders')

    const { airtableId, airtableNumberOfMatches } = getMatchingRecords(AirtableGetRecordRes, orderId)
    
    let airtablePostResult = mergeRecords(
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

    return airtablePostResult
  } catch (error) {
    const { data } = error
    console.error(error)
    return new Error(data)
  }
}

async function mergeRecords(id, name, metadata, line_items, email, status, date_created, total, currency, airtableNumberOfMatches, airtableId) {
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
}

module.exports = {
  getAirtableOrders,
  syncOrders
}