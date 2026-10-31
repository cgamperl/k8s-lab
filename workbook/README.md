# Workbook

Exercise texts, published at https://cgamperl.github.io/k8s-lab/workbook/.
The Markdown files in `docs/` are the source; `docs/.vitepress/config.mts`
holds the sidebar and the German UI labels (VitePress, default theme).

- A push to `main` that changes `workbook/` builds the site with VitePress and
  replaces the folder `workbook/` on the `gh-pages` branch (workflow
  `.github/workflows/workbook.yaml`). The Helm repository on the same branch
  stays untouched.
- The site is live about one to two minutes after the push (Actions run, then
  the Pages build). GitHub Pages lets browsers cache pages for up to
  10 minutes; a page that is already open may need a reload with Ctrl+F5.
- The sidebar lists every `### Übung …` heading of a day (appendix: `## …`); it is generated from the files at build time. A new page needs one `page(...)` line in `config.mts`.
- `http://localhost:…` links are not checked (Docker Desktop on the training
  laptop); any other dead link fails the build.

Local preview (Node 22 or newer):

```bash
cd workbook
npm ci
npm run dev        # live preview while editing
npm run build && npm run preview   # the published build
```
