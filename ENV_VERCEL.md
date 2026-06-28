# متغيرات البيئة المطلوبة على Vercel

إذا ظهر الخطأ: **`Environment variable not found: DATABASE_URL`** أو فشل تسجيل الدخول/إنشاء الحساب على النسخة المرفوعة، يجب إضافة المتغيرات التالية في Vercel.

## الخطوات

1. افتح مشروعك على **[Vercel](https://vercel.com)**.
2. ادخل إلى **Settings** → **Environment Variables**.
3. أضف المتغيرات التالية (اضغط **Add** لكل واحد):

| Key | Value | Environment |
|-----|--------|-------------|
| **DATABASE_URL** | الرابط الكامل لقاعدة PostgreSQL (من Neon أو Supabase أو Vercel Postgres). مثال: `postgresql://user:password@host/dbname?sslmode=require` | Production + Preview |
| **NEXTAUTH_SECRET** | نص عشوائي طويل (مثلاً 32 حرفاً). يمكن استخدام: https://generate-secret.vercel.app/32 | Production + Preview |
| **NEXTAUTH_URL** | عنوان موقعك على Vercel بالضبط، مثل: `https://your-app.vercel.app` أو دومينك المخصص | Production + Preview |
| **NEXT_PUBLIC_TLDRAW_LICENSE_KEY** | مفتاح ترخيص tldraw SDK | Production + Preview |
| **NEXT_PUBLIC_TLDRAW_SYNC_URL** | عنوان Cloudflare Worker للسبورة، مثل `https://agyal-tldraw-sync.account.workers.dev` | Production + Preview |
| **TLDRAW_SYNC_SECRET** | سر JWT مشترك بين Next.js و Worker (نفس القيمة في `wrangler secret`) | Production + Preview |

4. اضغط **Save** بعد كل متغير.
5. من **Deployments** → اختر آخر نشر → **⋯** → **Redeploy** (لتحميل المتغيرات الجديدة).

## ملاحظات

- **DATABASE_URL** يجب أن يكون رابط قاعدة بيانات **سحابية** (Neon / Supabase / Vercel Postgres)، وليس من جهازك (لا تستخدم `localhost`).
- **NEXTAUTH_URL** يجب أن يطابق عنوان الموقع بعد النشر (مع `https://` وبدون شرطة في النهاية).
- بعد إضافة المتغيرات يجب **Redeploy** حتى تُطبَّق على النسخة المرفوعة.
- **السبورة المباشرة**: انشر Worker من `workers/tldraw-sync` (راجع `workers/tldraw-sync/README.md`) واضبط `ALLOWED_ORIGINS` في `wrangler.toml` ليشمل عنوان موقعك.

## التحقق

بعد إعادة النشر، افتح في المتصفح:

```
https://عنوان-موقعك.vercel.app/api/health
```

إذا ظهر `"ok": true` و `"database": { "status": "ok" }` فالإعداد صحيح وتسجيل الدخول وإنشاء الحساب سيعملان.

## خطأ Vercel: `404: NOT_FOUND` على الصفحة الرئيسية

هذه **ليست** صفحة 404 من Next.js — بل من Vercel نفسها، ومعناها أن **لا يوجد نشر (deployment) ناجح** مرتبط بالدومين، أو أن إعدادات المشروع خاطئة.

### 1) تحقق من آخر نشر

في Vercel → **Deployments**:

- إذا كان آخر نشر **Failed** (أحمر)، افتح **Build Logs** واصلح الخطأ ثم **Redeploy**.
- يجب أن يظهر نشر بحالة **Ready** (أخضر) قبل أن يعمل `agyal.vercel.app`.

### 2) إعدادات المشروع (Settings → General)

| الإعداد | القيمة الصحيحة |
|--------|----------------|
| **Framework Preset** | Next.js |
| **Root Directory** | فارغ (`.` — جذر المستودع، **ليس** `workers/tldraw-sync`) |
| **Build Command** | `npm run build` (أو اتركه فارغاً ليستخدم الافتراضي) |
| **Output Directory** | **فارغ** — لا تضع `.next` ولا `out` |
| **Node.js Version** | 20.x أو 22.x (Next.js 16 يحتاج Node ≥ 20.9) |

> **مهم:** مجلد `workers/tldraw-sync` هو Cloudflare Worker منفصل — لا تنشره على Vercel. انشره بـ `wrangler deploy` من ذلك المجلد فقط.

### 3) متغيرات البيئة ثم إعادة النشر

بعد إضافة `DATABASE_URL` و `NEXTAUTH_*`، نفّذ **Redeploy** من آخر نشر (ليس مجرد Save للمتغيرات).

### 4) اختبار سريع

- `https://agyal.vercel.app/api/health` — يجب أن يعيد JSON (وليس صفحة Vercel البيضاء).
- إذا `/api/health` يعمل لكن `/` لا يعمل، أرسل لنا لقطة شاشة من Build Logs.
