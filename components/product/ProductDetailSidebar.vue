<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { FrameOption, PrintSizeOption } from '~/utils/productDesignConfig'
	import type { Product } from '~/utils/types'

	const props = defineProps<{
		sizeOptions: PrintSizeOption[]
		frameOptions: FrameOption[]
		selectedFormatId: number | null
		selectedSizeId: number | null
		isFrameActive: (id: string) => boolean
		product: Product
	}>()

	const emit = defineEmits<{
		(e: 'size-change', sizeId: number): void
		(e: 'frame-select', index: number): void
	}>()

	const onSizeChange = (e: Event) => {
		emit('size-change', Number((e.target as HTMLSelectElement).value))
	}

	const displayPrice = computed(() => {
		const size = props.sizeOptions.find((s) => s.id === props.selectedSizeId)
		if (size?.price) return size.price
		return Math.round(props.product.price - (props.product.price * props.product.discount) / 100)
	})
</script>

<template>
	<div class="w-full">
		<h1 class="font-semibold text-4xl">{{ product.name }}</h1>

		<div class="flex items-center gap-2 mt-3">
			<Icon name="star" class="w-6 h-6 text-yellow-300" />
			<span class="text-[#B3B3B3]">
				4.8 •
				<span class="underline">22 Değerlendirme</span>
			</span>
		</div>

		<div class="mt-4 text-sm text-[#B3B3B3] flex items-center gap-2">
			Ürün Kodu: <span class="font-bold">{{ product.product_qode }}</span>
			<Icon name="copyIcon" />
		</div>

		<div class="mt-8">Boyut Seçin</div>
		<div class="mt-2 relative w-full max-w-[220px]">
			<select
				name="size"
				:value="selectedSizeId ?? ''"
				class="pcSelect w-full appearance-none bg-[#B3B3B333] hover:bg-[#B3B3B340] rounded-full py-3 pl-6 pr-12 font-bold text-[#101828] outline-none transition-all"
				:disabled="!sizeOptions.length"
				@change="onSizeChange"
			>
				<option v-for="size in sizeOptions" :key="size.id" :value="size.id">
					{{ size.display_name }}
				</option>
			</select>
			<div class="pointer-events-none absolute inset-y-0 right-4 flex items-center">
				<Icon name="arrowRight" class="w-4 h-4 rotate-90" />
			</div>
		</div>

		<div class="mt-8">Çerçeve Seçin</div>
		<div class="grid grid-cols-7 gap-3 mt-3">
			<img
				v-for="(frame, index) in frameOptions.slice(0, 9)"
				:key="frame.id"
				:src="frame.src ?? '/images/cerceve.png'"
				:alt="frame.label"
				class="border border-transparent hover:border-blue-600 transition-all cursor-pointer rounded-md"
				:class="{ 'border-blue-600': isFrameActive(frame.id) }"
				@click="emit('frame-select', index)"
			/>
		</div>

		<div class="mt-8 flex items-center gap-5">
			<span class="text-4xl font-bold text-[#313131]">{{ displayPrice }}₺</span>
			<span v-if="product.discount > 0" class="text-2xl line-through text-[#B3B3B3]">{{ product.price }}₺</span>
		</div>

		<div class="mt-5 flex items-center gap-2">
			<button
				type="button"
				class="bg-[#2B7FFF] rounded-3xl p-4 py-3 hover:bg-[#2B7FFF]/80 transition-all text-white font-semibold text-lg w-full max-w-[300px]"
			>
				Sepete Ekle
			</button>
			<Icon
				name="heart"
				class="text-white bg-[#2B7FFF] rounded-3xl w-[50px] h-[50px] hover:bg-[#2B7FFF]/80 transition-all"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
	.pcSelect {
		box-shadow: inset 0 0 0 1px rgba(16, 24, 40, 0.06);
	}
</style>
