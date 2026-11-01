// Replaces the placeholders pXX and 81XX in the page with the participant's
// number, e.g. p07 and 8107. Copy buttons copy the replaced text.

export const STORAGE_KEY = 'workbook-participant'

// "7", "07", " 7 " -> "07"; anything without a digit -> ""
export function normalize(input: string): string {
  const digits = input.replace(/\D/g, '').slice(-2)
  return digits === '' || /^0+$/.test(digits) ? '' : digits.padStart(2, '0')
}

// Original text of every node that has been replaced, so that a changed or
// cleared number is applied to the original text again.
const originals = new WeakMap<Text, string>()

export function applyNumber(root: ParentNode, nr: string): number {
  const doc = (root as Node).ownerDocument ?? (root as Document)
  const walker = doc.createTreeWalker(root as Node, 4 /* NodeFilter.SHOW_TEXT */)
  let changed = 0
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text
    const original = originals.get(node) ?? node.data
    if (!original.includes('XX')) continue
    const next = nr ? original.replace(/pXX/g, `p${nr}`).replace(/81XX/g, `81${nr}`) : original
    if (next === original && !originals.has(node)) continue
    originals.set(node, original)
    if (node.data !== next) {
      node.data = next
      changed++
    }
  }
  return changed
}

export function loadNumber(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('nr')
    if (fromUrl !== null) return normalize(fromUrl)
    return normalize(window.localStorage.getItem(STORAGE_KEY) ?? '')
  } catch {
    return ''
  }
}

export function saveNumber(nr: string): void {
  try {
    if (nr) window.localStorage.setItem(STORAGE_KEY, nr)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage blocked: the number lasts until the page is closed
  }
}
