import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
mkdirSync('.local/docker',{recursive:true});
if(!existsSync('.local/docker.env')){
 writeFileSync('.local/docker.env',`POSTGRES_PASSWORD=${randomBytes(32).toString('hex')}\nAPP_DB_PASSWORD=${randomBytes(32).toString('hex')}\n`,{flag:'wx',mode:0o600});
}
console.log('Configuracion Docker local preparada. Credenciales excluidas de Git.');
