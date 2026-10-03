import serverless from 'serverless-http';

// Prevent the shared Express module from opening a standalone HTTP listener.
process.env.NETLIFY = 'true';
const { default: app } = await import('../../server/src/index.js');

export const handler = serverless(app);
