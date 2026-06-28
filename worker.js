/**
 * Yargı Kalemi — Gelen Kutusu Worker (Cloudflare Workers)
 * ------------------------------------------------------------------
 * Ziyaretçilerin gönderdiği soru/yorumları GÜVENLE comments.json'a
 * "status: pending" (beklemede) olarak ekler. GitHub token burada,
 * sunucu tarafında gizli secret olarak durur — public repo'ya sızmaz.
 *
 * Admin panelinde "Gelen Kutusu" sekmesinde görünür; onaylanınca
 * status: "published" olur ve sitede yayımlanır.
 *
 * Gerekli ortam değişkenleri (Cloudflare → Settings → Variables):
 *   GH_TOKEN        (secret)  → repo yetkili Personal Access Token
 *   GH_REPO                   → ör. yargikalemi/yargikalemi.github.io
 *   ALLOWED_ORIGIN            → ör. https://yargikalemi.com
 *   FORMSPREE_URL   (ops.)    → e-posta bildirimi için Formspree adresi
 */

const GH_API = 'https://api.github.com';

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'method' }, 405, cors);
    }

    // ---- Gövdeyi oku (JSON veya form-encoded) ----
    let data = {};
    try {
      const ct = request.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await request.json();
      } else {
        const fd = await request.formData();
        for (const [k, v] of fd.entries()) data[k] = v;
      }
    } catch {
      return json({ ok: false, error: 'body' }, 400, cors);
    }

    // ---- Honeypot (basit bot/spam koruması) ----
    if (data.website || data._gotcha) {
      return json({ ok: true }, 200, cors); // sessizce yut
    }

    const tip = (data.tip === 'yorum') ? 'yorum' : 'soru';
    const slug = String(data.slug || '').slice(0, 200);
    const title = String(data.yazi || '').slice(0, 300);
    const email = String(data.email || '').slice(0, 160).trim();
    const isAnon = data.anonim === 'true' || data.anonim === true || data.anonim === 'on';

    let entry;
    if (tip === 'yorum') {
      const text = String(data.yorum || '').trim().slice(0, 2000);
      if (!text) return json({ ok: false, error: 'empty' }, 400, cors);
      entry = {
        id: String(Date.now()),
        type: 'yorum',
        status: 'pending',
        postSlug: slug,
        postTitle: title,
        anonymous: isAnon,
        authorName: isAnon ? '' : String(data.ad || '').slice(0, 120).trim(),
        authorEmail: email,
        text,
        date: new Date().toISOString(),
      };
    } else {
      const question = String(data.soru || '').trim().slice(0, 1500);
      if (!question) return json({ ok: false, error: 'empty' }, 400, cors);
      entry = {
        id: String(Date.now()),
        type: 'soru',
        status: 'pending',
        postSlug: slug,
        postTitle: title,
        askerName: String(data.ad || '').slice(0, 120).trim(),
        authorEmail: email,
        question,
        answer: '',
        date: new Date().toISOString(),
      };
    }

    // ---- comments.json'a ekle (çakışmada 1 kez yeniden dene) ----
    try {
      await appendComment(env, entry);
    } catch (e) {
      try { await appendComment(env, entry); }
      catch (e2) { return json({ ok: false, error: 'github' }, 502, cors); }
    }

    // ---- Opsiyonel e-posta bildirimi ----
    if (env.FORMSPREE_URL) {
      try {
        const fd = new FormData();
        fd.append('_subject', (tip === 'yorum' ? 'Yeni Yorum (beklemede) — ' : 'Yeni Soru (beklemede) — ') + title);
        fd.append('tip', tip);
        fd.append('yazi', title);
        fd.append('icerik', entry.text || entry.question || '');
        if (email) fd.append('email', email);
        await fetch(env.FORMSPREE_URL, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      } catch { /* bildirim başarısız olsa da kayıt eklendi */ }
    }

    return json({ ok: true }, 200, cors);
  },
};

async function appendComment(env, entry) {
  const repo = env.GH_REPO;
  const url = `${GH_API}/repos/${repo}/contents/comments.json`;
  const headers = {
    'Authorization': `token ${env.GH_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'yk-inbox-worker',
  };

  // Mevcut dosyayı oku
  let items = [];
  let sha = '';
  const r = await fetch(url, { headers });
  if (r.ok) {
    const d = await r.json();
    sha = d.sha;
    try { items = JSON.parse(decodeB64(d.content)); } catch { items = []; }
    if (!Array.isArray(items)) items = [];
  } else if (r.status !== 404) {
    throw new Error('read ' + r.status);
  }

  items.push(entry);

  const body = {
    message: (entry.type === 'yorum' ? 'Yeni yorum (beklemede): ' : 'Yeni soru (beklemede): ') + entry.id,
    content: encodeB64(JSON.stringify(items, null, 2)),
  };
  if (sha) body.sha = sha;

  const w = await fetch(url, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!w.ok) throw new Error('write ' + w.status);
}

function decodeB64(b64) {
  const clean = (b64 || '').replace(/\n/g, '');
  const bin = atob(clean);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

function encodeB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
