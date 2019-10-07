const { AirtableGetRecord } = require('./airtable')

// GET INTEGRATION IDS BASED ON CURRENT SOURCE
async function getSinkSsmName(name = 'woocommerce') {
  const res = await AirtableGetRecord('app0JJbDgZLggdMWB', 'Integrations', undefined, undefined)

  // console.log({ res })
}

async function getSourceSsmName() {

}

module.exports = { getSinkSsmName, getSourceSsmName }
