import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { connectionUrl } from './db-config.mjs';
import passwordModule from '../dist/modules/auth/password.js';

const client=new pg.Client({connectionString:connectionUrl()});
try {
  await client.connect();
  const username='admin';
  if ((await client.query('SELECT 1 FROM usuario WHERE lower(btrim(username))=$1',[username])).rowCount) {
    console.log('El usuario admin ya existe. No se modificó su contraseña.');
  } else {
    const password=randomBytes(18).toString('base64url');
    const hash=await passwordModule.hashPassword(password);
    const directory=new URL('../../.local/',import.meta.url);
    mkdirSync(directory,{recursive:true});
    const file=new URL('login-admin.txt',directory);
    await client.query('BEGIN');
    try {
      const result=await client.query("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,$1,'Administrador Nova Salud',$2 FROM rol WHERE codigo='ADMINISTRADOR' RETURNING id",[username,hash]);
      if(!result.rowCount) throw new Error('Primero aplica las migraciones.');
      writeFileSync(file,`Acceso local Nova Salud\nUsuario: ${username}\nContraseña: ${password}\n`,{flag:'wx',mode:0o600});
      await client.query('COMMIT');
      console.log(`Administrador creado. Credenciales locales: ${fileURLToPath(file)}`);
    } catch(error) { await client.query('ROLLBACK'); throw error; }
  }
} catch(error) { console.error(error.message); process.exitCode=1; }
finally { await client.end(); }
