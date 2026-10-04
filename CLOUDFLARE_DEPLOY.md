# ڕێبەری دیپلۆیکردن لەسەر Cloudflare Pages 🚀

ئەم پڕۆژەیە بە تەواوی ئامادەکراوە و گونجێنراوە بۆ **Cloudflare Pages** و **Cloudflare Workers**.

---

## ⚡ خشتەی ڕێکخستنەکانی Cloudflare Pages (Build Settings)

لە کاتی دروستکردنی پڕۆژە نوێیەکە لە داشبۆردی Cloudflare، ئەم زانیارییانە دابنێ:

| خشتە (Field) | بەهاکەی (Value) |
| :--- | :--- |
| **Framework preset** | `Vite` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (یان بە بەتاڵی جێیبهێڵە) |
| **Node.js Version** | `20` (لە فایلی `.nvmrc` دانراوە) |

---

## 📁 فایلە ئامادەکراوەکانی ناو پڕۆژە بۆ Cloudflare:

1. **`public/_redirects`**:
   - دەستەبەری کارکردنی ڕێڕەوی SPA (Single Page Application) دەکات، تا لەسەر هەر پەڕەیەک یان بەستەرێک ڕیفرێش بکرێت تووشی هەڵەی 404 نەبێت (`/* /index.html 200`).
2. **`public/_headers`**:
   - ڕێکخستنی سیستەمی کەشکۆکردن (Caching)ی خێرای CDN و ئاستی پارێزگاری (Security Headers).
3. **`wrangler.toml`**:
   - ڕێکخستنی فەرمیی Cloudflare Wrangler CLI.
4. **`.nvmrc`**:
   - دیاریکردنی وەشانی Node.js 20 بۆ ژینگەی دروستکردنی Cloudflare.

---

## 🛠️ شێوازەکانی دیپلۆیکردن (هەڵبژاردنی یەکێک لەم ڕێگایانە):

### ڕێگای یەکەم: لە ڕێگەی GitHub / GitLab (باشترین و خودکارترین ڕێگا)
1. پڕۆژەکەت پاڵپێوە بنێ (Push) بۆ سەر ئەکاونتی GitHub یان GitLab.
2. بچۆ ناو کۆنتڕۆڵ پانێڵی **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
3. لە بەشی چەپ بڕۆ بۆ **Workers & Pages** -> کرتە لە **Create application** بکە.
4. بەشی **Pages** هەڵبژێرە و پەیوەندی بە **Connect to Git** بکە.
5. ریپۆزیتۆری پڕۆژەکەت هەڵبژێرە.
6. لە بەشی Build Settings:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
7. کرتە لە **Save and Deploy** بکە. پیرۆزە، ماڵپەڕەکەت بە کەمتر لە یەک خولەک لەسەر دۆمەینی بێبەرامبەری `*.pages.dev` چالاک دەبێت!

---

### ڕێگای دووەم: لە ڕێگەی ڕاکێشان و دابەزاندن (Direct Upload)
ئەگەر ناتەوێت گیت بەکاربهێنیت:
1. لە کۆمپیوتەرەکەت فەرمانی `npm run build` لێبدە.
2. فۆڵدەری `dist` بە تەواوی ئامادە دەبێت.
3. لە داشبۆردی Cloudflare بڕۆ بۆ **Workers & Pages** -> **Create application** -> **Pages** -> **Upload assets**.
4. ناوی پڕۆژەکە بنووسە و تەواوی فۆڵدەری `dist` ڕابکێشە بۆ ناوی (Drag & Drop).
5. کرتە لە **Deploy site** بکە!

---

### ڕێگای سێیەم: لە ڕێگەی تێرمیناڵەوە بە فەرمانی Wrangler (CLI)
```bash
npm run build
npx wrangler pages deploy dist --project-name=kurdish-historical-atlas
```

---

## 🔑 گۆڕاوە ژینگەییەکان (Environment Variables) - ئیختیاری:
ئەگەر کلیلی تایبەتی خۆت هەیە بۆ Google Maps:
لە داشبۆردی Cloudflare Pages -> بڕۆ بۆ **Settings** -> **Environment variables**:
- ناوی گۆڕاو: `VITE_GOOGLE_MAPS_API_KEY`
- بەهاکەی: کلیلەکەت
*(تێبینی: ئەگەر کلیلیش دانەنێیت، سیستەمەکە کلیلی ئامادەکراو و نەخشەی جێگرەوەی Leafletی تێدایە بە بێ کێشە کار دەکات).*
