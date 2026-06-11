<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { Faq, Product } from '~/utils/types'

	const props = defineProps<{
		product?: Product | null
	}>()

	const tabs = ['Açıklama', 'Sıkça Sorulan Sorular', 'Ürün Özellikleri'] as const

	const activeId = ref(0)
	const activeFaqIndex = ref(-1)
	const activeFeatureIndex = ref(-1)

	const homeStore = useHomeStore()

	onMounted(() => {
		if (!homeStore.faqs.length) void homeStore.fetchFaqs()
	})

	const faqItems = computed<Faq[]>(() => {
		const fromProduct = props.product?.faqs
		if (Array.isArray(fromProduct) && fromProduct.length) return fromProduct
		return homeStore.faqs
	})

	const toggleFaq = (index: number) => {
		activeFaqIndex.value = activeFaqIndex.value === index ? -1 : index
	}

	watch(activeId, () => {
		activeFaqIndex.value = -1
		activeFeatureIndex.value = -1
	})
</script>

<template>
	<div>
		<section class="flex items-stretch justify-between mt-4 sm:mt-6 gap-1 sm:gap-0 overflow-x-auto">
			<button
				v-for="(label, index) in tabs"
				:key="label"
				type="button"
				@click="activeId = index"
				:class="[
					'font-medium border-b-2 transition-all w-full min-w-0 px-1 sm:px-2 py-2 text-xs sm:text-sm md:text-base leading-tight hover:border-[#2B7FFF] hover:text-[#2B7FFF]',
					index === activeId ? 'border-[#2B7FFF] text-[#2B7FFF]' : 'border-[#B3B3B3] text-[#B3B3B3]'
				]"
			>
				{{ label }}
			</button>
		</section>

		<div v-if="activeId === 0" class="mt-6 text-[#313131] text-left">
			<p v-if="product?.description" v-html="product.description" />
			<p v-else class="text-sm text-gray-500">Açıklama bulunamadı.</p>
		</div>

		<div v-else-if="activeId === 1" class="mt-6 text-left">
			<div v-if="faqItems.length" class="space-y-4">
				<div
					v-for="(faq, index) in faqItems"
					:key="faq.id ?? index"
					class="overflow-hidden rounded-xl border border-gray-100 shadow-sm"
				>
					<button
						type="button"
						class="w-full flex items-center justify-between gap-3 p-4 sm:p-6 text-left transition-all duration-300"
						:class="activeFaqIndex === index ? 'bg-[#1853a0] text-white' : 'bg-white text-gray-800 hover:bg-gray-50'"
						@click="toggleFaq(index)"
					>
						<span class="font-bold text-[15px] md:text-base leading-snug">{{ faq.question }}</span>
						<Icon
							name="arrowBottom"
							class="w-3.5 h-3.5 shrink-0 transition-transform duration-300"
							:class="activeFaqIndex === index ? 'rotate-180' : ''"
						/>
					</button>

					<div
						v-show="activeFaqIndex === index"
						class="p-6 bg-white text-gray-600 text-sm md:text-[15px] leading-relaxed border-t border-gray-50"
					>
						{{ faq.answer }}
					</div>
				</div>
			</div>
			<p v-else class="text-sm text-gray-500">Henüz soru eklenmemiş.</p>
		</div>

		<div v-else class="mt-6 text-left">
			<div v-html="product?.product_dimensions"></div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
	h2 {
		@apply text-2xl font-bold text-[#101828] mb-3;
	}
	p {
		@apply text-gray-500 text-sm md:text-[15px] leading-[1.8] space-y-4;
	}
</style>
