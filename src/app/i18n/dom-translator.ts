import { Injectable } from '@angular/core';
import { normalizeKey } from './i18n.service';

type Dict = { exact: Record<string, string>; patterns: { re: RegExp; en: string }[] };
const ATTRS = ['placeholder', 'title', 'aria-label'] as const;
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'CODE', 'PRE']);

/**
 * Az admin felület angol nézete. Az admin sablonjai magyarul íródtak (sok száz felirat), ezért itt nem
 * egyenként pipe-oljuk őket, hanem a megjelenített szöveget fordítjuk szótár alapján:
 * - pontos egyezés (a teljes szövegcsomópont), vagy minta ({0}, {1}… = változó rész, pl. számok, dátumok);
 * - a placeholder / title / aria-label attribútumok és a confirm() ablakok szövege is;
 * - a `translate="no"` jelölésű elemek (ügyfélüzenetek, leírások) érintetlenek maradnak.
 * Magyarra váltáskor minden eredeti szöveg visszaáll. Hiányzó fordításnál a magyar szöveg látszik.
 */
@Injectable({ providedIn: 'root' })
export class DomTranslator {
    private dict?: Dict;
    private observer?: MutationObserver;
    private active = false;
    private readonly textOriginal = new Map<Text, string>();
    private readonly textWritten = new WeakMap<Text, string>();
    private readonly attrOriginal = new Map<Element, Map<string, string>>();
    private nativeConfirm?: typeof window.confirm;

    async enable(): Promise<void> {
        if (this.active || typeof document === 'undefined') return;
        this.active = true;
        if (!this.dict) {
            const m = await import('./en-admin');
            const patterns = Object.entries(m.EN_ADMIN_PATTERNS)
                .sort((a, b) => b[0].replace(/\{\d+\}/g, '').length - a[0].replace(/\{\d+\}/g, '').length)
                .map(([hu, en]) => ({ re: new RegExp('^' + hu.split(/\{\d+\}/).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.*?)') + '$', 's'), en }));
            this.dict = { exact: m.EN_ADMIN, patterns };
        }
        if (!this.active) return; // közben visszaváltottak magyarra
        this.walk(document.body);
        this.observer = new MutationObserver(records => this.onMutations(records));
        this.observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
        this.nativeConfirm = window.confirm;
        const original = this.nativeConfirm.bind(window);
        window.confirm = (message?: string) => original(message === undefined ? message : this.translateText(String(message)) ?? message);
    }

    disable(): void {
        if (!this.active) return;
        this.active = false;
        this.observer?.disconnect();
        this.observer = undefined;
        if (this.nativeConfirm) { window.confirm = this.nativeConfirm; this.nativeConfirm = undefined; }
        for (const [node, original] of this.textOriginal) if (node.isConnected && node.data === this.textWritten.get(node)) node.data = original;
        for (const [el, attrs] of this.attrOriginal) if (el.isConnected) for (const [name, value] of attrs) el.setAttribute(name, value);
        this.textOriginal.clear();
        this.attrOriginal.clear();
    }

    /** Teljes szöveg fordítása (szótár vagy minta); null, ha nincs fordítás. */
    translateText(text: string): string | null {
        if (!this.dict) return null;
        const key = normalizeKey(text);
        if (!key) return null;
        const hit = this.dict.exact[key];
        if (hit) return hit;
        for (const p of this.dict.patterns) {
            const m = p.re.exec(key);
            if (m) return p.en.replace(/\{(\d+)\}/g, (_, i) => { const part = m[Number(i) + 1] ?? ''; return this.dict!.exact[normalizeKey(part)] ?? part; });
        }
        return null;
    }

    private onMutations(records: MutationRecord[]): void {
        for (const r of records) {
            if (r.type === 'childList') r.addedNodes.forEach(n => this.walk(n));
            else if (r.type === 'characterData' && r.target.nodeType === Node.TEXT_NODE) this.translateNode(r.target as Text);
            else if (r.type === 'attributes' && r.attributeName) this.translateAttr(r.target as Element, r.attributeName);
        }
    }

    private skipped(el: Element | null): boolean {
        for (let e = el; e; e = e.parentElement) {
            if (SKIP.has(e.tagName) || e.getAttribute('translate') === 'no' || (e as HTMLElement).isContentEditable) return true;
        }
        return false;
    }

    private walk(root: Node): void {
        if (root.nodeType === Node.TEXT_NODE) { this.translateNode(root as Text); return; }
        if (root.nodeType !== Node.ELEMENT_NODE) return;
        const el = root as Element;
        if (this.skipped(el)) return;
        for (const a of ATTRS) if (el.hasAttribute(a)) this.translateAttr(el, a);
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
            acceptNode: n => n.nodeType === Node.ELEMENT_NODE && (SKIP.has((n as Element).tagName) || (n as Element).getAttribute('translate') === 'no')
                ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
        });
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (n.nodeType === Node.TEXT_NODE) this.translateNode(n as Text, true);
            else for (const a of ATTRS) if ((n as Element).hasAttribute(a)) this.translateAttr(n as Element, a);
        }
    }

    private translateNode(node: Text, checked = false): void {
        const data = node.data;
        if (data === this.textWritten.get(node) || !/[A-Za-zÁ-ű]/.test(data)) return; // saját írásunk / nincs szöveg
        if (!checked && this.skipped(node.parentElement)) return;
        const en = this.translateText(data);
        if (!en) { this.textOriginal.delete(node); return; }
        const lead = data.match(/^\s*/)![0], trail = data.match(/\s*$/)![0];
        const next = lead + en + trail;
        if (this.textOriginal.size > 4000) for (const n of this.textOriginal.keys()) if (!n.isConnected) this.textOriginal.delete(n);
        this.textOriginal.set(node, data);
        this.textWritten.set(node, next);
        node.data = next;
    }

    private translateAttr(el: Element, name: string): void {
        const value = el.getAttribute(name);
        if (!value) return;
        const stored = this.attrOriginal.get(el);
        const en = this.translateText(value);
        if (!en || en === value) return;
        if (!stored) this.attrOriginal.set(el, new Map([[name, value]]));
        else stored.set(name, value);
        el.setAttribute(name, en);
    }
}
