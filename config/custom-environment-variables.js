module.exports = {
  env: {
    node: 'NODE_ENV'
  },
  ssm: {
    disabled: 'SKIP_SSM'
  },
  woo: {
    key: 'SSM_WOO_C_KEY',
    secret: 'SSM_WOO_C_SECRET',
    url: 'SSM_WOO_REST_URL'
  },
  airtable: {
    key: 'SSM_AIRTABLE_API_KEY',
    endpoint: 'SSM_AIRTABLE_ENDPOINT',
    base: 'SSM_AIRTABLE_BASE'
  }
}
