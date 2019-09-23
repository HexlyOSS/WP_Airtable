const Airtable = require('airtable')
require('dotenv').config()
const {
  AIRTABLE_API_KEY,
  AIRTABLE_ENDPOINT,
  AIRTABLE_BASE
} = process.env
Airtable.configure({
  api: AIRTABLE_API_KEY,
  endpointUrl: AIRTABLE_ENDPOINT
})

async function AirtableGetRecord(tableName, view = '', orderId) {
  return new Promise((resolve, reject) => {
    let testBase = Airtable.base(AIRTABLE_BASE)
    let allRecords = []

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
            allRecords.push(record)
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
  return new Promise(resolve => {
    let testBase = Airtable.base(AIRTABLE_BASE)

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
  return new Promise(resolve => {
    let testBase = Airtable.base(AIRTABLE_BASE)

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

module.exports = { AirtableCreateRecord, AirtableGetRecord, AirtableUpdateRecord }