# BUGATS PORTĀLS — Next.js MVP

Tumšs, ātrs, gatavs izvietošanai (Vercel). Lapas: Sākumlapa (`/`), Raksts (`/article`), Kategorija (`/category`), Video (`/video`), Par (`/par`), Reklāma (`/reklaama`).

## 0) Prasības
- Node.js 18+
- Git
- (vēlams) Vercel konts

## 1) Lokāli
```bash
npm install
# ja vēlies arī Tailwind typography spraudni:
npm install -D @tailwindcss/typography

npm run dev
# atver http://localhost:3000
```

## 2) Repo
```bash
git init
git add .
git commit -m "BUGATS PORTĀLS MVP"
# izveido tukšu repo GitHub/ GitLab/ Bitbucket un pieslēdz:
git branch -M main
git remote add origin <tavs-repo-url>
git push -u origin main
```

## 3) Vercel izvietošana (ieteikts)
1. Ielogojies https://vercel.com un nospied "New Project".
2. Importē tikko izveidoto repo.
3. Framework: **Next.js** (auto atpazīs).
4. Build komandai: `next build`, output: `.next` (default).
5. Deploy — pēc ~minūtes saņemsi publisku URL.

## 4) Satura rediģēšana
- Demo raksti un video glabājas `lib/data.js`.
- Pievieno jaunas lapas mapē `app/`. Piem., `app/ziņas/page.js`.
- Bildes var izmantot ar `<img>`; nav obligāti `next/image`.

## 5) SEO & analītika (ātrais sākums)
- `app/layout.js` -> `metadata` laukā ieliec savu `title/description`.
- Pievieno Google Search Console (sitemap nav vajadzīgs MVP).
- Analītikai vari pievienot Plausible vai GA4 (iemet `<script>` `layout.js`).

## 6) Monetizācija
- `app/reklaama/page.js` satur slotu piemērus un cenas.
- AdSense: iemet skriptu `app/layout.js` (pēc Google norādēm).

## 7) Kas nav iekļauts (un var pievienot vēlāk)
- shadcn/ui ģenerators (mēs izmantojam minimālus paštaisītus UI komponentus).
- CMS (Sanity/Strapi). Pagaidām saturs failos, lai būtu vienkārši.
- Komentāri, autentifikācija, meklētājs.

---

**Success tip:** publicē un sāc satura ritmu (3 ziņas dienā + 1 video klips). Kad PV > 50k/mēn, pievieno Prebid un CMS.
