import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(process.env.DATA_DIR||'storage');fs.mkdirSync(dir,{recursive:true});
export const db=new Database(path.resolve(process.env.DATABASE_PATH||path.join(dir,'prime-station.sqlite')));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tokens(provider TEXT PRIMARY KEY,payload TEXT NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,agent TEXT NOT NULL,title TEXT NOT NULL,prompt TEXT NOT NULL,status TEXT NOT NULL,output TEXT,metadata TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,event TEXT NOT NULL,detail TEXT NOT NULL,at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS invites(token_hash TEXT PRIMARY KEY,created_by TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,max_uses INTEGER NOT NULL DEFAULT 10,uses INTEGER NOT NULL DEFAULT 0,revoked INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS members(id TEXT PRIMARY KEY,name TEXT NOT NULL,joined_at INTEGER NOT NULL,last_seen INTEGER NOT NULL,disabled INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS room_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,member_id TEXT NOT NULL,name TEXT NOT NULL,message TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ideas(id TEXT PRIMARY KEY,member_id TEXT NOT NULL,name TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'proposed',created_at INTEGER NOT NULL);`);
function encryptionKey(){const k=process.env.TOKEN_ENCRYPTION_KEY||'';if(!/^[a-f0-9]{64}$/i.test(k))throw new Error('TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters.');return Buffer.from(k,'hex');}
export function saveToken(provider,payload){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',encryptionKey(),iv),body=Buffer.concat([c.update(JSON.stringify(payload),'utf8'),c.final()]);const packed=Buffer.concat([iv,c.getAuthTag(),body]).toString('base64');db.prepare('INSERT INTO tokens VALUES(?,?,?) ON CONFLICT(provider) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').run(provider,packed,Date.now());}
export function getToken(provider){const row=db.prepare('SELECT payload FROM tokens WHERE provider=?').get(provider);if(!row)return null;const b=Buffer.from(row.payload,'base64'),d=crypto.createDecipheriv('aes-256-gcm',encryptionKey(),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]).toString());}
export const setting=(k,f=null)=>{const r=db.prepare('SELECT value FROM settings WHERE key=?').get(k);return r?JSON.parse(r.value):f;};
export const setSetting=(k,v)=>db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k,JSON.stringify(v));
export const audit=(event,detail={})=>db.prepare('INSERT INTO audit(event,detail,at) VALUES(?,?,?)').run(event,JSON.stringify(detail),Date.now());
