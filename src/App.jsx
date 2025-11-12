import { useMemo, useState } from 'react'
import firms from './data/nyc_firms.json'
import './App.css'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')
const MAX_TIER_CARDS = 2

const STAGE_TIERS = [
  {
    id: 'funding-scout',
    group: 'Funding Phase',
    title: 'Pre-Raise Radar',
    description: 'Teams still chasing traction or readying a seed round.',
  },
  {
    id: 'funding-active',
    group: 'Funding Phase',
    title: 'In-Market Heat',
    description: 'Term sheets active and velocity-first stories.',
  },
  {
    id: 'ipo-prepare',
    group: 'IPO Phase',
    title: 'IPO Sprint',
    description: 'Polishing the S-1 and governance ahead of the window.',
  },
  {
    id: 'ipo-window',
    group: 'IPO Phase',
    title: 'IPO Window',
    description: 'Within days of pricing or ringing the bell.',
  },
  {
    id: 'post-ipo',
    group: 'Post-IPO',
    title: 'Post-Market Expansion',
    description: 'Fortifying the moat and planning global scale.',
  },
]

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
  return `${words.slice(0, limit).join(' ')}...`
}

const buildVoiceLine = (firm) => {
  const shortName = firm.firm_name?.split('(')[0]?.trim() || firm.firm_name
  const stage = firm.focus_stage || firm.round_stage || 'Multi-round'
  const check = firm.typical_check_size || firm.required_capital_usd || 'Flexible tickets'
  const city = firm.city || 'NYC'
  const sector = firm.sector_focus || 'Multi-sector'
  return `${shortName} backs ${stage} founders in ${city} with ${check}, favoring ${sector} instincts.`
}

const buildSummary = (firm) => {
  const descriptor = firm.description || ''
  const notes = firm.notes || ''
  const baseLine = `${firm.firm_name} - ${firm.focus_stage || 'Multi-stage'} - ${
    firm.sector_focus || 'Multi-sector'
  } - ${firm.typical_check_size || firm.required_capital_usd || 'Flexible tickets'}`
  return trimWords([baseLine, descriptor, notes].filter(Boolean).join(' '), 42)
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
    quote: buildVoiceLine(firm),
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

function App() {
  const companyCards = useMemo(() => buildInitialCards(firms), [])
  const cardsById = useMemo(() => {
    const map = new Map()
    companyCards.forEach((card) => {
      map.set(card.id, card)
    })
    return map
  }, [companyCards])

  const [tierAssignments, setTierAssignments] = useState(() =>
    STAGE_TIERS.reduce((acc, tier) => {
      acc[tier.id] = []
      return acc
    }, {}),
  )
  const [dragMeta, setDragMeta] = useState({ id: null, source: null })
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

  const assignedIds = useMemo(
    () => new Set(Object.values(tierAssignments).flat()),
    [tierAssignments],
  )
  const availableCards = useMemo(
    () => filteredCards.filter((card) => !assignedIds.has(card.id)),
    [filteredCards, assignedIds],
  )

  const handleCardClick = (id) => () => {
    if (dragMeta.id) return
    setSelectedCardId((current) => (current === id ? null : id))
  }

  const handleCardKey = (id) => (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCardClick(id)()
    }
  }

  const handleCardDragStart = (cardId, source) => (event) => {
    setDragMeta({ id: cardId, source })
    setDropTargetId(null)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', cardId)
  }

  const handleDragEnd = () => {
    setDragMeta({ id: null, source: null })
    setDropTargetId(null)
  }

  const moveCardToTier = (cardId, tierId = null) => {
    setTierAssignments((prev) => {
      const stripped = Object.fromEntries(
        Object.entries(prev).map(([key, list]) => [key, list.filter((id) => id !== cardId)]),
      )
      if (!tierId) {
        return stripped
      }
      const target = stripped[tierId] || []
      if (target.length >= MAX_TIER_CARDS) {
        return prev
      }
      return {
        ...stripped,
        [tierId]: [...target, cardId],
      }
    })
  }

  const handleTierDrop = (tierId) => (event) => {
    event.preventDefault()
    if (!dragMeta.id) return
    moveCardToTier(dragMeta.id, tierId)
    handleDragEnd()
  }

  const handleTierDragEnter = (tierId) => (event) => {
    event.preventDefault()
    if (!dragMeta.id) return
    setDropTargetId(tierId)
  }

  const handlePoolDragEnter = (event) => {
    event.preventDefault()
    if (!dragMeta.id) return
    setDropTargetId('library')
  }

  const handlePoolDrop = (event) => {
    event.preventDefault()
    if (!dragMeta.id) return
    moveCardToTier(dragMeta.id)
    handleDragEnd()
  }

  const releaseCard = (cardId) => {
    moveCardToTier(cardId)
  }

  const renderCard = (card, { variant = 'library-card', originTierId = null } = {}) => {
    const gradientBase = lightenHex(
      mixWithNeutral(desaturateHex(card.colors.base || '#0e141f'), '#050810', 0.38),
      0.4,
    )
    const gradientAccent = lightenHex(
      mixWithNeutral(desaturateHex(card.colors.accent || '#a5b9ff'), '#0f1824', 0.24),
      0.3,
    )
    const auraAccent = lightenHex(
      mixWithNeutral(desaturateHex(card.colors.accent || '#a5b9ff'), '#08101f', 0.3),
      0.24,
    )
    const cardClassNames = ['tarot-card', variant]

    if (dragMeta.id === card.id) cardClassNames.push('dragging')
    if (selectedCardId === card.id) cardClassNames.push('selected')

    const websiteLabel = card.website ? card.website.replace(/^https?:\/\//, '') : 'No link'

    return (
      <article
        key={`${variant}-${card.id}`}
        className={cardClassNames.join(' ')}
        draggable
        tabIndex={0}
        role="button"
        aria-pressed={selectedCardId === card.id}
        onDragStart={handleCardDragStart(card.id, originTierId ? `tier:${originTierId}` : 'library')}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick(card.id)}
        onKeyDown={handleCardKey(card.id)}
      >
        {originTierId ? (
          <button
            type="button"
            className="card-remove"
            onClick={(event) => {
              event.stopPropagation()
              releaseCard(card.id)
            }}
          >
            Return
          </button>
        ) : null}
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
            {card.website ? (
              <a className="website" href={card.website} target="_blank" rel="noreferrer">
                {websiteLabel}
              </a>
            ) : (
              <span className="website muted">{websiteLabel}</span>
            )}
            <p className="inline-summary">{card.summary}</p>
          </div>
          <div className={`card-detail ${selectedCardId === card.id ? 'visible' : ''}`}>
            <p className="quote">{card.quote}</p>
            <p className="summary">{card.notes || card.summary}</p>
            <div className="detail-grid">
              <div>
                <span className="label">Stage</span>
                <span>{card.focusStage || '-'}</span>
              </div>
              <div>
                <span className="label">Check</span>
                <span>{card.investmentRange || '-'}</span>
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
  }

  return (
    <div className="app-shell">
      <section className="guide">
        <div className="guide-left">
          <p className="eyebrow">NYC Firm Navigator</p>
          <h1>Tiered Deal Board</h1>
          <p className="subhead">
            Drag firms across Funding to IPO to Post-IPO tracks, two cards max per lane for quick comparisons.
          </p>
          <ol className="guide-steps">
            <li>
              <strong>Set the signal.</strong> Use the filters to lock capital type and round.
            </li>
            <li>
              <strong>Drag into stages.</strong> Keep two cards per lane to shape your tier list.
            </li>
            <li>
              <strong>Open the profile.</strong> Click a card to read the voice line and capital focus.
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

      <section className="tiers-board">
        <div className="tiers-headline">
          <p className="eyebrow">Tier Builder</p>
          <h2>Funding to IPO to Post-IPO Track</h2>
          <p>Drop up to two cards into each phase and reshuffle live during class.</p>
        </div>
        {STAGE_TIERS.map((tier) => {
          const currentCards = tierAssignments[tier.id]
            .map((cardId) => cardsById.get(cardId))
            .filter(Boolean)
          const emptySlots = Math.max(0, MAX_TIER_CARDS - currentCards.length)

          return (
            <div key={tier.id} className="tier-row">
              <div className="tier-meta">
                <p className="tier-eyebrow">{tier.group}</p>
                <h3>{tier.title}</h3>
                <p>{tier.description}</p>
                <span className="tier-cap">Max {MAX_TIER_CARDS}</span>
              </div>
              <div
                className={`tier-track ${dropTargetId === tier.id ? 'active' : ''} ${
                  currentCards.length >= MAX_TIER_CARDS ? 'full' : ''
                }`}
                onDragEnter={handleTierDragEnter(tier.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleTierDrop(tier.id)}
              >
                {currentCards.map((card) => renderCard(card, { variant: 'tier-card', originTierId: tier.id }))}
                {Array.from({ length: emptySlots }).map((_, index) => (
                  <div key={`slot-${tier.id}-${index}`} className="tier-slot">
                    <span>Drop cards here</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <section
        className={`library-panel ${dropTargetId === 'library' ? 'active-drop' : ''}`}
        onDragEnter={handlePoolDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handlePoolDrop}
      >
        <div className="library-header">
          <div>
            <p className="eyebrow">Firm Library</p>
            <h2>All Firms</h2>
            <p className="library-copy">Drag cards into the tiers above or drop them here to release.</p>
          </div>
          <span className="library-count">{availableCards.length} / {companyCards.length}</span>
        </div>
        <div className="library-grid">
          {availableCards.length > 0 ? (
            availableCards.map((card) => renderCard(card, { variant: 'compact-card' }))
          ) : (
            <div className="empty-state">
              No cards match the filters. Adjust the filters or release cards from a tier.
            </div>
          )}
        </div>
      </section>

      <section className="about-panel">
        <h3>About This Board</h3>
        <p>
          The data blends NYC firms, stage focus, check sizes, and sectors so classroom discussions convert into a tier
          list. After edits run npm run deploy to sync with GitHub Pages.
        </p>
        <p>
          Workshop prompt: pick a capital type, drag signature firms into each phase, then open cards to narrate voice
          lines, check ranges, and extra notes.
        </p>
      </section>
    </div>
  )
}

export default App
