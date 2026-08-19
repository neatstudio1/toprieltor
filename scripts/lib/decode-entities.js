'use strict'

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…',
  laquo: '«', raquo: '»',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  copy: '©', reg: '®', trade: '™', deg: '°', middot: '·', bull: '•'
}

function decodeHtmlEntities(input) {
  if (typeof input !== 'string' || !input.includes('&')) return input
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code) => {
    if (code[0] === '#') {
      const codePoint = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint)
    }
    return NAMED[code] ?? match
  })
}

function deepDecode(value) {
  if (typeof value === 'string') return decodeHtmlEntities(value)
  if (Array.isArray(value)) return value.map(deepDecode)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = deepDecode(v)
    return out
  }
  return value
}

module.exports = { decodeHtmlEntities, deepDecode }
