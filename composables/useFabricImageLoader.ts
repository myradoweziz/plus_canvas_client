import { mediaUrlForCanvas } from '~/utils/mediaUrl'

/** Загрузка картинки для Fabric (прокси + Bearer при необходимости). */
export function useFabricImageLoader() {
	const { uploadAuthHeaders } = useMediaUploadTemp()

	const loadHtmlImage = async (rawUrl: string): Promise<HTMLImageElement> => {
		const raw = String(rawUrl ?? '').trim()
		if (raw.startsWith('/') && !raw.startsWith('/media-proxy')) {
			return await new Promise((resolve, reject) => {
				const el = new Image()
				el.crossOrigin = 'anonymous'
				el.onload = () => resolve(el)
				el.onerror = () => reject(new Error('Görsel yüklenemedi'))
				el.src = raw
			})
		}

		const src = mediaUrlForCanvas(raw)
		const headers = uploadAuthHeaders()
		const res = await fetch(src, { headers, credentials: 'include' })
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
