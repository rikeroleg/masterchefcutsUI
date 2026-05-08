import { useEffect } from 'react'

export const SITE_URL = 'https://masterchefcuts.com'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`
export const DEFAULT_TITLE = 'MasterChef Cuts - Farm-Fresh Meat Marketplace'
export const DEFAULT_DESCRIPTION = 'Claim primal cuts from whole animals raised by local farmers near you.'

function toAbsoluteUrl(value) {
  if (!value) return SITE_URL
  if (/^https?:\/\//i.test(value)) return value
  return new URL(value, SITE_URL).href
}

function upsertMeta(selector, attributes, content) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function syncJsonLd(schema) {
  const existing = document.getElementById('seo-jsonld')
  if (!schema || (Array.isArray(schema) && schema.length === 0)) {
    existing?.remove()
    return
  }

  const payload = Array.isArray(schema) ? schema : [schema]
  const next = existing || document.createElement('script')
  next.id = 'seo-jsonld'
  next.type = 'application/ld+json'
  next.text = JSON.stringify(payload.length === 1 ? payload[0] : payload)
  if (!existing) document.head.appendChild(next)
}

export function useSEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_OG_IMAGE,
  url,
  type = 'website',
  noIndex = false,
  schema,
}) {
  useEffect(() => {
    const absoluteUrl = toAbsoluteUrl(url || window.location.pathname + window.location.search)
    const absoluteImage = toAbsoluteUrl(image)
    const robots = noIndex ? 'noindex, nofollow' : 'index, follow'

    document.title = title
    upsertMeta('meta[name="description"]', { name: 'description' }, description)
    upsertMeta('meta[name="robots"]', { name: 'robots' }, robots)
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title)
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description)
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type)
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, absoluteUrl)
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, absoluteImage)
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, 'MasterChef Cuts')
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title)
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description)
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, absoluteImage)
    upsertLink('canonical', absoluteUrl)
    syncJsonLd(schema)
  }, [title, description, image, url, type, noIndex, schema])
}
