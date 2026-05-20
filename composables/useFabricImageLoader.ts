import { mediaUrlForCanvas } from '~/utils/mediaUrl'

/** Загрузка картинки для Fabric (same-origin /media-proxy + Bearer при необходимости). */
export function useFabricImageLoader() {
	const { uploadAuthHeaders } = useMediaUploadTemp()

	const loadHtmlImage = async (rawUrl: string): Promise<HTMLImageElement> => {
		const raw = String(rawUrl ?? '').trim()
		if (!raw) throw new Error('Görsel adresi boş')

		if (raw.startsWith('blob:') || raw.startsWith('data:')) {
			return await new Promise((resolve, reject) => {
				const el = new Image()
				el.onload = () => resolve(el)
				el.onerror = () => reject(new Error('Görsel yüklenemedi'))
				el.src = raw
			})
		}

		const src = mediaUrlForCanvas(raw)
		const headers = uploadAuthHeaders()
		const hasAuth = Boolean(headers.Authorization)
		const isSameOrigin =
			src.startsWith('/') ||
			(typeof window !== 'undefined' && src.startsWith(window.location.origin))

		const fetchInit: RequestInit = { headers }
		if (isSameOrigin) {
			fetchInit.credentials = hasAuth ? 'include' : 'same-origin'
		} else {
			// cross-origin: credentials + ACAO:* ломает preflight
			fetchInit.credentials = hasAuth ? 'include' : 'omit'
		}

		const res = await fetch(src, fetchInit)
		if (!res.ok) {
			throw new Error(`Görsel yüklenemedi (${res.status})`)
		}
		const blob = await res.blob()
		const blobUrl = URL.createObjectURL(blob)
		return await new Promise((resolve, reject) => {
			const el = new Image()
			el.crossOrigin = 'anonymous'
			el.onload = () => resolve(el)
			el.onerror = () => {
				URL.revokeObjectURL(blobUrl)
				reject(new Error('Görsel decode edilemedi'))
			}
			el.src = blobUrl
		})
	}

	return { loadHtmlImage }
}
