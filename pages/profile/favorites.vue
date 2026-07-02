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
		return Number(price || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
	}

	onMounted(() => {
		wishlistStore.fetchWishlist()
	})

	const moveToCart = (item: any) => {
		cartStore.addToCart(item.canvas_product_id, 1, item.options)
		wishlistStore.removeFromWishlist(item.id)
	}

	const isDeleteModalOpen = ref(false)
	const deletingItemId = ref<number | null>(null)

	const confirmDeleteFavorite = (id: number) => {
		deletingItemId.value = id
		isDeleteModalOpen.value = true
	}

	const deleteFavorite = () => {
		if (deletingItemId.value) {
			wishlistStore.removeFromWishlist(deletingItemId.value)
			isDeleteModalOpen.value = false
		}
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

		<!-- Wishlist Items Grid -->
		<div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
			<div
				v-for="item in wishlistStore.wishlistItems"
				:key="item.id"
				class="bg-white rounded-2xl border border-gray-100 shadow-[0px_4px_15px_0px_#0000000A] overflow-hidden flex flex-col group relative transition-all duration-300 hover:shadow-md hover:border-gray-200 p-3"
			>
				<nuxt-link
					:to="item.canvas_product?.slug ? `/products/${item.canvas_product.slug}` : '#'"
					class="w-full aspect-[4/5] rounded-xl overflow-hidden relative bg-gray-50 block shrink-0"
				>
					<CartItemThumb :item="item" />
					
					<!-- Red Heart Button -->
					<button
						@click.prevent="confirmDeleteFavorite(item.id)"
						class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all z-10 hover:scale-110"
						title="Favoriden Çıkar"
					>
						<Icon name="heart" class="w-5 h-5 text-[#FF2B2B] fill-[#FF2B2B]" />
					</button>
				</nuxt-link>

				<!-- Info -->
				<div class="flex flex-col pt-3 px-1">
					<nuxt-link
						:to="item.canvas_product?.slug ? `/products/${item.canvas_product.slug}` : '#'"
						class="text-base font-bold text-[#101828] truncate block hover:text-[#2B7FFF] transition-colors"
					>
						{{ item.canvas_product?.name || 'Ürün' }}
					</nuxt-link>
					
					<div class="text-lg font-bold text-[#101828] mt-1">
						{{ formatPrice(item.unit_price || item.canvas_product?.price) }}₺
					</div>
				</div>
			</div>
		</div>

		<ConfirmModal
			:is-open="isDeleteModalOpen"
			title="Favoriyi Sil"
			message="Bu ürünü favorilerinizden silmek istediğinize emin misiniz?"
			@confirm="deleteFavorite"
			@cancel="isDeleteModalOpen = false"
		/>
	</section>
</template>
