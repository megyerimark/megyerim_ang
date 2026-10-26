import { Injectable, signal } from '@angular/core';

export interface VaultMeta { salt: string; iterations: number; verifier: string; }
export interface Credential { label: string; url: string; username: string; password: string; note: string; }

const VERIFIER_TEXT = 'mm-vault-v1';
const ITERATIONS = 600_000;           // OWASP 2023+ ajánlás PBKDF2-SHA256-hoz
const AUTO_LOCK_MS = 10 * 60 * 1000;  // 10 perc után automatikusan zár

const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (text: string) => Uint8Array.from(atob(text), c => c.charCodeAt(0));

/**
 * Zero-knowledge széf: a kulcs a széfjelszóból a böngészőben készül (PBKDF2-SHA256 → AES-256-GCM),
 * nem exportálható, és csak a memóriában él. A szerver kizárólag titkosított adatot lát.
 * Ha a jelszó elveszik, a tartalom NEM állítható vissza.
 */
@Injectable({ providedIn: 'root' })
export class VaultService {
    readonly unlocked = signal(false);
    private key: CryptoKey | null = null;
    private timer: ReturnType<typeof setTimeout> | null = null;

    private async derive(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
        const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, material,
            { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }

    private async encryptWith(key: CryptoKey, value: unknown): Promise<string> {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(value)));
        return JSON.stringify({ v: 1, iv: b64(iv), ct: b64(ct) });
    }

    private async decryptWith<T>(key: CryptoKey, blob: string): Promise<T> {
        const parsed = JSON.parse(blob) as { v: number; iv: string; ct: string };
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(parsed.iv) as BufferSource }, key, unb64(parsed.ct) as BufferSource);
        return JSON.parse(new TextDecoder().decode(plain)) as T;
    }

    /** Új széf: só + ellenőrző minta. A visszaadott adat menthető a szerverre (jelszót nem tartalmaz). */
    async create(password: string): Promise<VaultMeta> {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await this.derive(password, salt, ITERATIONS);
        const meta = { salt: b64(salt), iterations: ITERATIONS, verifier: await this.encryptWith(key, VERIFIER_TEXT) };
        this.setKey(key);
        return meta;
    }

    async unlock(password: string, meta: VaultMeta): Promise<boolean> {
        const key = await this.derive(password, unb64(meta.salt), meta.iterations);
        try {
            if (await this.decryptWith<string>(key, meta.verifier) !== VERIFIER_TEXT) return false;
        } catch { return false; }
        this.setKey(key);
        return true;
    }

    /** Jelszócsere: minden blobot visszafejt a régi, és újratitkosít az új kulccsal. */
    async rotate(newPassword: string, blobs: { id: number; vault_blob: string }[]): Promise<VaultMeta & { blobs: { id: number; vault_blob: string }[] }> {
        const oldKey = this.requireKey();
        const plain = await Promise.all(blobs.map(async b => ({ id: b.id, data: await this.decryptWith<unknown>(oldKey, b.vault_blob) })));
        const meta = await this.create(newPassword);
        const key = this.requireKey();
        return { ...meta, blobs: await Promise.all(plain.map(async p => ({ id: p.id, vault_blob: await this.encryptWith(key, p.data) }))) };
    }

    async encrypt(value: Credential[]): Promise<string> { this.touch(); return this.encryptWith(this.requireKey(), value); }
    async decrypt(blob: string): Promise<Credential[]> { this.touch(); return this.decryptWith<Credential[]>(this.requireKey(), blob); }

    lock(): void {
        this.key = null;
        this.unlocked.set(false);
        if (this.timer) clearTimeout(this.timer);
    }

    private requireKey(): CryptoKey {
        if (!this.key) throw new Error('A széf zárolva van.');
        return this.key;
    }
    private setKey(key: CryptoKey): void { this.key = key; this.unlocked.set(true); this.touch(); }
    private touch(): void {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.lock(), AUTO_LOCK_MS);
    }
}
