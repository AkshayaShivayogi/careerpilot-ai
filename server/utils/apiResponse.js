export function sendOk(res, data = {}, message = "", status = 200) {
  return res.status(status).json({
    success: true,
    data,
    message,
    ...data,
  });
}

export function sendFail(res, message = "Request failed", status = 400, data = {}) {
  return res.status(status).json({
    success: false,
    data,
    message,
  });
}
