/** Уже проксированный путь — не добавлять `/media-proxy` повторно. */
function canvasMediaUrlAlreadyProxied(raw: string): boolean {
	if (raw.startsWith('/media-proxy')) return true
	try {
		return new URL(raw).pathname.startsWith('/media-proxy')
	} catch {
		return false
	}
}

function toMediaProxyPath(pathname: string, search = ''): string {
	const path = pathname.startsWith('/') ? pathname : `/${pathname}`
	return `/media-proxy${path}${search}`
}

function shouldProxyApiMediaUrl(raw: string, apiBase: string): boolean {
	if (raw.startsWith('/api/')) return true
	if (!apiBase) return false

	try {
		const remote = new URL(raw)
		const api = new URL(apiBase)
		if (remote.origin === api.origin) return true
		if (remote.hostname === api.hostname) return true
	} catch {
		return false
	}

	if (import.meta.client) {
		try {
			const remote = new URL(raw, window.location.origin)
			return remote.origin !== window.location.origin
		} catch {
			return false
		}
	}

	return false
}

/**
 * Проксируем медиа API через same-origin `/media-proxy` — иначе CORS при
 * credentials + Access-Control-Allow-Origin: * (разные порты 80 / 8000).
 */
export function mediaUrlForCanvas(rawUrl: string): string {
	const raw = String(rawUrl ?? '').trim()
	if (!raw || !import.meta.client) return raw

	if (canvasMediaUrlAlreadyProxied(raw)) {
		if (raw.startsWith('/')) return raw
		try {
			const u = new URL(raw)
			return `${u.pathname}${u.search}`
		} catch {
			return raw
		}
	}

	const base = String(useRuntimeConfig().public.baseUrl ?? '')
		.trim()
		.replace(/\/+$/, '')

	if (raw.startsWith('/')) {
		if (raw.startsWith('/api/') && base) return toMediaProxyPath(raw)
		return raw
	}

	if (base && shouldProxyApiMediaUrl(raw, base)) {
		try {
			const remote = new URL(raw)
			return toMediaProxyPath(remote.pathname, remote.search)
		} catch {
			/* noop */
		}
	}

	return raw
}
