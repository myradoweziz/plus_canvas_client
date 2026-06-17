<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCartStore } from '~/stores/cart'
import { cartItemHasFormatOptions } from '~/utils/cartItemPreview'
import Icon from '~/utils/ui/Icon.vue'

const cartStore = useCartStore()

const formatPrice = (price: any) => {
	return Number(price || 0).toFixed(2).replace('.00', '')
}

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

</script>

<template>
	<Teleport to="body">
		<!-- Backdrop -->
		<Transition name="fade">
			<div
				v-if="cartStore.isCartOpen"
				class="fixed inset-0 bg-black/50 z-[100]"
				@click="cartStore.closeCart"
			></div>
		</Transition>

		<!-- Drawer -->
		<Transition name="slide-right">
			<div
				v-if="cartStore.isCartOpen"
				class="fixed top-0 right-0 h-full w-[400px] max-w-full bg-white shadow-2xl z-[110] flex flex-col"
			>
				<!-- Header -->
				<div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="text-[#1853a0]">
							<Icon name="basket" class="w-6 h-6" />
						</div>
						<h2 class="text-xl font-bold text-gray-900">Sepetim</h2>
					</div>
					<button
						class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
						@click="cartStore.closeCart"
					>
						<Icon name="close" class="w-5 h-5" />
					</button>
				</div>

				<!-- Free Shipping Progress -->
				<div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
					<div class="flex justify-between items-center mb-2 text-[13px]">
						<span class="text-gray-600">
							Ücretsiz kargo için <span class="font-bold text-[#e11d48]">{{ formatPrice(cartStore.remainingForFreeShipping) }}₺</span> kaldı
						</span>
					</div>
					<div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
						<div
							class="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
							:style="{ width: `${cartStore.freeShippingProgress}%` }"
						></div>
					</div>
				</div>

				<!-- Body (Scrollable) -->
				<div class="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col gap-6">
					
					<!-- Empty State -->
					<div v-if="cartStore.cartItems.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
						<div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
							<Icon name="basket" class="w-10 h-10" />
						</div>
						<p class="text-gray-500 mb-6">Sepetiniz şu an boş.</p>
						<button
							@click="cartStore.closeCart"
							class="bg-[#1853a0] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#134280] transition-colors"
						>
							Alışverişe Başla
						</button>
					</div>

					<!-- Cart Items -->
					<div v-else class="flex flex-col gap-4">
						<div
							v-for="item in cartStore.cartItems"
							:key="item.id"
							class="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm relative group"
						>
							<!-- Product Image -->
							<div class="w-[80px] h-[80px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
								<CartItemThumb :item="item" />
							</div>

							<!-- Info -->
							<div class="flex-1 flex flex-col min-w-0">
								<div class="flex justify-between items-start gap-2">
									<h4 class="font-bold text-gray-900 text-sm leading-snug truncate pr-6">
										{{ item.canvas_product?.name }}
									</h4>
									<button
										@click="cartStore.removeFromCart(item.id)"
										class="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
									>
										<Icon name="trash" class="w-4 h-4" />
									</button>
								</div>
								
								<div class="text-xs text-gray-500 mt-1 mb-auto flex flex-wrap gap-x-2 gap-y-1">
									<span v-if="item.resolved_options?.canvas_format">Format: {{ item.resolved_options.canvas_format.name }}</span>
									<span v-if="item.resolved_options?.canvas_size" class="before:content-['•'] before:mr-2 before:text-gray-300">Boyut: {{ item.resolved_options.canvas_size.display_name }}</span>
									<span v-if="item.resolved_options?.canvas_frame" class="before:content-['•'] before:mr-2 before:text-gray-300">Çerçeve: {{ item.resolved_options.canvas_frame.name }}</span>
									<span v-else-if="cartItemHasFormatOptions(item)" class="before:content-['•'] before:mr-2 before:text-gray-300">Çerçevesiz</span>
								</div>

								<div class="flex items-center justify-between mt-3">
									<!-- Quantity Control -->
									<div class="flex items-center bg-gray-50 rounded-lg p-0.5">
										<button
											@click="cartStore.updateQuantity(item.id, item.quantity - 1)"
											class="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
										>
											<Icon name="minus" class="w-3 h-3" />
										</button>
										<span class="w-8 text-center text-sm font-semibold text-gray-900">
											{{ item.quantity }}
										</span>
										<button
											@click="cartStore.updateQuantity(item.id, item.quantity + 1)"
											class="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
										>
											<Icon name="plus" class="w-3 h-3" />
										</button>
									</div>

									<div class="text-right">
										<div class="font-bold text-gray-900 text-[15px]">
											{{ formatPrice((item.unit_price || 0) * item.quantity) }}₺
										</div>
										<div
											class="text-[11px] font-medium text-gray-400 line-through mt-0.5"
											v-if="(item.old_price && item.old_price > item.unit_price) || item.canvas_product?.discount > 0 || item.canvas_product?.calculated_discount"
										>
											{{ formatPrice((item.old_price || item.canvas_product?.price || 0) * item.quantity) }}₺
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Recommended -->
					<div class="mt-4 pt-6 border-t border-gray-100" v-if="cartStore.cartItems.length > 0 && cartStore.recommendedProducts.length > 0">
						<h3 class="font-bold text-gray-900 mb-4">Bunları da beğenebilirsiniz</h3>
						<div class="grid grid-cols-2 gap-4">
							<nuxt-link
								v-for="prod in cartStore.recommendedProducts"
								:key="prod.id"
								:to="`/products/${prod.slug}`"
								class="flex flex-col gap-2 group cursor-pointer"
								@click="cartStore.closeCart"
							>
								<div class="aspect-square rounded-xl bg-gray-100 overflow-hidden relative">
									<img
										v-if="prod.image?.url"
										:src="prod.image.url"
										:alt="prod.name"
										class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
									/>
									<div v-else class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
								</div>
								<div>
									<h4 class="font-semibold text-sm text-gray-900 truncate group-hover:text-[#1853a0] transition-colors">{{ prod.name }}</h4>
									<span class="font-bold text-[#e11d48] text-sm">{{ prod.price }}₺</span>
								</div>
							</nuxt-link>
						</div>
					</div>
				</div>

				<!-- Footer / Checkout -->
				<div class="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-4">
					<!-- Coupon -->
					<div class="flex gap-2">
						<div class="relative flex-1">
							<div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
								<Icon name="ticket" class="w-4 h-4" />
							</div>
							<input
								v-model="couponCode"
								:disabled="cartStore.isApplyingCoupon || !!cartStore.appliedCoupon"
								type="text"
								placeholder="KUPON KODU GİRİNİZ"
								class="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium focus:ring-2 focus:ring-[#1853a0]/20 focus:border-[#1853a0] transition-all outline-none"
							/>
						</div>
						<button
							v-if="!cartStore.appliedCoupon"
							@click="applyCoupon"
							:disabled="cartStore.isApplyingCoupon || !couponCode"
							class="bg-[#111827] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{{ cartStore.isApplyingCoupon ? '...' : 'Uygula' }}
						</button>
						<button
							v-else
							@click="removeCoupon"
							class="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
						>
							İptal
						</button>
					</div>

					<!-- Totals -->
					<div class="flex flex-col gap-2 text-sm text-gray-600 mt-2">
						<div class="flex justify-between items-center">
							<span>Ara Toplam</span>
							<span class="font-medium text-gray-900">{{ formatPrice(cartStore.subtotal) }}₺</span>
						</div>
						<div v-if="cartStore.couponDiscount > 0" class="flex justify-between items-center text-emerald-600">
							<span>İndirim ({{ cartStore.appliedCoupon }})</span>
							<span class="font-bold">-{{ formatPrice(cartStore.couponDiscount) }}₺</span>
						</div>
						<div class="flex justify-between items-center">
							<span>Kargo</span>
							<span class="font-medium text-gray-900">
								{{ cartStore.subtotal >= cartStore.freeShippingThreshold ? 'Ücretsiz' : `${formatPrice(cartStore.shipping)}₺` }}
							</span>
						</div>
						
						<div class="flex justify-between items-center pt-3 border-t border-gray-200 mt-1">
							<span class="font-bold text-gray-900 text-base">Toplam</span>
							<span class="font-bold text-[#e11d48] text-lg">{{ formatPrice(cartStore.finalTotal) }}₺</span>
						</div>
					</div>

					<!-- Checkout Button -->
					<button
						class="w-full bg-[#ef4444] text-white py-3.5 rounded-xl font-bold text-[15px] hover:bg-[#dc2626] transition-colors shadow-lg shadow-red-500/20 mt-2"
					>
						Ödemeye Geç
					</button>
					<p class="text-center text-[11px] text-gray-400 mt-1">Satın alma işlemini güvenli şekilde tamamlayın.</p>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
	transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
