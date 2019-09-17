const express = require('express')
const axios = require('axios').default
const Airtable = require('airtable')
var bodyParser = require('body-parser')
require('dotenv').config()
const app = express()
app.use(bodyParser.json())
const port = 3004
const {
  WOO_C_KEY,
  WOO_C_SECRET,
  WOO_REST_URL,
  AIRTABLE_API_KEY,
  AIRTABLE_ENDPOINT,
  AIRTABLE_BASE
} = process.env
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
Airtable.configure({
  api: AIRTABLE_API_KEY,
  endpointUrl: AIRTABLE_ENDPOINT
})

class index {
  constructor() {
    this.listeningInit()
    console.log('constructor called')
  }

  async handleRequest(req, res, msg) {
    console.log({ reqKeys: Object.keys(req), resKeys: Object.keys(res) })
    const { url, method, } = req
    // console.log({res, url, method})
    let responsePayload

    // GET Routes
    if(method === 'GET') {
      try {
        if(url === '/woo/orders') {
          responsePayload = await axios.get(WOO_REST_URL+'/orders', {
            auth: {
              username: WOO_C_KEY,
              password: WOO_C_SECRET
            }
          })
        }

        else if(url === '/airtable/orders') {
          airtableRecords = await this.getAirtable('Orders')
        }

        else {
          responsePayload = 'Unknown route ' + url
        }
        res.send(responsePayload)
      } catch (error) {
        console.error(error)
        res.send(error)
      }
    } 
    
    else if (method === 'POST'){
      try {
        if(url === '/orders/sync') {
          const { body: { orderId } } = req
          const wooGetRes = await axios.get(WOO_REST_URL + `/orders${ orderId ? `/${orderId}` : null }`, {
            auth: {
              username: WOO_C_KEY,
              password: WOO_C_SECRET
            }
          })
          console.log(wooGetRes)
          const { data } = wooGetRes
          const { id, name, metadata } = data
          const obj = { 'order id': id, name, meta_data: metadata}
          const airtablePostResult = await this.postToAirtable(
            'Orders',
            obj
          )

          res.send(airtablePostResult)
        }
      } catch (error) {
        console.error(error)
        res.send(error)
      }
    }
  }

  async getAirtable(tableName) {
    return new Promise((resolve) => {
      let testBase = Airtable.base(AIRTABLE_BASE)
      let allRecords = []

      testBase(tableName).select({
        maxRecords: 3,
        view: "Bugs by Priority"
      }).eachPage(function page(records, fetchNextPage) {
          // This function (`page`) will get called for each page of records.

          records.forEach(function(record) {
            allRecords.push(record)
            console.log('Retrieved', record.get('Name'))
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
    })
  }

  async postToAirtable(tableName, payload) {
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

  listeningInit(){
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
    app.get('/*', (req, res) => {
      // console.log({req, res})
      this.handleRequest(req, res, 'test msg')
    })
    app.post('/*', (req, res) => {
      // console.log({req, res})
      this.handleRequest(req, res, 'test msg')
    })
  }
}

module.exports = index