const serverless = require('serverless-http');

// Prevent the shared Express module from opening a standalone HTTP listener.
process.env.NETLIFY = 'true';

let serverlessHandler;

exports.handler = async (event, context) => {
  if (!serverlessHandler) {
    const { default: app } = await import('../../server/src/index.js');
    serverlessHandler = serverless(app);
  }

  return serverlessHandler(event, context);
};
