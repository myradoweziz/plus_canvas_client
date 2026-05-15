import type { TempDesignImage } from '~/utils/types'

const STORAGE_KEY = 'pluscanvas:product-design-session'

export type ProductDesignStoredSession = {
	productId: string
	images: TempDesignImage[]
	activeImageIndex: number
}

export function loadProductDesignSession(): ProductDesignStoredSession | null {
	if (!import.meta.client) return null
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		const data = JSON.parse(raw) as ProductDesignStoredSession
		if (!data?.productId || !Array.isArray(data.images)) return null
		return {
			productId: String(data.productId),
			images: data.images.filter((i) => i?.url?.trim()),
			activeImageIndex: Math.max(0, Number(data.activeImageIndex) || 0)
		}
	} catch {
		return null
	}
}

export function saveProductDesignSession(session: ProductDesignStoredSession): void {
	if (!import.meta.client) return
	sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearProductDesignSession(): void {
	if (!import.meta.client) return
	sessionStorage.removeItem(STORAGE_KEY)
}
