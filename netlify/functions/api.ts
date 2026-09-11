import serverless from 'serverless-http';

import { createApp } from '../../src/app';

/**
 * Netlify Function entrypoint.
 *
 * The app is built once at module scope, outside the handler, so it is reused
 * across warm invocations — building it per request would re-create the
 * container and reopen SQLite every time (LLD §13.1).
 *
 * Scaffolded only: this increment does not deploy, and `better-sqlite3`
 * viability on the Functions runtime is still open (LLD §15 item 1).
 */
const handler = serverless(createApp());

export { handler };
