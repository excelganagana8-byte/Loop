export const sendSuccess = (res, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const sendError = (res, { code = 'BAD_REQUEST', message = 'An error occurred', details = null }, statusCode = 400) => {
  const payload = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details !== null && details !== undefined) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
};
