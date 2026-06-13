<script setup lang="ts">
	import { useWishlistStore } from '~/stores/wishlist'
	import { useCartStore } from '~/stores/cart'
	import Icon from '~/utils/ui/Icon.vue'

	definePageMeta({
		layout: 'account'
	})

	useHead({ title: 'Favorilerim | PlusCanvas' })

	const wishlistStore = useWishlistStore()
	const cartStore = useCartStore()

	const formatPrice = (price: any) => {
		return Number(price || 0).toFixed(2).replace('.00', '')
	}

	onMounted(() => {
		wishlistStore.fetchWishlist()
	})

	const moveToCart = (item: any) => {
		cartStore.addToCart(item.canvas_product_id, 1, item.options)
		wishlistStore.removeFromWishlist(item.id)
	}
</script>

<template>
	<section class="bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] p-6 md:p-8 min-h-[320px] h-full flex flex-col">
		<h2 class="text-2xl font-bold text-[#101828] mb-6">Favorilerim ({{ wishlistStore.wishlistItems.length }})</h2>

		<!-- Empty State -->
		<div v-if="wishlistStore.wishlistItems.length === 0" class="flex-1 flex flex-col items-center justify-center text-center">
			<div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
				<Icon name="favorite" class="w-10 h-10" />
			</div>
			<p class="text-gray-500 mb-6">Favori listeniz şu an boş.</p>
			<nuxt-link
				to="/"
				class="bg-[#1853a0] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#134280] transition-colors"
			>
				Alışverişe Başla
			</nuxt-link>
		</div>

		<!-- Wishlist Items -->
		<div v-else class="flex flex-col gap-4">
			<div
				v-for="(item, index) in wishlistStore.wishlistItems"
				:key="item.id"
				class="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 rounded-2xl bg-white relative group border border-gray-100 shadow-sm"
			>
				<!-- Product Image -->
				<div class="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
					<img
						v-if="item.canvas_product?.image?.url"
						:src="item.canvas_product.image.url"
						:alt="item.canvas_product?.name"
						class="w-full h-full object-cover"
					/>
				</div>

				<!-- Info -->
				<div class="flex-1 flex flex-col min-w-0">
					<div class="flex justify-between items-start gap-4">
						<h4 class="font-bold text-gray-900 text-base sm:text-lg leading-snug">
							<nuxt-link :to="`/products/${item.canvas_product?.slug}`" class="hover:text-[#1853a0] transition-colors">
								{{ item.canvas_product?.name }}
							</nuxt-link>
						</h4>
						<button
							@click="wishlistStore.removeFromWishlist(item.id)"
							class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
							title="Sil"
						>
							<Icon name="trash" class="w-4 h-4" />
						</button>
					</div>
					
					<div class="text-sm text-gray-500 mt-2 mb-auto flex flex-wrap items-center gap-y-1">
						<span v-if="item.resolved_options?.canvas_format">Format: {{ item.resolved_options.canvas_format.name }}</span>
						<span v-if="item.resolved_options?.canvas_size" class="before:content-['•'] before:mx-2 before:text-gray-300">Boyut: {{ item.resolved_options.canvas_size.display_name }}</span>
						<span v-if="item.resolved_options?.canvas_frame" class="before:content-['•'] before:mx-2 before:text-gray-300">Çerçeve: {{ item.resolved_options.canvas_frame.name }}</span>
						<span v-else class="before:content-['•'] before:mx-2 before:text-gray-300">Çerçevesiz</span>
					</div>

					<div class="flex flex-col sm:flex-row sm:items-end justify-between mt-4 gap-4">
						<div class="font-bold text-gray-900 text-xl sm:text-2xl">
							{{ formatPrice(item.unit_price || item.canvas_product?.price) }}₺
							<span class="text-sm font-medium text-gray-400 line-through ml-2" v-if="item.canvas_product?.discount > 0">
								{{ formatPrice(item.canvas_product.price) }}₺
							</span>
						</div>
						
						<!-- Add to Cart Button -->
						<button
							@click="moveToCart(item)"
							class="bg-[#1853a0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#134280] transition-colors flex items-center gap-2 w-fit"
						>
							<Icon name="basket" class="w-4 h-4" />
							Sepete Ekle
						</button>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
