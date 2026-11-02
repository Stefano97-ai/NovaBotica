import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
export const backendRoot = fileURLToPath(new URL('../', import.meta.url));
config({ path: new URL('../.env', import.meta.url) });
export function connectionUrl() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL. Ejecuta db:setup o configura backend/.env.');
  return process.env.DATABASE_URL;
}
