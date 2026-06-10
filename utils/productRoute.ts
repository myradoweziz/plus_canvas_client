export function normalizeRouteParam(value: string | string[] | undefined): string {
	const raw = Array.isArray(value) ? value[0] : value
	const s = String(raw ?? '').trim()
	return s ? decodeURIComponent(s) : ''
}

export function productApiPath(slug: string): string {
	const s = String(slug ?? '').trim()
	return s ? `/api/canvas-products/${encodeURIComponent(s)}` : '/api/canvas-products'
}

export function productPagePath(slug: string): string {
	return `/products/${encodeURIComponent(String(slug ?? '').trim())}`
}

export function editorPagePath(slug: string): string {
	return `/products/editor/${encodeURIComponent(String(slug ?? '').trim())}`
}
