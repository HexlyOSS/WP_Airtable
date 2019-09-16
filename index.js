const express = require('express')
const axios = require('axios').default
const Airtable = require('airtable')
require('dotenv').config()
const app = express()
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
    const { url, method, } = req
    // console.log({res, url, method})

    // GET Routes
    if(method === 'GET') {
      if(url === '/orders' || url === '/customers' || url === '/products') {
        try {
          const wooPostRes = await axios.get(WOO_REST_URL+url, {
            auth: {
              username: WOO_C_KEY,
              password: WOO_C_SECRET
            }
          })
          this.getAirTable()
          const { data } = wooPostRes
          console.log({wooPostRes, data})
          res.send(data)
        } catch (error) {
          console.error(error)
          res.send(error)
        }
      } else {
        res.status(404).send('Unknown Route')
      }
    }
  }

  getAirTable() {
    let testBase = Airtable.base(AIRTABLE_BASE)

    testBase('Bugs & Issues').select({
      maxRecords: 3,
      view: "Bugs by Priority"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function(record) {
          console.log('Retrieved', record.get('Name'));
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
    });
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