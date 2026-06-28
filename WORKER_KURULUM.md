# Gelen Kutusu Worker — Kurulum (≈10 dakika)

Bu Worker, sitedeki **soru/yorum formlarını** doğrudan admin panelinin **Gelen Kutusu**'na düşürür.
GitHub token Cloudflare'de gizli kalır; public repo'ya hiç girmez.

---

## 1. Cloudflare hesabı + Worker oluştur
1. https://dash.cloudflare.com → ücretsiz hesap aç / giriş yap
2. Sol menü → **Workers & Pages** → **Create application** → **Create Worker**
3. İsim ver: `yk-inbox` → **Deploy**
4. **Edit code** → açılan editöre bu repodaki **`worker.js`** dosyasının TAMAMINI yapıştır → **Deploy**

## 2. GitHub token oluştur
1. https://github.com/settings/tokens → **Generate new token (classic)**
2. Yetki: sadece **`repo`** kutusunu işaretle
3. Token'ı kopyala (bir daha gösterilmez)

## 3. Ortam değişkenlerini gir
Worker sayfası → **Settings** → **Variables and Secrets** → şunları ekle:

| İsim | Tür | Değer |
|------|-----|-------|
| `GH_TOKEN` | **Secret (Encrypt)** | 2. adımdaki token |
| `GH_REPO` | Text | `yargikalemi/yargikalemi.github.io` |
| `ALLOWED_ORIGIN` | Text | `https://yargikalemi.com` |
| `FORMSPREE_URL` | Text (ops.) | `https://formspree.io/f/xwvjaebn` — e-posta bildirimi istersen |

**Save / Deploy.**

## 4. Worker adresini bana ver
Worker'ın adresi şuna benzer:
```
https://yk-inbox.<kullanıcı-adın>.workers.dev
```
Bu adresi bana söyle; ben tek komutla **tüm form sayfalarına** (10 yazı + ana sayfa + yeni yazı şablonu) işlerim.

---

## Nasıl çalışır?
1. Ziyaretçi soru/yorum gönderir → Worker `comments.json`'a `status: "beklemede"` ekler
2. Admin panel → **Gelen Kutusu** → öğeyi görürsün
3. **Yorum**: *Onayla* dersin → sitede yayımlanır
4. **Soru**: *Cevapla* dersin → cevabını yazıp yayımlarsın
5. *Sil* dersin → tamamen kalkar

> Worker adresi girilene kadar formlar eskisi gibi Formspree'ye (e-posta) gönderir; hiçbir şey bozulmaz.

## Ücret
Cloudflare ücretsiz katman: **günde 100.000 istek**. Bu site için fazlasıyla yeter.
