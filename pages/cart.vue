<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import { useCartStore } from '~/stores/cart'
	import { cartItemHasFormatOptions } from '~/utils/cartItemPreview'

	const cartStore = useCartStore()

	const couponCode = ref('')

	const applyCoupon = async () => {
		await cartStore.applyCoupon(couponCode.value)
	}

	const removeCoupon = () => {
		cartStore.removeCoupon()
		couponCode.value = ''
	}

	watch(() => cartStore.appliedCoupon, (val) => {
		if (val) {
			couponCode.value = val
		}
	}, { immediate: true })

	const formatPrice = (price: any) => {
		return Number(price || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
	}

	onMounted(() => {
		cartStore.fetchCart()
	})

	const isDeleteModalOpen = ref(false)
	const deletingItemId = ref<number | null>(null)

	const confirmDeleteCartItem = (id: number) => {
		deletingItemId.value = id
		isDeleteModalOpen.value = true
	}

	const deleteCartItem = () => {
		if (deletingItemId.value) {
			cartStore.removeFromCart(deletingItemId.value)
			isDeleteModalOpen.value = false
		}
	}
</script>

<template>
	<div class="bg-gray-50 min-h-screen py-8 md:py-12">
		<div class="container mx-auto px-4 max-w-[1400px]">
			<div class="mb-8">
				<h1 class="text-3xl md:text-4xl font-extrabold text-gray-900">Sepetim</h1>
				<p class="text-gray-500 mt-2" v-if="cartStore.cartItems.length > 0">
					Sepetinizde {{ cartStore.cartItems.reduce((acc, item) => acc + item.quantity, 0) }} ürün bulunuyor.
				</p>
			</div>

			<!-- Empty State -->
			<div
				v-if="cartStore.cartItems.length === 0"
				class="bg-white rounded-3xl shadow-sm p-12 text-center flex flex-col items-center"
			>
				<div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
					<Icon name="basket" class="w-12 h-12" />
				</div>
				<h2 class="text-2xl font-bold text-gray-900 mb-2">Sepetiniz şu an boş</h2>
				<p class="text-gray-500 mb-8 max-w-md">
					Aradığınız ürünleri bulmak için kategorilerimize göz atabilir veya hemen alışverişe başlayabilirsiniz.
				</p>
				<nuxt-link
					to="/"
					class="bg-[#1853a0] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#134280] transition-colors shadow-lg shadow-[#1853a0]/20"
				>
					Alışverişe Başla
				</nuxt-link>
			</div>

			<!-- Cart Content -->
			<div v-else class="flex flex-col lg:flex-row gap-8">
				<!-- Left Column: Items -->
				<div class="flex-1 flex flex-col gap-4">
					<!-- Free Shipping Progress -->
					<div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-2">
						<div class="flex justify-between items-center mb-3">
							<div class="flex items-center gap-2">
								<div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
									<Icon name="checkCircle" class="w-4 h-4" v-if="cartStore.remainingForFreeShipping === 0" />
									<Icon name="car" class="w-4 h-4" v-else />
								</div>
								<span class="text-gray-700 font-medium text-[15px]">
									<template v-if="cartStore.remainingForFreeShipping === 0">
										<span class="text-emerald-600 font-bold">Tebrikler!</span> Ücretsiz kargo kazandınız.
									</template>
									<template v-else>
										Ücretsiz kargo için
										<span class="font-bold text-[#e11d48]">{{ formatPrice(cartStore.remainingForFreeShipping) }}₺</span>
										kaldı
									</template>
								</span>
							</div>
						</div>
						<div class="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
							<div
								class="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700 ease-out"
								:style="{ width: `${cartStore.freeShippingProgress}%` }"
							></div>
						</div>
					</div>

					<div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 sm:p-4">
						<div
							v-for="(item, index) in cartStore.cartItems"
							:key="item.id"
							class="flex gap-4 sm:gap-6 p-4 rounded-2xl bg-white relative group"
							:class="{ 'border-b border-gray-100 rounded-none': index !== cartStore.cartItems.length - 1 }"
						>
							<!-- Product Image -->
							<div
								class="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100"
							>
								<CartItemThumb :item="item" />
							</div>

							<!-- Info -->
							<div class="flex-1 flex flex-col min-w-0">
								<div class="flex justify-between items-start gap-4">
									<h4 class="font-bold text-gray-900 text-base sm:text-lg leading-snug">
										<nuxt-link
											:to="`/products/${item.canvas_product?.slug}`"
											class="hover:text-[#1853a0] transition-colors"
										>
											{{ item.canvas_product?.name }}
										</nuxt-link>
									</h4>
									<button
										@click="confirmDeleteCartItem(item.id)"
										class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
										title="Sil"
									>
										<Icon name="trash" class="w-4 h-4" />
									</button>
								</div>

								<div class="text-sm text-gray-500 mt-2 mb-auto flex flex-wrap items-center gap-y-1">
									<span v-if="item.resolved_options?.canvas_format"
										>Format: {{ item.resolved_options.canvas_format.name }}</span
									>
									<span
										v-if="item.resolved_options?.canvas_size"
										class="before:content-['•'] before:mx-2 before:text-gray-300"
										>Boyut: {{ item.resolved_options.canvas_size.display_name }}</span
									>
									<span
										v-if="item.resolved_options?.canvas_frame"
										class="before:content-['•'] before:mx-2 before:text-gray-300"
										>Çerçeve: {{ item.resolved_options.canvas_frame.name }}</span
									>
									<span
										v-else-if="cartItemHasFormatOptions(item)"
										class="before:content-['•'] before:mx-2 before:text-gray-300"
										>Çerçevesiz</span
									>
								</div>

								<div class="flex flex-col sm:flex-row sm:items-end justify-between mt-4 gap-4">
									<div class="font-bold text-gray-900 text-xl sm:text-2xl">
										{{ formatPrice((item.unit_price || 0) * item.quantity) }}₺
										<span
											class="text-sm font-medium text-gray-400 line-through ml-2"
											v-if="(item.old_price && item.old_price > item.unit_price) || item.canvas_product?.discount > 0 || item.canvas_product?.calculated_discount"
										>
											{{ formatPrice((item.old_price || item.canvas_product?.price || 0) * item.quantity) }}₺
										</span>
									</div>

									<!-- Quantity Control -->
									<div class="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100 w-fit">
										<button
											@click="cartStore.updateQuantity(item.id, item.quantity - 1)"
											class="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm rounded-lg transition-all"
										>
											<Icon name="minus" class="w-3 h-3" />
										</button>
										<span class="w-10 text-center font-bold text-gray-900">
											{{ item.quantity }}
										</span>
										<button
											@click="cartStore.updateQuantity(item.id, item.quantity + 1)"
											class="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm rounded-lg transition-all"
										>
											<Icon name="plus" class="w-3 h-3" />
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
					<!-- Recommended -->
					<div class="mt-4 pt-6" v-if="cartStore.cartItems.length > 0 && cartStore.recommendedProducts.length > 0">
						<h3 class="text-xl font-bold text-gray-900 mb-6">Bunları da beğenebilirsiniz</h3>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<nuxt-link
								v-for="prod in cartStore.recommendedProducts"
								:key="prod.id"
								:to="`/products/${prod.slug}`"
								class="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col gap-3 group cursor-pointer hover:shadow-md transition-shadow"
							>
								<div class="aspect-square rounded-xl bg-gray-50 overflow-hidden relative">
									<img
										v-if="prod.image?.url"
										:src="prod.image.url"
										:alt="prod.name"
										class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
									/>
									<div v-else class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
								</div>
								<div>
									<h4
										class="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-[#1853a0] transition-colors h-[40px]"
									>
										{{ prod.name }}
									</h4>
									<div class="mt-2 font-bold text-[#e11d48] text-lg">{{ formatPrice(prod.price) }}₺</div>
								</div>
							</nuxt-link>
						</div>
					</div>
				</div>

				<!-- Right Column: Summary -->
				<div class="w-full lg:w-[380px] shrink-0">
					<div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
						<h3 class="text-lg font-bold text-gray-900 mb-6">Sipariş Özeti</h3>

						<!-- Coupon -->
						<div class="mb-6">
							<label class="text-sm font-semibold text-gray-700 block mb-2">İndirim Kodu</label>
							<div class="flex gap-2">
								<div class="relative flex-1">
									<div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
										<Icon name="ticket" class="w-4 h-4" />
									</div>
									<input
										v-model="couponCode"
										:disabled="cartStore.isApplyingCoupon || !!cartStore.appliedCoupon"
										type="text"
										placeholder="Kodu giriniz"
										class="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#1853a0]/20 focus:border-[#1853a0] transition-all outline-none"
									/>
								</div>
								<button
									v-if="!cartStore.appliedCoupon"
									@click="applyCoupon"
									:disabled="cartStore.isApplyingCoupon || !couponCode"
									class="bg-[#111827] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{{ cartStore.isApplyingCoupon ? 'Uygulanıyor...' : 'Uygula' }}
								</button>
								<button
									v-else
									@click="removeCoupon"
									class="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
								>
									İptal Et
								</button>
							</div>
						</div>

						<div class="h-px bg-gray-100 w-full mb-6"></div>

						<!-- Totals -->
						<div class="flex flex-col gap-3 text-[15px] text-gray-600">
							<div class="flex justify-between items-center">
								<span>Ara Toplam</span>
								<span class="font-bold text-gray-900">{{ formatPrice(cartStore.subtotal) }}₺</span>
							</div>
							<div v-if="cartStore.couponDiscount > 0" class="flex justify-between items-center text-emerald-600">
								<span>İndirim ({{ cartStore.appliedCoupon }})</span>
								<span class="font-bold">-{{ formatPrice(cartStore.couponDiscount) }}₺</span>
							</div>
							<div class="flex justify-between items-center">
								<span>Kargo</span>
								<span
									class="font-bold"
									:class="cartStore.subtotal >= cartStore.freeShippingThreshold ? 'text-emerald-600' : 'text-gray-900'"
								>
									{{
										cartStore.subtotal >= cartStore.freeShippingThreshold
											? 'Ücretsiz'
											: `${formatPrice(cartStore.shipping)}₺`
									}}
								</span>
							</div>

							<div class="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
								<span class="font-extrabold text-gray-900 text-lg">Toplam</span>
								<span class="font-extrabold text-[#e11d48] text-2xl">{{ formatPrice(cartStore.finalTotal) }}₺</span>
							</div>
						</div>

						<!-- Checkout Button -->
						<NuxtLink
							to="/checkout"
							class="w-full mt-4 bg-[#2B7FFF] text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group shadow-sm"
						>
							Ödemeye Geç
							<Icon name="arrowRight" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
						</NuxtLink>
						<p class="text-center text-xs text-gray-400 font-medium mt-4 flex items-center justify-center gap-1.5">
							<Icon name="checkCircle" class="w-3.5 h-3.5" />
							256-bit SSL ile güvenli ödeme
						</p>
					</div>
				</div>
			</div>
		</div>

		<ConfirmModal
			:is-open="isDeleteModalOpen"
			title="Ürünü Sil"
			message="Bu ürünü sepetinizden silmek istediğinize emin misiniz?"
			@confirm="deleteCartItem"
			@cancel="isDeleteModalOpen = false"
		/>
	</div>
</template>
