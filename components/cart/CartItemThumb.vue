<script setup lang="ts">
	import { getCartItemThumbSrc } from '~/utils/cartItemPreview'
	import { useCartStore } from '~/stores/cart'
	import { useWishlistStore } from '~/stores/wishlist'

	const props = defineProps<{
		item: {
			id: number
			preview_url?: string | null
			options?: Record<string, unknown> | null
			canvas_product?: { name?: string; image?: unknown } | null
			resolved_options?: {
				canvas_format?: { image_url?: string | null; name?: string } | null
			} | null
		}
	}>()

	const cartStore = useCartStore()
	const wishlistStore = useWishlistStore()

	const thumbSrc = computed(() => {
		const cachedCart = cartStore.getItemPreview(props.item.id)
		if (cachedCart) return cachedCart

		const cachedWishlist = wishlistStore.getItemPreview(props.item.id)
		if (cachedWishlist) return cachedWishlist

		return getCartItemThumbSrc(props.item)
	})
</script>

<template>
	<img
		v-if="thumbSrc"
		:src="thumbSrc"
		:alt="item.canvas_product?.name ?? 'Ürün önizlemesi'"
		class="w-full h-full object-contain bg-[#f3f4f6] p-1"
		loading="lazy"
	/>
</template>
