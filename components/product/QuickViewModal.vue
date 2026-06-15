<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'
	import type { Product } from '~/utils/types'
	import { getProductImageUrl } from '~/utils/collageLayout'
	import { productPagePath } from '~/utils/productRoute'

	const props = defineProps<{
		isOpen: boolean
		product: Product | null
	}>()

	const emit = defineEmits<{
		(e: 'close'): void
	}>()

	const discountedPrice = computed(() => {
		if (!props.product) return 0
		return props.product.discount_price ?? props.product.price
	})

	const displayDiscount = computed(() => {
		if (!props.product) return 0
		if (props.product.calculated_discount && props.product.calculated_discount.is_percentage) {
			return Math.round(props.product.calculated_discount.amount)
		}
		return props.product.discount > 0 ? props.product.discount : 0
	})

	const imageSrc = computed(() => {
		if (!props.product?.image) return ''
		return getProductImageUrl(props.product.image) || ''
	})
</script>

<template>
	<Teleport to="body">
		<div v-if="isOpen && product" class="fixed inset-0 z-50 flex items-center justify-center">
			<!-- Overlay -->
			<div 
				class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
				@click="emit('close')"
			></div>

			<!-- Modal -->
			<div class="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col md:flex-row z-10 animate-[fadeIn_0.3s_ease-out]">
				<button 
					@click="emit('close')"
					class="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>

				<!-- Image Section -->
				<div class="w-full md:w-1/2 bg-gray-50 p-6 flex items-center justify-center min-h-[300px]">
					<img :src="imageSrc" :alt="product.name" class="max-w-full max-h-[400px] object-contain rounded-lg drop-shadow-md" />
				</div>

				<!-- Details Section -->
				<div class="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
					<div v-if="product.main_category" class="text-sm font-medium text-[#2B7FFF] mb-2 uppercase tracking-wider">
						{{ product.main_category.name }}
					</div>
					
					<h3 class="text-2xl font-bold text-gray-900 mb-2 leading-tight">{{ product.name }}</h3>
					
					<div v-if="product.sku" class="text-xs text-gray-500 mb-4">SKU: {{ product.sku }}</div>

					<div class="flex items-center gap-3 mb-6">
						<span class="text-3xl font-bold text-[#101828]">₺{{ discountedPrice }}</span>
						<span v-if="displayDiscount > 0" class="text-lg text-gray-400 line-through">₺{{ product.price }}</span>
						<span v-if="displayDiscount > 0" class="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md">
							%{{ displayDiscount }} İndirim
						</span>
					</div>

					<div class="prose prose-sm text-gray-600 mb-8 line-clamp-4" v-html="product.description || 'Bu ürün için açıklama bulunmamaktadır.'">
					</div>

					<div class="mt-auto pt-4 flex gap-3">
						<nuxt-link 
							:to="productPagePath(product.slug)"
							class="flex-1 bg-[#1853a0] text-white py-3 rounded-xl font-bold text-center hover:bg-[#124080] transition-colors"
						>
							Ürünü İncele
						</nuxt-link>
					</div>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
@keyframes fadeIn {
	from { opacity: 0; transform: scale(0.95); }
	to { opacity: 1; transform: scale(1); }
}
</style>
