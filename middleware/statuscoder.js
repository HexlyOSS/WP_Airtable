const statusCoder = {
  after: (handler, next) => {
    const { response } = handler
    const { response: {statusCode, data} } = handler
    let dStatusCode
    if(!statusCode && data) {
      dStatusCode = data.status
    }

    if(!dStatusCode && !statusCode && data) {
      dStatusCode = response.status
    }
    console.log({handler, dStatusCode, statusCode})
    if( handler.response && typeof(handler.response) === 'object'){
      handler.response = {
        statusCode: statusCode ? statusCode : (dStatusCode ? dStatusCode :200),
        body: JSON.stringify(data ? data : response, null, 2)
      }
    } else {
      console.log({handler, msg: 'something\'s fishy'})
    }
    next()
  }
}

module.exports = {
  statusCoder
}