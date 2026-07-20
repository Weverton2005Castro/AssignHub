/**
 * Starts embedded PostgreSQL + Redis without Docker (for local dev).
 */
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, '.local-data');

const PG_PORT = Number(process.env.PG_PORT || 5433);
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const PG_USER = 'subscriptionhub';
const PG_PASSWORD = 'subscriptionhub';
const PG_DB = 'subscriptionhub';

async function startPostgres() {
  const EmbeddedPostgres = require('embedded-postgres').default || require('embedded-postgres');
  const databaseDir = path.join(dataDir, 'postgres');
  fs.mkdirSync(databaseDir, { recursive: true });

  const alreadyInit = fs.existsSync(path.join(databaseDir, 'PG_VERSION'));
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: PG_USER,
    password: PG_PASSWORD,
    port: PG_PORT,
    persistent: true,
    onLog: (msg) => process.stdout.write(`[postgres] ${msg}`),
    onError: (msg) => process.stderr.write(`[postgres:err] ${msg}`),
  });

  if (!alreadyInit) {
    console.log('Initializing embedded PostgreSQL...');
    await pg.initialise();
  }

  console.log(`Starting PostgreSQL on :${PG_PORT}...`);
  await pg.start();

  try {
    await pg.createDatabase(PG_DB);
    console.log(`Database "${PG_DB}" ready`);
  } catch (e) {
    // already exists
    console.log(`Database "${PG_DB}" already exists (ok)`);
  }

  return pg;
}

async function startRedis() {
  const { RedisMemoryServer } = require('redis-memory-server');
  const redisServer = new RedisMemoryServer({
    instance: { port: REDIS_PORT },
  });
  const host = await redisServer.getHost();
  const port = await redisServer.getPort();
  console.log(`Redis listening on ${host}:${port}`);
  return redisServer;
}

const pg = await startPostgres();
const redis = await startRedis();

const envPath = path.join(dataDir, 'runtime.env');
const runtimeEnv = `DATABASE_URL=postgresql://${PG_USER}:${PG_PASSWORD}@127.0.0.1:${PG_PORT}/${PG_DB}?schema=public
REDIS_URL=redis://127.0.0.1:${REDIS_PORT}
`;
fs.writeFileSync(envPath, runtimeEnv);
console.log(`Wrote ${envPath}`);
console.log('Local infra is running. Keep this process open.');
console.log('Press Ctrl+C to stop.');

const shutdown = async () => {
  console.log('\nStopping infra...');
  try {
    await redis.stop();
  } catch {}
  try {
    await pg.stop();
  } catch {}
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// keep alive
await new Promise(() => {});
