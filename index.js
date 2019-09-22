const express = require('express')
const axios = require('axios').default
var bodyParser = require('body-parser')
require('dotenv').config()
const app = express()
app.use(bodyParser.json())
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

class index {
  constructor() {
    this.listeningInit()
    console.log('constructor called')
  }

  async handleRequest(req, res, msg) {
    const { url, method, } = req
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
          airtableRecords = await AirtableGetRecord('Orders', "Bugs by Priority")
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
          let airtablePostResult
          const { body: { orderId } } = req
          
          if(!orderId) { throw new Error('Order Id required') }

          const wooGetRes = await axios.get(WOO_REST_URL + `/orders${ orderId ? `/${orderId}` : null }`, {
            auth: {
              username: WOO_C_KEY,
              password: WOO_C_SECRET
            }
          })
          // console.log({wooGetRes})
          
          const AirtableGetRecordRes = await AirtableGetRecord('Orders');
          let airtableId
          let airtableNumberOfMatches = 0
          // console.log({ AirtableGetRecordRes, airtableTypeof: typeof AirtableGetRecordRes})
          if(typeof AirtableGetRecordRes === 'object') {
            AirtableGetRecordRes.forEach(record => {
              const { fields: { wooOrderId }, id } = record
              if(wooOrderId === orderId) {
                airtableId = id
                airtableNumberOfMatches ++
                airtablePostResult = record
              }
            })
          }

          const { data } = wooGetRes
          const {
            id,
            billing,
            metadata, 
            line_items,
            status,
            date_created,
            total,
            currency
          } = data
          const { first_name, last_name, email } = billing
          const name = `${first_name} ${last_name}`
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

          // 
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
            console.log('Just one record found with that id', { airtablePostResult, obj, data})
          } else {
            // More than 1 record found
            throw new Error('More than one record found!')
          }

          // console.log({airtableId, airtableNumberOfMatches})

          res.send(airtablePostResult)
        }
      } catch (error) {
        const { message } = error
        console.error(error)
        res.status(500).send(message)
      }
    }
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