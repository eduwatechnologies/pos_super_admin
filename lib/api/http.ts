export function normalizeBaseUrl(raw: string) {
  const trimmed = raw.replace(/\/+$/, '')
  if (trimmed.endsWith('/api/v1')) return trimmed
  return `${trimmed}/api/v1`
}

