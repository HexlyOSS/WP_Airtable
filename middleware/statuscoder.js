const statusCoder = {
  after: (handler, next) => {
    const { response } = handler
    const {statusCode, data} = response ? response : {statusCode: 500, data: []}
    let dStatusCode
    if(!statusCode && data) {
      dStatusCode = data.status
    }

    if(!dStatusCode && !statusCode && data) {
      dStatusCode = response.status
    }
    if( handler.response && typeof(handler.response) === 'object'){
      handler.response = {
        statusCode: statusCode ? statusCode : (dStatusCode ? dStatusCode :200),
        body: JSON.stringify(data ? data : response, null, 2)
      }
    } else {
      console.error({handler, msg: 'something\'s fishy'})
    }
    next()
  }
}

module.exports = {
  statusCoder
}