import { readFileSync } from 'node:fs'
import { defineConfig, type DefaultTheme } from 'vitepress'

// Same rules as the VitePress default slugify; set explicitly below so that
// the sidebar anchors and the heading ids cannot drift apart.
const slugify = (s: string) =>
  s.normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()

// One sidebar group per page; its entries are the page's headings at `level`
// (exercises are "### Übung …", the appendix uses "## …").
function page(text: string, file: string, level: 2 | 3): DefaultTheme.SidebarItem {
  const md = readFileSync(new URL(`../${file}.md`, import.meta.url), 'utf-8')
  const prefix = '#'.repeat(level) + ' '
  let fence = false
  const items: DefaultTheme.SidebarItem[] = []
  for (const line of md.split('\n')) {
    if (line.trimStart().startsWith('```')) fence = !fence
    if (fence || !line.startsWith(prefix)) continue
    const heading = line.slice(prefix.length).replace(/[`*]/g, '').trim()
    items.push({ text: heading.replace(/^Übung(en)? ([^:]+):/, '$2'), link: `/${file}#${slugify(heading)}` })
  }
  return { text, link: `/${file}`, collapsed: true, items }
}


export default defineConfig({
  lang: 'de-DE',
  title: 'Übungen',
  description: 'Container-Virtualisierung mit Docker Grundlagen und Aufbau',
  base: '/k8s-lab/workbook/',
  cleanUrls: true,
  lastUpdated: false,
  // http://localhost:… addresses refer to Docker Desktop on the training laptop.
  ignoreDeadLinks: 'localhostLinks',
  markdown: {
    anchor: { slugify },
    // Consecutive "**Label:** text" lines stay on separate lines, as on GitHub
    // with the trailing line breaks they visually imply.
    breaks: true,
  },
  themeConfig: {
    sidebar: [
      { text: 'Start', link: '/' },
      page('Tag 1: Vom Container zu Kubernetes', 'tag1', 3),
      page('Tag 2: Helm, Updates, Fehlersuche', 'tag2', 3),
      page('Tag 3: Netzwerk, Rancher, Challenge', 'tag3', 3),
      page('Anhang: Docker-Befehle', 'anhang-docker', 2),
      page('Anhang: Symptome und Ursachen', 'anhang-symptome', 2),
    ],
    outline: { level: [2, 3], label: 'Auf dieser Seite' },
    docFooter: { prev: 'Zurück', next: 'Weiter' },
    darkModeSwitchLabel: 'Darstellung',
    lightModeSwitchTitle: 'Helles Design',
    darkModeSwitchTitle: 'Dunkles Design',
    sidebarMenuLabel: 'Menü',
    returnToTopLabel: 'Nach oben',
    langMenuLabel: 'Sprache',
    notFound: { title: 'Seite nicht gefunden', quote: '', linkText: 'Zur Startseite' },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Suchen', buttonAriaLabel: 'Suchen' },
          modal: {
            noResultsText: 'Keine Ergebnisse für',
            resetButtonTitle: 'Suche zurücksetzen',
            footer: { selectText: 'auswählen', navigateText: 'navigieren', closeText: 'schließen' },
          },
        },
      },
    },
  },
})
