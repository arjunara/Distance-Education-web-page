const createResponse = (res, code, body, successMsg, err) => {
  const statusCodes = {
    200: 'SUCCESS',
    201: 'SUCCESS',
    202: 'SUCCESS',
    400: 'FAILURE',
    401: 'FAILURE',
    402: 'FAILURE',
    500: 'SERVER FAILED'
  };
  const response = {
    status: statusCodes[code],
    code
  };
  if (err) {
    response.message = err.message;
    return res.status(code).json(response);
  }
  (response.message = successMsg), (response.body = body);
  return res.status(code).json(response);
};

module.exports = createResponse;
