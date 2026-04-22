export function notFound(_req, res) {
  res.status(404).json({ ok: false, error: 'Not found' })
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500
  const message = err.expose ? err.message : status === 500 ? 'Internal server error' : err.message
  if (status >= 500) console.error(err)
  res.status(status).json({ ok: false, error: message })
}
