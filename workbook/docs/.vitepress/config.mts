import { defineConfig } from 'vitepress'

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
    // Consecutive "**Label:** text" lines stay on separate lines, as on GitHub
    // with the trailing line breaks they visually imply.
    breaks: true,
  },
  themeConfig: {
    sidebar: [
      { text: 'Start', link: '/' },
      { text: 'Tag 1: Vom Container zu Kubernetes', link: '/tag1' },
      { text: 'Tag 2: Helm, Updates, Fehlersuche', link: '/tag2' },
      { text: 'Tag 3: Netzwerk, Rancher, Challenge', link: '/tag3' },
      { text: 'Anhang: Symptome und Ursachen', link: '/anhang-symptome' },
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
