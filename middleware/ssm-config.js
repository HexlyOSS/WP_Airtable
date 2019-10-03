const ssmConfig = () => ({
  before: (handler, next) => {
    const Config = require('config')
    handler.context.config = Config
    // console.log({
    //   env: process.env,
    //   Config
    // })
    next()
  }
})

module.exports = {
  ssmConfig
}
