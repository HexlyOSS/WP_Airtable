const Airtable = require('airtable')

async function getOrders(orderId){
  const res = await AirtableGetRecord('Orders', undefined, { orderId })
  if(res.length) {
    res
      .filter(row => row && row.fields && typeof row.fields.line_items === 'string')
      .forEach(row => row.fields.line_items = JSON.parse(row.fields.line_items) )
  } else {
    res.fields.line_items = JSON.parse(res.fields.line_items)
  }
  return res
}


const BaseWrapper = base => ({
  find: (orderId) => new Promise( (resolve, reject) => {
    base.find( orderId, (err, record) => !!error ? reject(err) : resolve(record) )
  }),
  findAllPaged: (view, wooId) => new Promise( async (resolve, reject) => {
    const result = []
        // called for each page
    const pager = (records, fetchNextPage) => {      
      records.forEach(function(record) {
        if(wooId) {
          const { fields: { wooOrderId }} = record

          if(wooOrderId == wooId) {
            results.push(record)
          }
        } else {
          results.push(record)
        }
      });

      // To fetch the next page of records, call `fetchNextPage`.
      // If there are more records, `page` will get called again.
      // If there are no more records, `done` will get called.
      fetchNextPage();
    }

    const done = err => {
      if( err ) {
        const e = new Error('Failed on paging order: ' + e.message)
        e.cause = err 
        reject(err)
      }else{
        resolve(result)
      }
    }
    
    base.select({view}).eachPage(pager, done)
  } )
})


async function AirtableGetRecord(baseId = process.env.SSM_AIRTABLE_BASE, tableName, view = '', selectCriteria = {}) {
  const { orderId, wooId } = selectCriteria
  console.log({baseId, tableName, view, orderId, wooId})
  const {
    SSM_AIRTABLE_API_KEY,
    SSM_AIRTABLE_ENDPOINT
  } = process.env
  Airtable.configure({
    apiKey: SSM_AIRTABLE_API_KEY,
    endpointUrl: SSM_AIRTABLE_ENDPOINT
  })

  let testBase = Airtable.base(baseId)
  const wrap = BaseWrapper(testBase(tableName))

  try {
    let result = []
    if( orderId ){
      const record = await wrap.find(orderId)
      record && result.push(record)
    } else {
      result = await wrap.findAllPaged(view)
    }
    return result
  }catch(err){
    if( err.statusCode === 404 ){
      // should we blow up? Nope, return null
      return null
    }
    const e = new Error(`Could not find Airtable records with parameter of orderId=${orderId}; Error: ${err.message}`)
    e.cause = err
    throw e
  }




  return new Promise((resolve, reject) => {
    
    if(orderId) {
      testBase(tableName).find(orderId, function(err, record){
        if(err) {
          const { message, statusCode } = err
          console.error(err)
          resolve({message, statusCode})
        }
        resolve(record)
      })
    } else {
      testBase(tableName).select({
        view
      }).eachPage(function page(records, fetchNextPage) {
          // This function (`page`) will get called for each page of records.

          records.forEach(function(record) {
            if(wooId) {
              const { fields: { wooOrderId }} = record

              if(wooOrderId == wooId) {
                allRecords.push(record)
              }
            } else {
              allRecords.push(record)
            }
          });

          // To fetch the next page of records, call `fetchNextPage`.
          // If there are more records, `page` will get called again.
          // If there are no more records, `done` will get called.
          fetchNextPage();

        },
        function done(err) {
          if (err) {
            console.error(err)
            return
          }
          resolve(allRecords)
        }
      )
    }
  })
}

async function AirtableCreateRecord(tableName, payload) {
  const {
    SSM_AIRTABLE_API_KEY,
    SSM_AIRTABLE_ENDPOINT,
    SSM_AIRTABLE_BASE
  } = process.env
  Airtable.configure({
    apiKey: SSM_AIRTABLE_API_KEY,
    endpointUrl: SSM_AIRTABLE_ENDPOINT
  })
  return new Promise(resolve => {
    let testBase = Airtable.base(SSM_AIRTABLE_BASE)

    testBase(tableName).create(
      payload
    ,
    (err, records) => {
      if (err) {
        console.error(err);
        return;
      }
      if(records) {
        let returnVal
        if(typeof records === 'array') {
          returnVal = records.map((record) => {
            return record.getId()
          })
        } else {
          returnVal = records._rawJson
        }
        resolve(returnVal)
      }
    })
  })
}

async function AirtableUpdateRecord(tableName, payload, id) {
  const {
    SSM_AIRTABLE_API_KEY,
    SSM_AIRTABLE_ENDPOINT,
    SSM_AIRTABLE_BASE
  } = process.env
  Airtable.configure({
    apiKey: SSM_AIRTABLE_API_KEY,
    endpointUrl: SSM_AIRTABLE_ENDPOINT
  })
  return new Promise(resolve => {
    let testBase = Airtable.base(SSM_AIRTABLE_BASE)

    testBase(tableName).update([{
      id,
      fields: payload
    }],
    (err, records) => {
      if (err) {
        console.error(err)
        return
      }
      if(records) {
        let returnVal
        const typeofRecords = typeof records
        
        if(typeofRecords === 'array' || 'object') {
          returnVal = records.map((record) => {
            return {fields: record.fields, id: record.id }
          })
        } else {
          returnVal = records._rawJson
        }
        resolve(returnVal)
      }
    })
  })
}

module.exports = {
  getOrders,
  AirtableCreateRecord,
  AirtableGetRecord,
  AirtableUpdateRecord
}