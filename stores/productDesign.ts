import { defineStore } from 'pinia'

import type { TempDesignImage } from '~/utils/types'
import {
	clearProductDesignSession,
	loadProductDesignSession,
	saveProductDesignSession
} from '~/utils/productDesignSessionStorage'

/** Yükleme oturumu: katalog → ürün sayfası / Fabric. */
export const useProductDesignStore = defineStore('productDesign', () => {
	const productId = ref<string | null>(null)
	const images = ref<TempDesignImage[]>([])
	const activeImageIndex = ref(0)
	let hydratedFromStorage = false

	const persistSession = () => {
		if (!import.meta.client) return
		if (!productId.value || images.value.length === 0) {
			clearProductDesignSession()
			return
		}
		saveProductDesignSession({
			productId: productId.value,
			images: images.value,
			activeImageIndex: activeImageIndex.value
		})
	}

	const hydrateFromStorage = () => {
		if (!import.meta.client || hydratedFromStorage) return
		hydratedFromStorage = true
		const stored = loadProductDesignSession()
		if (!stored) return
		productId.value = stored.productId
		images.value = stored.images
		activeImageIndex.value = Math.min(
			stored.activeImageIndex,
			Math.max(0, stored.images.length - 1)
		)
	}

	const setSession = (id: string | number, imgs: TempDesignImage[]) => {
		productId.value = String(id)
		images.value = imgs.filter((i) => i.url?.trim())
		activeImageIndex.value = 0
		persistSession()
	}

	const getSessionImages = (id: string | number): TempDesignImage[] => {
		hydrateFromStorage()
		if (productId.value !== String(id)) return []
		return [...images.value]
	}

	const setActiveImageIndex = (index: number) => {
		if (index < 0 || index >= images.value.length) return
		activeImageIndex.value = index
		persistSession()
	}

	const getActiveImage = (id: string | number): TempDesignImage | null => {
		hydrateFromStorage()
		if (productId.value !== String(id) || images.value.length === 0) return null
		const idx = Math.min(activeImageIndex.value, images.value.length - 1)
		return images.value[idx] ?? null
	}

	/** @deprecated use getSessionImages */
	const consumePrimaryImage = (id: string | number): TempDesignImage | null => {
		const list = getSessionImages(id)
		return list[0] ?? null
	}

	const clearSession = () => {
		productId.value = null
		images.value = []
		activeImageIndex.value = 0
		clearProductDesignSession()
	}

	const hasSessionFor = (id: string | number): boolean => {
		hydrateFromStorage()
		return productId.value === String(id) && images.value.length > 0
	}

	return {
		productId,
		images,
		activeImageIndex,
		setSession,
		getSessionImages,
		setActiveImageIndex,
		getActiveImage,
		consumePrimaryImage,
		clearSession,
		hasSessionFor,
		hydrateFromStorage
	}
})
