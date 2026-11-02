import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const local = join(root, '.local');
const data = join(local, 'postgres-data');
const secretsFile = join(local, 'database.json');
const envFile = join(root, 'backend', '.env');
const pgBin = process.env.PG_BIN ?? 'C:\\Program Files\\PostgreSQL\\18\\bin';
const action = process.argv[2] ?? 'setup';

function run(name, args, allowed=[0]) {
  // PostgreSQL stays running after pg_ctl exits; do not leave captured pipes open.
  const result = spawnSync(join(pgBin, `${name}.exe`), args, { stdio:'ignore', windowsHide:true });
  if (result.error) throw result.error;
  if (!allowed.includes(result.status)) throw new Error(`${name} terminó con código ${result.status}. Revisa .local/postgres.log y permisos de la carpeta.`);
  return result.status;
}

async function main() {
  if (!['setup','start','stop','status'].includes(action)) throw new Error('Usa setup, start, stop o status');
  if (!existsSync(join(pgBin, 'pg_ctl.exe'))) throw new Error('Configura PG_BIN con la carpeta bin de PostgreSQL.');
  if (action !== 'setup' && !existsSync(join(data,'PG_VERSION'))) throw new Error('Primero ejecuta db:setup.');
  if (action === 'status') { const status=run('pg_ctl',['-D',data,'status'],[0,3]); console.log(status===0?'PostgreSQL activo':'PostgreSQL detenido'); return; }
  if (action === 'stop') { if(run('pg_ctl',['-D',data,'status'],[0,3])===0) run('pg_ctl',['-D',data,'stop','-m','fast','-w']); console.log('PostgreSQL detenido'); return; }
  mkdirSync(local,{recursive:true});
  if (!existsSync(secretsFile)) {
    if(existsSync(join(data,'PG_VERSION')) || existsSync(envFile)) throw new Error('Ya existen datos o .env sin configuración local; no se sobrescribirán.');
    writeFileSync(secretsFile,JSON.stringify({port:55432,adminPassword:randomBytes(32).toString('hex'),appPassword:randomBytes(32).toString('hex')},null,2),{flag:'wx',mode:0o600});
  }
  const settings=JSON.parse(readFileSync(secretsFile,'utf8'));
  if (!existsSync(join(data,'PG_VERSION'))) {
    const passwordFile=join(local,'init-password.tmp');
    writeFileSync(passwordFile,settings.adminPassword,{mode:0o600});
    try { run('initdb',['-D',data,'-U','nova_admin','--encoding=UTF8','--locale=C','--auth=scram-sha-256',`--pwfile=${passwordFile}`]); }
    finally { unlinkSync(passwordFile); }
    writeFileSync(join(data,'postgresql.auto.conf'),`listen_addresses = '127.0.0.1'\nport = ${settings.port}\ntimezone = 'America/Lima'\n`);
  }
  if (run('pg_ctl',['-D',data,'status'],[0,3]) !== 0) run('pg_ctl',['-D',data,'-l',join(local,'postgres.log'),'start','-w','-t','20']);
  if (action === 'start') { console.log(`PostgreSQL disponible en 127.0.0.1:${settings.port}`); return; }
  const admin = new pg.Client({host:'127.0.0.1',port:settings.port,user:'nova_admin',password:settings.adminPassword,database:'postgres',connectionTimeoutMillis:5000});
  try {
    await admin.connect();
    if(!(await admin.query("SELECT 1 FROM pg_roles WHERE rolname='nova_salud_app'")).rowCount) {
      // Generated password is hex only; no user-provided SQL interpolation.
      if(!/^[a-f0-9]{64}$/.test(settings.appPassword)) throw new Error('Credencial local inválida');
      await admin.query(`CREATE ROLE nova_salud_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${settings.appPassword}'`);
    }
    if(!(await admin.query("SELECT 1 FROM pg_database WHERE datname='nova_salud'")).rowCount)
      await admin.query('CREATE DATABASE nova_salud OWNER nova_salud_app');
    if(!existsSync(envFile)) writeFileSync(envFile,`PORT=3000\nDATABASE_URL=postgresql://nova_salud_app:${settings.appPassword}@127.0.0.1:${settings.port}/nova_salud\n`,{flag:'wx',mode:0o600});
    console.log(`Base nova_salud preparada en 127.0.0.1:${settings.port}. Credenciales guardadas localmente y excluidas de Git.`);
  } finally { await admin.end(); }
}
main().catch(error=>{ console.error(error.message); process.exitCode=1; });
