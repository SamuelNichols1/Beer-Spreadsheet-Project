import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const USERS_LIST_KEY = 'usersList'
const BEER_LIST_KEY = 'beerList'
const BEER_LIST_WITH_RATINGS_KEY = 'beerListWithRatings'
const BEER_LIST_WITH_AVERAGE_RATINGS_KEY = 'beerListWithAverageRatings'
const COLLAPSED_SHEET_HEIGHT = 84
const BEER_TYPE_OPTIONS = ['Draught', 'Can', 'Bottle']
const BEER_STYLE_OPTIONS = [
  'IPA',
  'Session IPA',
  'Pale Ale',
  'Session Pale',
  'American Pale Ale',
  'India Pale Lager',
  'Lager',
  'Pilsner',
  'Kellerbier',
  'Helles',
  'Amber Ale',
  'Brown Ale',
  'Porter',
  'Stout',
  'Milk Stout',
  'Imperial Stout',
  'Wheat Beer',
  'Hefeweizen',
  'Belgian Blonde',
  'Saison',
  'Dubbel',
  'Tripel',
  'Sour',
  'Gose',
  'Lambic',
  'Barleywine',
]

function getExpandedSheetHeight() {
  if (typeof window === 'undefined') {
    return 520
  }
  return Math.max(220, Math.floor(window.innerHeight - 24))
}

function normalizeHexColor(value) {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : null
}

function normalizeBeerType(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const lower = value.trim().toLowerCase()
  if (lower === 'draft') {
    return 'draught'
  }

  return lower
}

function getUserId(user) {
  if (!user) return null
  if (typeof user.id !== 'undefined' && user.id !== null) return Number(user.id)
  if (typeof user.url === 'string') {
    const match = user.url.match(/\/(\d+)\/?$/)
    if (match) return Number(match[1])
  }
  return null
}

function parseStorageJson(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function getDefaultUserColor(userId) {
  const palette = ['#7c5cff', '#4aa9ff', '#00b894', '#ff7f50', '#ff5db1', '#f1a208', '#5e60ce']
  const numeric = Number(userId)
  return Number.isNaN(numeric) ? palette[0] : palette[numeric % palette.length]
}

function getUserColor(user) {
  const customColor = normalizeHexColor(user?.color)
  if (customColor) {
    return customColor
  }
  return getDefaultUserColor(user?.id)
}

function fmt(num, isMobile) {
  if (num === null || num === undefined || num === 0) return '-'
  const n = Number(num)
  if (Number.isNaN(n)) return '-'
  if (isMobile) return String(Math.round(n))
  return n.toFixed(1)
}

function toNumber(value) {
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex(r, g, b) {
  const toHex = (channel) => Math.round(channel).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function mixHex(colorA, colorB, t) {
  const a = hexToRgb(colorA)
  const b = hexToRgb(colorB)
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  )
}

function getScaleColor(value, maxValue) {
  const low = '#f4c7c3'
  const mid = '#fff2cc'
  const high = '#d9ead3'

  const numeric = Number(value)
  if (Number.isNaN(numeric) || maxValue <= 0) {
    return 'transparent'
  }

  const ratio = Math.max(0, Math.min(1, numeric / maxValue))
  if (ratio <= 0.5) {
    return mixHex(low, mid, ratio / 0.5)
  }
  return mixHex(mid, high, (ratio - 0.5) / 0.5)
}

function getScoreCellStyle(value, maxValue) {
  if (value === null || value === undefined || value === 0) {
    return undefined
  }

  return {
    backgroundColor: getScaleColor(value, maxValue),
  }
}

function getRatingInputStyle(value, maxValue) {
  return {
    ...(getScoreCellStyle(Number(value), maxValue) || {}),
    transition: 'background-color 120ms ease',
  }
}

function ScaleHint({ value, points }) {
  const numeric = Math.max(points[0].value, Math.min(points[points.length - 1].value, Number(value) || 0))

  let closestIdx = 0
  let minDistance = Math.abs(numeric - points[0].value)
  for (let i = 1; i < points.length; i += 1) {
    const distance = Math.abs(numeric - points[i].value)
    if (distance < minDistance || (distance === minDistance && points[i].value > points[closestIdx].value)) {
      closestIdx = i
      minDistance = distance
    }
  }

  let startIdx = closestIdx - 1
  let endIdx = closestIdx + 1
  if (startIdx < 0) { startIdx = 0; endIdx = Math.min(points.length - 1, 2) }
  else if (endIdx >= points.length) { endIdx = points.length - 1; startIdx = Math.max(0, points.length - 3) }
  const windowPoints = points.slice(startIdx, endIdx + 1)

  const winMin = windowPoints[0].value
  const winMax = windowPoints[windowPoints.length - 1].value
  const winRange = winMax - winMin || 1
  const maxValue = points[points.length - 1].value
  const arrowPct = ((numeric - winMin) / winRange) * 100

  return (
    <span className="rating-word-scale" aria-hidden="true">
      <span className="rating-word-scale-arrow" style={{ left: `${arrowPct}%` }}>&#x25BC;</span>
      {windowPoints.map((point, idx) => {
        const pct = ((point.value - winMin) / winRange) * 100
        const isFirst = idx === 0
        const isLast = idx === windowPoints.length - 1
        const xTransform = isFirst ? 'translateX(0%)' : isLast ? 'translateX(-100%)' : 'translateX(-50%)'
        return (
          <span
            key={point.label}
            className="rating-word-scale-pill"
            style={{ left: `${pct}%`, background: getScaleColor(point.value, maxValue), transform: xTransform }}
          >
            {point.label}
          </span>
        )
      })}
    </span>
  )
}

const TASTE_SCALE_WORDS = [
  { value: 0, label: 'Undrinkable' },
  { value: 10, label: 'Truly awful' },
  { value: 20, label: 'Bad' },
  { value: 30, label: 'Below average' },
  { value: 40, label: 'Meh' },
  { value: 50, label: 'Average' },
  { value: 60, label: 'Decent' },
  { value: 70, label: 'Good' },
  { value: 80, label: 'Very Good' },
  { value: 90, label: 'Excellent' },
  { value: 100, label: 'World class' },
]

const VALUE_SCALE_WORDS = [
  { value: 0, label: 'Very Spenny' },
  { value: 5, label: 'Bit Spenny' },
  { value: 10, label: 'About Average' },
  { value: 15, label: 'Bit Cheap' },
  { value: 20, label: 'Mega Cheap' },
]

const TEXTURE_SCALE_WORDS = [
  { value: 0, label: 'Undrinkable' },
  { value: 2.5, label: 'Unpleasant' },
  { value: 5, label: 'Standard' },
  { value: 7.5, label: 'Pleasant' },
  { value: 10, label: 'Perfect' },
]

const PACKAGING_SCALE_WORDS = [
  { value: 0, label: 'Hate' },
  { value: 1, label: 'Dislike' },
  { value: 2, label: "It's okay" },
  { value: 3, label: 'Like' },
  { value: 4, label: 'Heavily Like' },
  { value: 5, label: 'Love' },
]

const SCORE_BOUNDS = {
  taste: { min: 0, max: 100, label: 'Taste' },
  value: { min: 0, max: 20, label: 'Value' },
  texture: { min: 0, max: 10, label: 'Texture' },
  packaging: { min: 0, max: 5, label: 'Packaging' },
}

function validateAndNormalizeScores(form) {
  const normalized = {}

  for (const [field, bounds] of Object.entries(SCORE_BOUNDS)) {
    const numeric = Number(form[field])
    if (Number.isNaN(numeric)) {
      return { error: `${bounds.label} must be a number between ${bounds.min} and ${bounds.max}.` }
    }

    if (numeric < bounds.min || numeric > bounds.max) {
      return { error: `${bounds.label} must be between ${bounds.min} and ${bounds.max}.` }
    }

    normalized[field] = numeric
  }

  return { normalized }
}

function getRatedByDisplay(beer) {
  if (!Array.isArray(beer?.rated_by) || beer.rated_by.length === 0) {
    return '-'
  }
  return beer.rated_by.join(', ')
}

function getRatedByCount(beer) {
  return Array.isArray(beer?.rated_by) ? beer.rated_by.length : 0
}

function hasUserContributed(beer, username) {
  if (!Array.isArray(beer?.rated_by)) {
    return false
  }
  return beer.rated_by.includes(username)
}

function getUserShortLabel(username) {
  if (typeof username !== 'string') {
    return '--'
  }
  return username.trim().slice(0, 2).toUpperCase() || '--'
}

function getContributorsPieStyle(beer, selectedUsers) {
  if (!Array.isArray(selectedUsers) || selectedUsers.length === 0) {
    return { background: '#ffffff' }
  }

  const sliceSize = 360 / selectedUsers.length
  const slices = selectedUsers
    .map((user, index) => {
      const start = index * sliceSize
      const end = (index + 1) * sliceSize
      const color = getUserColor(user)
      const contributed = hasUserContributed(beer, user.username)
      const sliceColor = contributed ? color : '#f0ecff'
      return `${sliceColor} ${start}deg ${end}deg`
    })
    .join(', ')

  return {
    background: `conic-gradient(${slices})`,
  }
}

function TablePage({ onSignOut }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const usersList = useMemo(() => parseStorageJson(USERS_LIST_KEY, []), [])
  const [beerRatingsList, setBeerRatingsList] = useState(() => parseStorageJson(BEER_LIST_WITH_RATINGS_KEY, []))
  const users = useMemo(
    () =>
      usersList
        .map((u) => ({ id: getUserId(u), username: u.username, color: normalizeHexColor(u.color) }))
        .filter((u) => u.id !== null && typeof u.username === 'string' && !u.username.toLowerCase().includes('admin')),
    [usersList],
  )

  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [averageData, setAverageData] = useState([])
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false,
  )
  const [sortKey, setSortKey] = useState(null)
  const [sortDirection, setSortDirection] = useState('none')
  const [ratingsVersion, setRatingsVersion] = useState(0)
  const [sheetHeight, setSheetHeight] = useState(COLLAPSED_SHEET_HEIGHT)
  const [expandedSheetHeight, setExpandedSheetHeight] = useState(() => getExpandedSheetHeight())
  const [dragStartY, setDragStartY] = useState(null)
  const [dragStartHeight, setDragStartHeight] = useState(COLLAPSED_SHEET_HEIGHT)
  const [isDraggingSheet, setIsDraggingSheet] = useState(false)
  const [suppressHandleToggle, setSuppressHandleToggle] = useState(false)
  const [savingRating, setSavingRating] = useState(false)
  const [ratingError, setRatingError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [currentUsername, setCurrentUsername] = useState('')
  const [activeSearchInput, setActiveSearchInput] = useState(null)
  const [ratingForm, setRatingForm] = useState({
    breweryQuery: '',
    beerQuery: '',
    styleQuery: '',
    typeQuery: '',
    taste: 0,
    value: 0,
    texture: 0,
    packaging: 0,
  })
  const allUsersSelected = users.length > 0 && selectedUserIds.length === users.length
  const selectedUsers = useMemo(
    () => users.filter((user) => selectedUserIds.includes(user.id)),
    [selectedUserIds, users],
  )
  const beerOptions = useMemo(
    () =>
      averageData
        .map((beer) => ({ id: beer.id, label: `${beer.name} — ${beer.brewery}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [averageData],
  )
  const beerCatalog = useMemo(
    () =>
      averageData
        .map((beer) => ({
          id: beer.id,
          name: String(beer.name || ''),
          brewery: String(beer.brewery || ''),
          style: String(beer.style || ''),
          type: String(beer.type || ''),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [averageData],
  )
  const brewerySuggestions = useMemo(
    () => [...new Set(beerCatalog.map((beer) => beer.brewery))].sort((a, b) => a.localeCompare(b)),
    [beerCatalog],
  )
  const beerSuggestions = useMemo(
    () => [...new Set(beerCatalog.map((beer) => beer.name))].sort((a, b) => a.localeCompare(b)),
    [beerCatalog],
  )
  const filteredBrewerySuggestions = useMemo(() => {
    const query = ratingForm.breweryQuery.trim().toLowerCase()
    if (!query) {
      return brewerySuggestions.slice(0, 8)
    }
    return brewerySuggestions.filter((value) => value.toLowerCase().includes(query)).slice(0, 8)
  }, [brewerySuggestions, ratingForm.breweryQuery])
  const filteredBeerSuggestions = useMemo(() => {
    const query = ratingForm.beerQuery.trim().toLowerCase()
    if (!query) {
      return beerSuggestions.slice(0, 8)
    }
    return beerSuggestions.filter((value) => value.toLowerCase().includes(query)).slice(0, 8)
  }, [beerSuggestions, ratingForm.beerQuery])
  const styleOptions = useMemo(() => {
    const fromCatalog = beerCatalog.map((beer) => beer.style).filter((style) => Boolean(style && style.trim().length > 0))
    const uniqueByLower = new Map()

    ;[...BEER_STYLE_OPTIONS, ...fromCatalog].forEach((style) => {
      const normalized = style.trim()
      const key = normalized.toLowerCase()
      if (!uniqueByLower.has(key)) {
        uniqueByLower.set(key, normalized)
      }
    })

    return Array.from(uniqueByLower.values()).sort((a, b) => a.localeCompare(b))
  }, [beerCatalog])
  const filteredStyleSuggestions = useMemo(() => {
    const query = ratingForm.styleQuery.trim().toLowerCase()
    if (!query) {
      return styleOptions.slice(0, 8)
    }
    return styleOptions.filter((value) => value.toLowerCase().includes(query)).slice(0, 8)
  }, [ratingForm.styleQuery, styleOptions])
  const matchedBeers = useMemo(() => {
    const breweryQuery = ratingForm.breweryQuery.trim().toLowerCase()
    const beerQuery = ratingForm.beerQuery.trim().toLowerCase()
    const styleQuery = ratingForm.styleQuery.trim().toLowerCase()
    const typeQuery = normalizeBeerType(ratingForm.typeQuery)

    return beerCatalog.filter((beer) => {
      const breweryMatch = breweryQuery ? beer.brewery.toLowerCase().includes(breweryQuery) : true
      const beerMatch = beerQuery ? beer.name.toLowerCase().includes(beerQuery) : true
      const styleMatch = styleQuery ? beer.style.toLowerCase().includes(styleQuery) : true
      const typeMatch = typeQuery ? normalizeBeerType(beer.type) === typeQuery : true
      return breweryMatch && beerMatch && styleMatch && typeMatch
    })
  }, [beerCatalog, ratingForm.beerQuery, ratingForm.breweryQuery, ratingForm.styleQuery, ratingForm.typeQuery])
  const selectedBeerForRating = useMemo(() => {
    const breweryQuery = ratingForm.breweryQuery.trim().toLowerCase()
    const beerQuery = ratingForm.beerQuery.trim().toLowerCase()
    const styleQuery = ratingForm.styleQuery.trim().toLowerCase()
    const typeQuery = normalizeBeerType(ratingForm.typeQuery)

    const exactMatches = beerCatalog.filter(
      (beer) =>
        beer.brewery.toLowerCase() === breweryQuery &&
        beer.name.toLowerCase() === beerQuery &&
        breweryQuery.length > 0 &&
        beerQuery.length > 0 &&
        (styleQuery.length === 0 || beer.style.toLowerCase() === styleQuery) &&
        (typeQuery.length === 0 || normalizeBeerType(beer.type) === typeQuery),
    )

    if (exactMatches.length === 1) {
      return exactMatches[0]
    }

    if (matchedBeers.length === 1) {
      return matchedBeers[0]
    }

    return null
  }, [beerCatalog, matchedBeers, ratingForm.beerQuery, ratingForm.breweryQuery, ratingForm.styleQuery, ratingForm.typeQuery])
  const currentUserId = useMemo(() => {
    if (!currentUsername) {
      return null
    }

    const match = users.find((user) => user.username.toLowerCase() === currentUsername.toLowerCase())
    return match ? Number(match.id) : null
  }, [currentUsername, users])

  const sortedAverageData = useMemo(() => {
    if (!sortKey || sortDirection === 'none') {
      return averageData
    }

    const rows = [...averageData]

    rows.sort((a, b) => {
      if (sortKey === 'rated_by') {
        const aValue = getRatedByCount(a)
        const bValue = getRatedByCount(b)
        if (aValue !== bValue) {
          const result = aValue - bValue
          return sortDirection === 'asc' ? result : -result
        }

        const tieBreak = String(a?.name ?? '').localeCompare(String(b?.name ?? ''))
        return sortDirection === 'asc' ? tieBreak : -tieBreak
      }

      if (sortKey === 'brewery' || sortKey === 'name') {
        const aValue = String(a?.[sortKey] ?? '')
        const bValue = String(b?.[sortKey] ?? '')
        const result = aValue.localeCompare(bValue)
        return sortDirection === 'asc' ? result : -result
      }

      const aValue = toNumber(a?.[sortKey])
      const bValue = toNumber(b?.[sortKey])
      const result = aValue - bValue
      return sortDirection === 'asc' ? result : -result
    })

    return rows
  }, [averageData, sortDirection, sortKey])

  useEffect(() => {
    setSelectedUserIds(users.map((u) => u.id))
  }, [users])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const onChange = (event) => setIsMobile(event.matches)

    setIsMobile(mediaQuery.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange)
      return () => mediaQuery.removeEventListener('change', onChange)
    }

    mediaQuery.addListener(onChange)
    return () => mediaQuery.removeListener(onChange)
  }, [])

  useEffect(() => {
    if (users.length === 0) return
    if (selectedUserIds.length === 0) {
      setAverageData([])
      return
    }

    let cancelled = false
    setLoading(true)

    const token = localStorage.getItem('authToken') || ''
    const headers = {}
    if (token) headers['Authorization'] = `Token ${token}`

    const allSelected = selectedUserIds.length === users.length
    let url = `${apiBaseUrl}/beers_with_average_ratings/`

    if (!allSelected) {
      const params = new URLSearchParams()
      users
        .filter((u) => selectedUserIds.includes(u.id))
        .forEach((u) => params.append('users', u.username))
      url += `?${params.toString()}`
    }

    fetch(url, { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (!cancelled) setAverageData(data)
      })
      .catch((e) => console.error('Failed to fetch averages', e))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, ratingsVersion, selectedUserIds, users])

  useEffect(() => {
    const token = localStorage.getItem('authToken') || ''
    if (!token) {
      return
    }

    fetch(`${apiBaseUrl}/my-color/`, {
      method: 'GET',
      headers: { Authorization: `Token ${token}` },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((payload) => {
        if (typeof payload?.username === 'string') {
          setCurrentUsername(payload.username)
        }
      })
      .catch(() => {})
  }, [apiBaseUrl])

  useEffect(() => {
    if (!selectedBeerForRating || !currentUserId) {
      return
    }

    const beerRecord = beerRatingsList.find((beer) => Number(beer?.id) === Number(selectedBeerForRating.id))
    const ratings = Array.isArray(beerRecord?.ratings) ? beerRecord.ratings : []
    const existingRating = [...ratings].reverse().find((rating) => Number(rating?.user) === Number(currentUserId))

    if (existingRating) {
      setRatingForm((current) => ({
        ...current,
        taste: Number(existingRating.taste ?? 0),
        value: Number(existingRating.value ?? 0),
        texture: Number(existingRating.texture ?? 0),
        packaging: Number(existingRating.packaging ?? 0),
      }))
      return
    }

    setRatingForm((current) => ({
      ...current,
      taste: 0,
      value: 0,
      texture: 0,
      packaging: 0,
    }))
  }, [beerRatingsList, currentUserId, selectedBeerForRating])

  function onSheetPointerDown(event) {
    event.preventDefault()
    setSuppressHandleToggle(false)
    setIsDraggingSheet(true)
    setDragStartY(event.clientY)
    setDragStartHeight(sheetHeight)
  }

  function onSheetPointerMove(event) {
    if (dragStartY === null) {
      return
    }

    const delta = dragStartY - event.clientY
    const nextHeight = Math.max(COLLAPSED_SHEET_HEIGHT, Math.min(expandedSheetHeight, dragStartHeight + delta))
    setSheetHeight(nextHeight)
  }

  function onSheetPointerUp(event) {
    if (dragStartY === null) {
      return
    }

    const endY = typeof event?.clientY === 'number' ? event.clientY : dragStartY
    const deltaY = dragStartY - endY
    const movedEnoughToDrag = Math.abs(deltaY) > 3

    if (deltaY > 0) {
      setSheetHeight(expandedSheetHeight)
    } else if (deltaY < 0) {
      setSheetHeight(COLLAPSED_SHEET_HEIGHT)
    }

    setSuppressHandleToggle(movedEnoughToDrag)

    setDragStartY(null)
    setIsDraggingSheet(false)
  }

  function onSheetHandleClick() {
    if (suppressHandleToggle) {
      setSuppressHandleToggle(false)
      return
    }

    setSheetHeight((current) =>
      current <= COLLAPSED_SHEET_HEIGHT + 2 ? expandedSheetHeight : COLLAPSED_SHEET_HEIGHT,
    )
  }

  useEffect(() => {
    const onResize = () => {
      const nextExpandedHeight = getExpandedSheetHeight()
      setExpandedSheetHeight(nextExpandedHeight)
      setSheetHeight((current) => {
        if (current <= COLLAPSED_SHEET_HEIGHT) {
          return COLLAPSED_SHEET_HEIGHT
        }
        return nextExpandedHeight
      })
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (dragStartY === null) {
      return undefined
    }

    const handleMove = (event) => onSheetPointerMove(event)
    const handleUp = (event) => onSheetPointerUp(event)

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [dragStartY, dragStartHeight, expandedSheetHeight])

  useEffect(() => {
    if (!toastMessage) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage('')
    }, 2200)

    return () => window.clearTimeout(timeoutId)
  }, [toastMessage])

  function updateRatingField(field, value) {
    if (!Object.prototype.hasOwnProperty.call(SCORE_BOUNDS, field)) {
      setRatingForm((current) => ({ ...current, [field]: value }))
      return
    }

    if (value === '') {
      setRatingForm((current) => ({ ...current, [field]: '' }))
      return
    }

    const numeric = Number(value)
    if (Number.isNaN(numeric)) {
      return
    }

    const { min, max } = SCORE_BOUNDS[field]
    const clamped = Math.max(min, Math.min(max, numeric))
    setRatingForm((current) => ({ ...current, [field]: clamped }))
  }

  function applySelectedBeer(beer) {
    setRatingForm((current) => ({
      ...current,
      beerQuery: beer.name,
      breweryQuery: beer.brewery,
      styleQuery: beer.style,
      typeQuery: beer.type,
    }))
  }

  async function refreshBeerCaches(token) {
    const headers = token ? { Authorization: `Token ${token}` } : {}
    const [beerListResponse, beerRatingsResponse, beerAverageRatingsResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/beers/`, { method: 'GET', headers }),
      fetch(`${apiBaseUrl}/beers_with_ratings/`, { method: 'GET', headers }),
      fetch(`${apiBaseUrl}/beers_with_average_ratings/`, { method: 'GET', headers }),
    ])

    if (!beerListResponse.ok || !beerRatingsResponse.ok || !beerAverageRatingsResponse.ok) {
      throw new Error('Failed to refresh beer data')
    }

    const [beerList, beerRatings, beerAverageRatings] = await Promise.all([
      beerListResponse.json(),
      beerRatingsResponse.json(),
      beerAverageRatingsResponse.json(),
    ])

    localStorage.setItem(BEER_LIST_KEY, JSON.stringify(beerList))
    localStorage.setItem(BEER_LIST_WITH_RATINGS_KEY, JSON.stringify(beerRatings))
    localStorage.setItem(BEER_LIST_WITH_AVERAGE_RATINGS_KEY, JSON.stringify(beerAverageRatings))
    setBeerRatingsList(Array.isArray(beerRatings) ? beerRatings : [])
  }

  async function submitRating(event) {
    event.preventDefault()
    setRatingError('')

    const token = localStorage.getItem('authToken') || ''
    if (!token) {
      setRatingError('You are not authenticated.')
      return
    }

    const validation = validateAndNormalizeScores(ratingForm)
    if (validation.error) {
      setRatingError(validation.error)
      return
    }

    const resolvedName = String(selectedBeerForRating?.name || ratingForm.beerQuery || '').trim()
    const resolvedBrewery = String(selectedBeerForRating?.brewery || ratingForm.breweryQuery || '').trim()
    const resolvedType = String(selectedBeerForRating?.type || ratingForm.typeQuery || '').trim()
    const resolvedStyle = String(selectedBeerForRating?.style || ratingForm.styleQuery || '').trim()

    if (!resolvedName || !resolvedBrewery || !resolvedType || !resolvedStyle) {
      setRatingError('Please provide name, brewery, type and style before saving.')
      return
    }

    const payload = {
      beer_id: Number(selectedBeerForRating?.id) || undefined,
      name: resolvedName,
      brewery: resolvedBrewery,
      type: resolvedType,
      style: resolvedStyle,
      ...validation.normalized,
    }

    setSavingRating(true)
    try {
      const response = await fetch(`${apiBaseUrl}/rate_beer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      })

      let responseBody = {}
      try {
        responseBody = await response.json()
      } catch {
        responseBody = {}
      }

      const apiMessage = responseBody?.details || responseBody?.detail || ''

      if (!response.ok) {
        const errorMessage = apiMessage || 'Could not save rating. Please try again.'
        setRatingError(errorMessage)
        setToastType('error')
        setToastMessage(errorMessage)
        return
      }

      await refreshBeerCaches(token)
      setRatingsVersion((current) => current + 1)
      setSheetHeight(COLLAPSED_SHEET_HEIGHT)
      setToastType('success')
      setToastMessage(apiMessage || 'Rating saved')
    } catch {
      setRatingError('Could not save rating. Please try again.')
      setToastType('error')
      setToastMessage('Could not save rating. Please try again.')
    } finally {
      setSavingRating(false)
    }
  }

  function toggleUser(userId) {
    setSelectedUserIds((current) => {
      const allSelected = current.length === users.length && users.length > 0
      if (allSelected) {
        return [userId]
      }

      return current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    })
  }

  function toggleSort(key) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection('desc')
      return
    }

    if (sortDirection === 'desc') {
      setSortDirection('asc')
      return
    }

    if (sortDirection === 'asc') {
      setSortDirection('none')
      setSortKey(null)
      return
    }

    setSortDirection('desc')
  }

  function renderSortIndicator(key) {
    if (sortKey !== key || sortDirection === 'none') {
      return '⇅'
    }
    return sortDirection === 'asc' ? '▴' : '▾'
  }

  function headerClass(key) {
    const active = sortKey === key && sortDirection !== 'none'
    return `sortable-header ${active ? 'active' : ''}`
  }

  return (
    <main className="page table-page" style={{ paddingBottom: `${sheetHeight + 18}px` }}>
      <div className="table-top-actions" aria-label="Page actions">
        <Link className="icon-link-button" to="/" aria-label="Home" title="Home">
          <span aria-hidden="true">🏠</span>
        </Link>
        <button type="button" className="icon-button" onClick={onSignOut} aria-label="Sign out" title="Sign out">
          <span aria-hidden="true">⏻</span>
        </button>
      </div>

      <section className="table-shell playful-card">
        <div className="table-header">
          <h1>Beer Ratings Table 🍺</h1>
        </div>

        {users.length > 0 && (
          <div className="user-filters" role="group" aria-label="Filter by users">
            <button
              type="button"
              className={`user-chip ${allUsersSelected ? 'selected' : ''}`}
              onClick={() => setSelectedUserIds(users.map((user) => user.id))}
              style={{
                borderColor: '#6f5ef5',
                backgroundColor: allUsersSelected ? '#6f5ef522' : '#ffffff',
                color: '#1f1b2d',
              }}
            >
              Select All
            </button>

            {users.map((user) => {
              const selected = selectedUserIds.includes(user.id)
              const color = getUserColor(user)

              return (
                <button
                  key={user.id}
                  type="button"
                  className={`user-chip ${selected ? 'selected' : ''}`}
                  onClick={() => toggleUser(user.id)}
                  style={{
                    borderColor: color,
                    backgroundColor: selected ? `${color}22` : '#ffffff',
                    color: selected ? '#1f1b2d' : '#3d3855',
                  }}
                >
                  {user.username}
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : averageData.length === 0 ? (
          <p className="empty-state">No ratings data found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="ratings-table">
              <thead>
                <tr>
                  <th className={headerClass('brewery')} onClick={() => toggleSort('brewery')}>
                    Brewery <span className="sort-indicator">{renderSortIndicator('brewery')}</span>
                  </th>
                  <th className={headerClass('name')} onClick={() => toggleSort('name')}>
                    Beer <span className="sort-indicator">{renderSortIndicator('name')}</span>
                  </th>
                  <th className={headerClass('rated_by')} onClick={() => toggleSort('rated_by')}>
                    Rated By <span className="sort-indicator">{renderSortIndicator('rated_by')}</span>
                  </th>
                  <th className={headerClass('avg_taste')} onClick={() => toggleSort('avg_taste')}>
                    <span className="rating-label">Taste</span>
                    <span className="rating-icon" aria-hidden="true">
                      👅
                    </span>{' '}
                    <span className="sort-indicator">{renderSortIndicator('avg_taste')}</span>
                  </th>
                  <th className={headerClass('avg_value')} onClick={() => toggleSort('avg_value')}>
                    <span className="rating-label">Value</span>
                    <span className="rating-icon" aria-hidden="true">
                      💷
                    </span>{' '}
                    <span className="sort-indicator">{renderSortIndicator('avg_value')}</span>
                  </th>
                  <th className={headerClass('avg_texture')} onClick={() => toggleSort('avg_texture')}>
                    <span className="rating-label">Texture</span>
                    <span className="rating-icon" aria-hidden="true">
                      🫧
                    </span>{' '}
                    <span className="sort-indicator">{renderSortIndicator('avg_texture')}</span>
                  </th>
                  <th className={headerClass('avg_packaging')} onClick={() => toggleSort('avg_packaging')}>
                    <span className="rating-label">Packaging</span>
                    <span className="rating-icon" aria-hidden="true">
                      📦
                    </span>{' '}
                    <span className="sort-indicator">{renderSortIndicator('avg_packaging')}</span>
                  </th>
                  <th className={headerClass('avg_overall')} onClick={() => toggleSort('avg_overall')}>
                    <span className="rating-label">Overall</span>
                    <span className="rating-icon" aria-hidden="true">
                      ⭐
                    </span>{' '}
                    <span className="sort-indicator">{renderSortIndicator('avg_overall')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAverageData.map((beer) => (
                  <tr key={beer.id}>
                    <td>{beer.brewery}</td>
                    <td>{beer.name}</td>
                    <td>
                      {selectedUsers.length === 0 ? (
                        '-'
                      ) : isMobile ? (
                        <span
                          className="contributors-pie"
                          style={getContributorsPieStyle(beer, selectedUsers)}
                          title={getRatedByDisplay(beer)}
                        />
                      ) : (
                        <div
                          className="contributors-grid"
                          style={{
                            gridTemplateColumns: `repeat(${selectedUsers.length}, minmax(0, 1fr))`,
                          }}
                        >
                          {selectedUsers.map((user) => {
                            const contributed = hasUserContributed(beer, user.username)
                            const color = getUserColor(user)

                            return (
                              <span
                                key={`${beer.id}-${user.id}`}
                                className={`contributor-block ${contributed ? 'active' : 'inactive'}`}
                                title={`${user.username}: ${contributed ? 'rated' : 'not rated'}`}
                                style={{
                                  borderColor: color,
                                  backgroundColor: contributed ? color : 'transparent',
                                  color: contributed ? '#ffffff' : color,
                                }}
                              >
                                {getUserShortLabel(user.username)}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </td>
                    <td style={getScoreCellStyle(beer.avg_taste, 100)}>{fmt(beer.avg_taste, isMobile)}</td>
                    <td style={getScoreCellStyle(beer.avg_value, 20)}>{fmt(beer.avg_value, isMobile)}</td>
                    <td style={getScoreCellStyle(beer.avg_texture, 10)}>{fmt(beer.avg_texture, isMobile)}</td>
                    <td style={getScoreCellStyle(beer.avg_packaging, 5)}>{fmt(beer.avg_packaging, isMobile)}</td>
                    <td style={getScoreCellStyle(beer.avg_overall, 100)}>{fmt(beer.avg_overall, isMobile)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className={`rating-sheet playful-card ${isDraggingSheet ? 'dragging' : ''} ${sheetHeight <= COLLAPSED_SHEET_HEIGHT + 2 ? 'collapsed' : ''}`}
        style={{ height: `${sheetHeight}px` }}
      >
        <button
          type="button"
          className="rating-sheet-handle"
          onPointerDown={onSheetPointerDown}
          onClick={onSheetHandleClick}
          aria-label="Drag rating panel"
        >
          <span className="rating-sheet-grip" />
          <span>Rate a Beer</span>
        </button>

        <form className="rating-sheet-form" onSubmit={submitRating}>
          <label htmlFor="sheet-beer-search">Name</label>
          <div className="search-field">
            <input
              id="sheet-beer-search"
              type="text"
              placeholder="Search beer"
              value={ratingForm.beerQuery}
              onFocus={() => setActiveSearchInput('beer')}
              onBlur={() => setTimeout(() => setActiveSearchInput((current) => (current === 'beer' ? null : current)), 100)}
              onChange={(event) => {
                setActiveSearchInput('beer')
                updateRatingField('beerQuery', event.target.value)
              }}
            />
            {activeSearchInput === 'beer' && filteredBeerSuggestions.length > 0 && (
              <ul className="search-suggestions" role="listbox" aria-label="Beer suggestions">
                {filteredBeerSuggestions.map((beer) => (
                  <li key={beer}>
                    <button
                      type="button"
                      className="search-suggestion-item"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        const selected = beerCatalog.find((candidate) => candidate.name === beer)
                        if (selected) {
                          applySelectedBeer(selected)
                        } else {
                          updateRatingField('beerQuery', beer)
                        }
                        setActiveSearchInput(null)
                      }}
                    >
                      {beer}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label htmlFor="sheet-brewery-search">Brewery</label>
          <div className="search-field">
            <input
              id="sheet-brewery-search"
              type="text"
              placeholder="Search brewery"
              value={ratingForm.breweryQuery}
              onFocus={() => setActiveSearchInput('brewery')}
              onBlur={() => setTimeout(() => setActiveSearchInput((current) => (current === 'brewery' ? null : current)), 100)}
              onChange={(event) => {
                setActiveSearchInput('brewery')
                updateRatingField('breweryQuery', event.target.value)
              }}
            />
            {activeSearchInput === 'brewery' && filteredBrewerySuggestions.length > 0 && (
              <ul className="search-suggestions" role="listbox" aria-label="Brewery suggestions">
                {filteredBrewerySuggestions.map((brewery) => (
                  <li key={brewery}>
                    <button
                      type="button"
                      className="search-suggestion-item"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        setRatingForm((current) => ({ ...current, breweryQuery: brewery }))
                        setActiveSearchInput(null)
                      }}
                    >
                      {brewery}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label htmlFor="sheet-style">Style</label>
          <div className="search-field">
            <input
              id="sheet-style"
              type="text"
              placeholder="Search style"
              value={ratingForm.styleQuery}
              onFocus={() => setActiveSearchInput('style')}
              onBlur={() => setTimeout(() => setActiveSearchInput((current) => (current === 'style' ? null : current)), 100)}
              onChange={(event) => {
                setActiveSearchInput('style')
                updateRatingField('styleQuery', event.target.value)
              }}
            />
            {activeSearchInput === 'style' && filteredStyleSuggestions.length > 0 && (
              <ul className="search-suggestions" role="listbox" aria-label="Style suggestions">
                {filteredStyleSuggestions.map((style) => (
                  <li key={style}>
                    <button
                      type="button"
                      className="search-suggestion-item"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        updateRatingField('styleQuery', style)
                        setActiveSearchInput(null)
                      }}
                    >
                      {style}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label>Type</label>
          <div className="type-select-row" role="group" aria-label="Beer type">
            {BEER_TYPE_OPTIONS.map((typeOption) => {
              const normalizedOption = normalizeBeerType(typeOption)
              const selected = normalizeBeerType(ratingForm.typeQuery) === normalizedOption

              return (
                <button
                  key={typeOption}
                  type="button"
                  className={`type-select-box ${selected ? 'selected' : ''}`}
                  onClick={() => updateRatingField('typeQuery', selected ? '' : typeOption)}
                >
                  {typeOption}
                </button>
              )
            })}
          </div>

          <p className="rating-sheet-match">
            {selectedBeerForRating
              ? `Selected: ${selectedBeerForRating.name} — ${selectedBeerForRating.brewery}`
              : `${matchedBeers.length} matching beers`}
          </p>

          <div className="rating-sheet-grid">
            <label>
              Taste (0-100)
              <div className="rating-score-row">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ratingForm.taste}
                  style={getRatingInputStyle(ratingForm.taste, 100)}
                  onChange={(event) => updateRatingField('taste', event.target.value)}
                />
                <ScaleHint value={ratingForm.taste} points={TASTE_SCALE_WORDS} />
              </div>
            </label>
            <label>
              Value (0-20)
              <div className="rating-score-row">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={ratingForm.value}
                  style={getRatingInputStyle(ratingForm.value, 20)}
                  onChange={(event) => updateRatingField('value', event.target.value)}
                />
                <ScaleHint value={ratingForm.value} points={VALUE_SCALE_WORDS} />
              </div>
            </label>
            <label>
              Texture (0-10)
              <div className="rating-score-row">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={ratingForm.texture}
                  style={getRatingInputStyle(ratingForm.texture, 10)}
                  onChange={(event) => updateRatingField('texture', event.target.value)}
                />
                <ScaleHint value={ratingForm.texture} points={TEXTURE_SCALE_WORDS} />
              </div>
            </label>
            <label>
              Packaging (0-5)
              <div className="rating-score-row">
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={ratingForm.packaging}
                  style={getRatingInputStyle(ratingForm.packaging, 5)}
                  onChange={(event) => updateRatingField('packaging', event.target.value)}
                />
                <ScaleHint value={ratingForm.packaging} points={PACKAGING_SCALE_WORDS} />
              </div>
            </label>
          </div>

          <div className="rating-sheet-actions">
            <button type="submit" disabled={savingRating}>
              {savingRating ? 'Saving...' : 'Save Rating'}
            </button>
            {ratingError && <p className="error">{ratingError}</p>}
          </div>
        </form>
      </section>

      {toastMessage && <div className={`rating-toast ${toastType}`}>{toastMessage}</div>}

    </main>
  )
}

export default TablePage
