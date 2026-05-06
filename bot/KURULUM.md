# KURT Bot Kurulum Rehberi

## 1. Telegram Bot Oluştur

1. Telegram'da **@BotFather**'a mesaj gönder
2. `/newbot` yaz
3. Bot ismi ver (örn: `KURT Hukuk`)
4. Bot kullanıcı adı ver (örn: `kurthukuk_bot`)
5. Verilen **TOKEN**'ı kaydet

## 2. Telegram Kullanıcı ID'ni Öğren

1. Telegram'da **@userinfobot**'a mesaj gönder
2. Verilen **Id** numarasını kaydet

## 3. GitHub Token Oluştur

1. github.com → Sağ üst profil → **Settings**
2. Sol menü en alt → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token (classic)**
5. Note: `KURT Bot`
6. Expiration: `No expiration`
7. Scope: **repo** kutucuğunu işaretle
8. **Generate token** → Kodu kaydet (bir daha göremezsin!)

## 4. Railway'e Deploy Et

1. railway.app → GitHub ile giriş yap
2. **New Project** → **Deploy from GitHub repo**
3. `erdemkapkara/Kurt` reposunu seç
4. **Variables** sekmesine geç, şu 4 değişkeni ekle:

| Değişken | Değer |
|---|---|
| `TELEGRAM_TOKEN` | BotFather'dan aldığın token |
| `GITHUB_TOKEN` | GitHub'dan oluşturduğun token |
| `GITHUB_REPO` | `erdemkapkara/Kurt` |
| `ALLOWED_USER_ID` | @userinfobot'tan aldığın ID |

5. **Settings** → **Build Command**: boş bırak
6. **Settings** → **Start Command**: `python bot/bot.py`
7. Deploy!

## 5. GitHub Pages Aktif Et

1. github.com/erdemkapkara/Kurt → **Settings**
2. Sol menü → **Pages**
3. **Branch**: `main` → **/ (root)** → **Save**
4. Birkaç dakika sonra site yayında

## Kullanım

Bot'a Telegram'dan şu formatta yaz:

```
Başlık: Anayasa Mahkemesi ve Bireysel Başvuru
Kategori: Ceza Hukuku
Özet: Bireysel başvuru yolunu kim, ne zaman, nasıl kullanabilir?

Anayasa Mahkemesi'ne bireysel başvuru, 2012 yılında hayata geçen
ve her vatandaşa açık olan anayasal bir güvencedir.

İkinci paragraf burada devam eder. Her boş satır yeni paragraf olur.
```

**Komutlar:**
- `/start` — Yardım ve format bilgisi
- `/liste` — Yayındaki tüm yazılar
- `/sil yazi-id` — Yazı sil (örn: `/sil zamanasimi`)
