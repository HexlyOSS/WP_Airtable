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
    console.warn('No action to take, as Woo provided no orders', orderId)
  }else if(orderId) {  
    
    const records = await AirtableGetRecord(undefined, 'Orders', undefined, { wooId: orderId })
    
    // do we quit if empty?
    

    const mRes = await mergeOrders(orders, records)

    airtablePostResult.push(mRes)
  } else {
    throw new Error('Unreachable code from orderId missing')
  }

  return airtablePostResult
}


function parseOrderToRecord(order){
  // console.log({ order })
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
    metadata: JSON.stringify(metadata),
    name, 
    first_name, 
    last_name,
    email,
    line_items: JSON.stringify(line_items),
    status,
    date_created,
    total,
    currency
  }
  return data
}

async function mergeOrders(orders, records) {
  // console.log({ function: 'mergeOrders()', orders, records })

    
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

  const promises = orders.map( async order => {
    const data = parseOrderToRecord(order)
    let [record] = mapping[order.id] ? mapping[order.id] : []

    if(record && record.fields.id) {
      record.fields.id = undefined
    }

    let result
    if( record ){
      result = AirtableUpdateRecord('Orders', { ...record.fields, ...data }, record.id)
    }else{
      result = AirtableCreateRecord('Orders', { ...data })
    }
    return result
  })
  const results = await Promise.all(promises)
  // iterate results, figure out who failed and who succeeded

  return {
    failures: [],
    successes: [results]
  }
}

module.exports = {
  getAirtableOrders,
  syncOrders
}
