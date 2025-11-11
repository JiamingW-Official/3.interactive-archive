import { useMemo, useState } from 'react'
import firms from './data/nyc_firms.json'
import './App.css'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

const hexToRgb = (hex = '') => {
  const sanitized = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(sanitized)) return null
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => char + char)
          .join('')
      : sanitized
  const numeric = Number.parseInt(normalized, 16)
  if (Number.isNaN(numeric)) return null
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  }
}

const rgbToHex = (r, g, b) =>
  `#${[r, g, b]
    .map((value) => {
      const clamped = Math.max(0, Math.min(255, Math.round(value)))
      return clamped.toString(16).padStart(2, '0')
    })
    .join('')}`

const rgbToHsl = (r, g, b) => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      default:
        h = (rn - gn) / d + 4
        break
    }
    h /= 6
  }

  return { h, s, l }
}

const hslToRgb = (h, s, l) => {
  if (s === 0) {
    const value = l * 255
    return { r: value, g: value, b: value }
  }
  const hue2rgb = (p, q, t) => {
    let temp = t
    if (temp < 0) temp += 1
    if (temp > 1) temp -= 1
    if (temp < 1 / 6) return p + (q - p) * 6 * temp
    if (temp < 1 / 2) return q
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = hue2rgb(p, q, h + 1 / 3)
  const g = hue2rgb(p, q, h)
  const b = hue2rgb(p, q, h - 1 / 3)
  return { r: r * 255, g: g * 255, b: b * 255 }
}

const desaturateHex = (hex, reduction = 0.9) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const mutedSaturation = Math.max(0, Math.min(1, s * (1 - reduction)))
  const { r, g, b } = hslToRgb(h, mutedSaturation, l)
  return rgbToHex(r, g, b)
}

const mixWithNeutral = (hex, mixHex = '#0b111f', weight = 0.32) => {
  const color = hexToRgb(hex)
  const neutral = hexToRgb(mixHex)
  if (!color || !neutral) return hex
  const clampWeight = Math.max(0, Math.min(1, weight))
  const blend = (channel) =>
    color[channel] * (1 - clampWeight) + neutral[channel] * clampWeight
  return rgbToHex(blend('r'), blend('g'), blend('b'))
}

const lightenHex = (hex, delta = 0.08) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const adjusted = Math.max(0, Math.min(1, l + delta))
  const { r, g, b } = hslToRgb(h, s, adjusted)
  return rgbToHex(r, g, b)
}

const buildImageUrl = (path = '') => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

const trimWords = (text = '', limit = 32) => {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= limit) return text.trim()
  return `${words.slice(0, limit).join(' ')}…`
}

const buildSummary = (firm) => {
  const cityLine = firm.city ? `${firm.city}, ${firm.state || 'NY'}` : 'New York'
  const stage = firm.focus_stage || firm.round_stage || 'growth rounds'
  const checks = firm.typical_check_size || firm.required_capital_usd || 'flexible commitments'
  const notes = firm.notes || ''
  const quote = firm.quote_style_line || ''

  const narrative = `${firm.firm_name} anchors ${stage} founders from ${cityLine}, pairing ${checks} capital with ${firm.sector_focus || 'multi-sector'} instincts. ${notes} ${quote}`

  return trimWords(narrative, 32)
}

const buildInitialCards = (source) =>
  source.map((firm) => ({
    id: `firm-${firm.id}`,
    name: firm.firm_name,
    category: firm.category,
    address: firm.hq_address,
    website: firm.website,
    logo: buildImageUrl(firm.logo_url),
    colors: {
      base: firm.bg_color || '#0e141f',
      accent: firm.accent_color || '#a5b9ff',
    },
    focusStage: firm.focus_stage || firm.round_stage,
    investmentRange: firm.required_capital_usd,
    quote: firm.quote_style_line,
    notes: firm.notes,
    summary: buildSummary(firm),
    placeholder: createPlaceholderImage(firm),
  }))

const createPlaceholderImage = (firm) => {
  const initials = firm.firm_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
  const primaryMixed = mixWithNeutral(
    desaturateHex(firm.bg_color || '#0e141f'),
    '#060a12',
    0.35,
  )
  const accentMixed = mixWithNeutral(
    desaturateHex(firm.accent_color || '#a5b9ff'),
    '#101625',
    0.22,
  )
  const primary = lightenHex(primaryMixed, 0.38)
  const accent = lightenHex(accentMixed, 0.28)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}"/>
          <stop offset="100%" stop-color="${accent}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="28" ry="28" fill="url(#grad)"/>
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
        font-family="SF Pro Display, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="64" fill="#ffffff" font-weight="600" letter-spacing="6">
        ${initials || 'NY'}
      </text>
    </svg>
  `

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const reorderCards = (cards, draggedId, targetId) => {
  const updated = [...cards]
  const fromIndex = updated.findIndex((item) => item.id === draggedId)
  const toIndex = updated.findIndex((item) => item.id === targetId)

  if (fromIndex === -1 || toIndex === -1) return cards
  const [moved] = updated.splice(fromIndex, 1)
  updated.splice(toIndex, 0, moved)
  return updated
}

const moveCardToEnd = (cards, draggedId) => {
  const updated = [...cards]
  const fromIndex = updated.findIndex((item) => item.id === draggedId)
  if (fromIndex === -1) return cards
  const [moved] = updated.splice(fromIndex, 1)
  updated.push(moved)
  return updated
}

function App() {
  const [companyCards, setCompanyCards] = useState(() => buildInitialCards(firms))
  const [draggedId, setDraggedId] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All Firms')
  const [activeStage, setActiveStage] = useState('All Stages')

  const categoryFilters = useMemo(
    () => ['All Firms', ...new Set(firms.map((firm) => firm.category))],
    [],
  )
  const stageFilters = useMemo(
    () => ['All Stages', ...new Set(firms.map((firm) => firm.round_stage).filter(Boolean))],
    [],
  )

  const filteredCards = useMemo(() => {
    const matchCategory = (card) =>
      activeCategory === 'All Firms' ? true : card.category === activeCategory
    const matchStage = (card) =>
      activeStage === 'All Stages'
        ? true
        : (card.focusStage || '').toLowerCase().includes(activeStage.toLowerCase())

    return companyCards.filter((card) => matchCategory(card) && matchStage(card))
  }, [companyCards, activeCategory, activeStage])

  const handleDragStart = (id) => (event) => {
    setDraggedId(id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }

  const handleDragEnter = (id) => (event) => {
    event.preventDefault()
    if (id === draggedId) return
    setDropTargetId(id)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleCardClick = (id) => () => {
    if (draggedId) return
    setSelectedCardId((current) => (current === id ? null : id))
  }

  const handleCardKey = (id) => (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCardClick(id)()
    }
  }

  const handleDrop = (id) => (event) => {
    event.preventDefault()
    if (!draggedId || draggedId === id) {
      setDropTargetId(null)
      return
    }

    setCompanyCards((prev) => reorderCards(prev, draggedId, id))
    setDraggedId(null)
    setDropTargetId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDropTargetId(null)
  }

  const handleBoardDrop = (event) => {
    event.preventDefault()
    if (!draggedId) return
    setCompanyCards((prev) => moveCardToEnd(prev, draggedId))
    setDraggedId(null)
    setDropTargetId(null)
  }

  const boardDropClasses = dropTargetId === 'board-end' ? 'drop-zone active' : 'drop-zone'

  return (
    <div className="app-shell">
      <section className="guide">
        <div className="guide-left">
          <p className="eyebrow">NYC Firm Navigator</p>
          <h1>Liquid Tarot Board</h1>
          <p className="subhead">
            Drag cards, tap filters, and crack open each firm’s 30-word signal before your next pitch
            walk.
          </p>
          <ol className="guide-steps">
            <li>
              <strong>Filter pulse.</strong> Focus by capital type or round heat.
            </li>
            <li>
              <strong>Drag to rank.</strong> Move cards into your hunt order.
            </li>
            <li>
              <strong>Tap to reveal.</strong> Each tile expands with a distilled thesis.
            </li>
          </ol>
        </div>
        <div className="guide-right">
          <div className="filter-block">
            <h2>Capital Lens</h2>
            <div className="chip-row">
              {categoryFilters.map((label) => (
                <button
                  key={label}
                  className={`chip ${activeCategory === label ? 'active' : ''}`}
                  onClick={() => setActiveCategory(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-block">
            <h2>Round Signal</h2>
            <div className="chip-row floating">
              {stageFilters.map((label) => (
                <button
                  key={label}
                  className={`chip ${activeStage === label ? 'active' : ''}`}
                  onClick={() => setActiveStage(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="board" onDragOver={handleDragOver} onDrop={handleBoardDrop}>
        {filteredCards.map((card) => {
          const isDragging = draggedId === card.id
          const isDropTarget = dropTargetId === card.id
          const isSelected = selectedCardId === card.id
          const gradientBase = lightenHex(
            mixWithNeutral(
              desaturateHex(card.colors.base || '#0e141f'),
              '#050810',
              0.38,
            ),
            0.4,
          )
          const gradientAccent = lightenHex(
            mixWithNeutral(
              desaturateHex(card.colors.accent || '#a5b9ff'),
              '#0f1824',
              0.24,
            ),
            0.3,
          )
          const auraAccent = lightenHex(
            mixWithNeutral(
              desaturateHex(card.colors.accent || '#a5b9ff'),
              '#08101f',
              0.3,
            ),
            0.24,
          )
          const cardClassNames = ['tarot-card']

          if (isDragging) cardClassNames.push('dragging')
          if (isDropTarget) cardClassNames.push('drop-target')
          if (isSelected) cardClassNames.push('selected')

          return (
            <article
              key={card.id}
              className={cardClassNames.join(' ')}
              draggable
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              onDragStart={handleDragStart(card.id)}
              onDragEnter={handleDragEnter(card.id)}
              onDragOver={handleDragOver}
              onDrop={handleDrop(card.id)}
              onDragEnd={handleDragEnd}
              onClick={handleCardClick(card.id)}
              onKeyDown={handleCardKey(card.id)}
            >
              <div
                className="card-aura"
                style={{
                  background: `radial-gradient(circle at top, ${auraAccent}24, transparent 70%)`,
                }}
              />
              <div className="card-content">
                <img
                  src={card.logo || card.placeholder}
                  alt={`${card.name} logo`}
                  className="card-logo"
                  onError={(event) => {
                    if (event.currentTarget.src !== card.placeholder) {
                      event.currentTarget.src = card.placeholder
                    }
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${gradientBase}, ${gradientAccent})`,
                  }}
                />
                <div className="card-text">
                  <h2>{card.name}</h2>
                  <p className="tag">{card.category}</p>
                  <p className="address">{card.address}</p>
                  <a className="website" href={card.website} target="_blank" rel="noreferrer">
                    {card.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
                <div className={`card-detail ${isSelected ? 'visible' : ''}`}>
                  <p className="quote">{card.quote || 'Stay curious, trust the signal.'}</p>
                  <p className="summary">{card.summary}</p>
                  <div className="detail-grid">
                    <div>
                      <span className="label">Stage</span>
                      <span>{card.focusStage || '—'}</span>
                    </div>
                    <div>
                      <span className="label">Check</span>
                      <span>{card.investmentRange || '—'}</span>
                    </div>
                    <div className="notes">
                      <span className="label">Notes</span>
                      <p>{card.notes || 'Founder-friendly partner focused on momentum.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
        <div
          className={boardDropClasses}
          onDragEnter={() => setDropTargetId('board-end')}
          onDragOver={handleDragOver}
          onDrop={handleBoardDrop}
        >
          Drop to send to the end
        </div>
      </div>
    </div>
  )
}

export default App
