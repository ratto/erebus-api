import { env } from './config/env';
import { logger } from './infra/logger/logger';
import { createApp } from './app';

/** Local entrypoint: the only place in `src/` that binds a port (LLD §3). */
const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'erebus-api is listening.');
});
