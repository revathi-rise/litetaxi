import { randomUUID } from 'crypto';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ALL_ENTITIES } from './entities';

/**
 * DB_MODE=postgres  -> real PostgreSQL via DATABASE_URL (production / staging).
 * DB_MODE=memory    -> in-process pg-mem (dev & tests only; data lost on restart).
 *
 * In production use migrations (`synchronize` is only enabled for memory mode).
 */
export async function createDataSource(env: NodeJS.ProcessEnv = process.env): Promise<DataSource> {
  const mode = env.DB_MODE ?? 'memory';
  if (mode === 'postgres') {
    const options: DataSourceOptions = {
      type: 'postgres',
      url: env.DATABASE_URL,
      entities: ALL_ENTITIES,
      synchronize: env.DB_SYNCHRONIZE === 'true', // keep false outside local dev
      migrations: [__dirname + '/migrations/*.{ts,js}'],
      migrationsRun: env.DB_MIGRATIONS_RUN === 'true',
    };
    return new DataSource(options).initialize();
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { newDb, DataType } = require('pg-mem');
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({ name: 'current_database', returns: DataType.text, implementation: () => 'swiftcab_mem' });
  db.public.registerFunction({ name: 'version', returns: DataType.text, implementation: () => 'PostgreSQL 14.0 (pg-mem)' });
  db.public.registerFunction({ name: 'uuid_generate_v4', returns: DataType.uuid, implementation: () => randomUUID(), impure: true });
  const ds: DataSource = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: ALL_ENTITIES,
    synchronize: true,
  });
  return ds.initialize();
}
