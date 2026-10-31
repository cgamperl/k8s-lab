# Workbook

Exercise texts, published at https://cgamperl.github.io/k8s-lab/workbook/.
The Markdown files in `docs/` are the source.

- A push to `main` that changes `workbook/` builds the site with MkDocs
  (Material theme) and replaces the folder `workbook/` on the `gh-pages`
  branch (workflow `.github/workflows/workbook.yaml`). The Helm repository on
  the same branch stays untouched.
- The site is live about one to two minutes after the push (Actions run, then
  the Pages build). GitHub Pages lets browsers cache pages for up to
  10 minutes; a page that is already open may need a reload with Ctrl+F5.
- `hooks.py` adapts GitHub-style Markdown to Python-Markdown: blank line
  before a list, 4-space indentation under list items, line breaks between
  consecutive `**Label:**` lines. The files can therefore be written as for
  GitHub.

Local preview:

```bash
pip install -r workbook/requirements.txt
mkdocs serve -f workbook/mkdocs.yml
```
