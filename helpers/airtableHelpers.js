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
  if( !orderId ){
    throw new Error('Sorry holmes, we only do one right now')
  }
  
  
  let airtablePostResult = []
  const orders = await getWooOrders(orderId)

  if( orders.length < 1 ){
    console.warn('No action to take, as Woo provided no orders', $orderId)
  }else if(orderId) {
    // const {
    //   id,
    //   billing,
    //   metadata,
    //   line_items,
    //   status,
    //   date_created,
    //   total,
    //   currency
    // } = data[0]

    // if (!billing) {
    //   throw new Error('Could not determine billing for order ' + id)
    // }
    // const { first_name, last_name, email } = billing
    // const name = `${first_name} ${last_name}`    
    
    const records = await AirtableGetRecord(undefined, 'Orders', undefined, { wooId: order.id })
    
    // do we quit if empty?
    

    await mergeOrders(orders, records)

    
    // const { airtableId, airtableNumberOfMatches } = getMatchingRecords(
    //   AirtableGetRecordRes,
    //   id
    // )



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
  } else {
    throw new Error('Unreachable code from orderId missing')
    // const AirtableGetRecordRes = await AirtableGetRecord(undefined, 'Orders')
    // console.log({ AirtableGetRecordRes })
    // for (const order of data) {
    //   const {
    //     id,
    //     billing,
    //     metadata,
    //     line_items,
    //     status,
    //     date_created,
    //     total,
    //     currency
    //   } = order
    //   if (!billing) {
    //     return getWooOrdersRes
    //   }
    //   const { first_name, last_name, email } = billing
    //   const name = `${first_name} ${last_name}`

    //   const { airtableId, airtableNumberOfMatches } = getMatchingRecords(
    //     AirtableGetRecordRes,
    //     id
    //   )

    //   const mRes = await mergeRecords(
    //     id,
    //     name,
    //     metadata,
    //     line_items,
    //     email,
    //     status,
    //     date_created,
    //     total,
    //     currency,
    //     airtableNumberOfMatches,
    //     airtableId
    //   )

    //   airtablePostResult.push(mRes)
    // }
  }

  return airtablePostResult
  // } catch (error) {
  //   // console.error('Failed to sync orders?', error)
  //   const e = new Error('Failed to sync orders: ' + error.message)
  //   e.cause = error
  //   throw e
  // }
}


function parseOrderToRecord(order){
  const { 
    id: wooOrderId, 
    billing = {},
    meta_data: metadata, 
    line_items,
    status,
    date_created,
    total,
    currency
  } = order

  const { first_name, last_name, email } = billing
  const name = first_name + (last_name ? ` ${last_name}` : '')

  const data = {
    wooOrderId,
    metadata,
    name, 
    first_name, 
    last_name,
    email,
    line_items,
    status,
    date_created,
    total,
    currency
  }
  return data
}

async function mergeOrders(orders, records) {


    
  // find counts of orders
  const mapping = records.reduce( (counts, record) => {
    const { fields: { wooOrderId } } = record
    counts[wooOrderId] = (counts[wooOrderId] || [])
    counts[wooOrderId].push(record)
    return counts
  }, {})

  const dupes = Object
    .keys(mapping)
    .filter(id => mapping[id].length > 1)
    .reduce( (badActors, id) => badActors.concat(mapping[id]), [])

  if( dupes.length > 0 ){
    console.warn('The following airtable records are dupes', { dupes })
    throw new Error('Found duplicate records in AirTable')
  }

  const promises = orders.map( order => {
    const data = parseOrderToRecord(order)
    let [record] = mapping[order.id]
    let result
    if( record ){
      result = AirtableUpdateRecord('Orders', { ...record.fields, ...data }, record.id)
    }else{
      result = AirtableCreateRecord('Orders', obj)
    }
    return result
  })
  const results = Promise.all(promises)

  // iterate results, figure out who failed and who succeeded

  return {
    failures: [],
    successes: []
  }
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
  console.log({
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
  })
  if (airtableNumberOfMatches === 0) {
    console.log('Creating new record')
    airtablePostResult = await AirtableCreateRecord('Orders', obj)
  } else if (airtableNumberOfMatches === 1) {
    console.log('Updating record')
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
