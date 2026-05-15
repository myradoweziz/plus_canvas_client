/** В dev проксируем API/storage через same-origin — Fabric и canvas без CORS. */
export function mediaUrlForCanvas(rawUrl: string): string {
	const raw = String(rawUrl ?? '').trim()
	if (!raw || !import.meta.client || !import.meta.dev) return raw

	const base = String(useRuntimeConfig().public.baseUrl ?? '')
		.trim()
		.replace(/\/+$/, '')
	if (!base) return raw

	const toProxy = (pathname: string, search = '') => {
		const path = pathname.startsWith('/') ? pathname : `/${pathname}`
		return `/media-proxy${path}${search}`
	}

	if (raw.startsWith('/')) {
		return toProxy(raw)
	}

	try {
		const remote = new URL(raw)
		const apiBase = new URL(base)
		if (remote.origin === apiBase.origin) {
			return toProxy(remote.pathname, remote.search)
		}
	} catch {
		/* noop */
	}
	return raw
}
