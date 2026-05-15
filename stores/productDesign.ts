import { defineStore } from 'pinia'

import type { TempDesignImage } from '~/utils/types'

/** Yükleme oturumu: katalog → ürün sayfası / Fabric. */
export const useProductDesignStore = defineStore('productDesign', () => {
	const productId = ref<string | null>(null)
	const images = ref<TempDesignImage[]>([])
	const activeImageIndex = ref(0)

	const setSession = (id: string | number, imgs: TempDesignImage[]) => {
		productId.value = String(id)
		images.value = imgs.filter((i) => i.url?.trim())
		activeImageIndex.value = 0
	}

	const getSessionImages = (id: string | number): TempDesignImage[] => {
		if (productId.value !== String(id)) return []
		return [...images.value]
	}

	const setActiveImageIndex = (index: number) => {
		if (index < 0 || index >= images.value.length) return
		activeImageIndex.value = index
	}

	const getActiveImage = (id: string | number): TempDesignImage | null => {
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
		clearSession
	}
})
