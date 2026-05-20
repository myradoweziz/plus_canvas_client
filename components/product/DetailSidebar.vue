<script setup lang="ts">
	import { mediaUrlForCanvas } from '~/utils/mediaUrl'
	import Icon from '~/utils/ui/Icon.vue'

	import { getFramePrice, isNoFrame, type FrameOption, type PrintSizeOption } from '~/utils/productDesignConfig'
	import type { Product } from '~/utils/types'
	const props = defineProps<{
		sizeOptions: PrintSizeOption[]
		frames: FrameOption[]
		selectedFormatId: number | null
		selectedSizeId: number | null
		activeFrameId: string | null
		product: Product
	}>()

	const emit = defineEmits<{
		(e: 'size-change', sizeId: number): void
		(e: 'frame-select', index: number): void
	}>()

	const onSizeChange = (e: Event) => {
		emit('size-change', Number((e.target as HTMLSelectElement).value))
	}

	const frameImageSrc = (frame: FrameOption) => {
		const url = frame.image_url?.trim()
		return url ? mediaUrlForCanvas(url) : '/images/cerceve.png'
	}

	const isFrameActive = (id: string) => String(props.activeFrameId ?? '') === String(id)

	const framePreviewStyle = (frame: FrameOption) => {
		const insetColor = frame.color_hex || '#6b4f2a'
		const colorRing = `inset 0 0 0 3px ${insetColor}`
		if (!isFrameActive(frame.id)) return { boxShadow: colorRing }
		return {
			boxShadow: `${colorRing}, inset 0 0 0 5px #2563eb`
		}
	}

	const selectedFrame = computed(() => props.frames.find((f) => f.id === props.activeFrameId) ?? null)

	const displayPrice = computed(() => {
		const size = props.sizeOptions.find((s) => s.id === props.selectedSizeId)
		const base = size?.price
			? size.price
			: Math.round(props.product.price - (props.product.price * props.product.discount) / 100)
		return Math.round(base + getFramePrice(selectedFrame.value))
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
		<div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 mt-3">
			<button
				v-for="(frame, index) in frames"
				:key="frame.id"
				type="button"
				class="frame-tile group relative aspect-square w-full overflow-hidden rounded-md border-2 cursor-pointer transition-all hover:border-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
				:class="
					isFrameActive(frame.id) ? 'frame-tile--active border-blue-600 ring-2 ring-blue-500/50' : 'border-transparent'
				"
				:aria-pressed="isFrameActive(frame.id)"
				:title="frame.name"
				@click="emit('frame-select', index)"
			>
				<div
					v-if="isNoFrame(frame)"
					class="frame-tile__empty pointer-events-none absolute inset-0 flex items-center justify-center bg-white"
				>
					<span class="frame-tile__x" :style="{ color: frame.color_hex }" aria-hidden="true">×</span>
				</div>
				<img
					v-else
					:src="frameImageSrc(frame)"
					:alt="frame.name"
					class="h-full w-full object-cover pointer-events-none"
					:style="framePreviewStyle(frame)"
				/>
				<span
					class="frame-tile__label pointer-events-none absolute inset-0 flex items-center justify-center px-1 text-center text-[10px] leading-tight font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
				>
					{{ frame.name }}
				</span>
			</button>
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

	.frame-tile__label {
		background: rgba(16, 24, 40, 0.62);
		backdrop-filter: blur(2px);
	}

	.frame-tile__x {
		font-size: 2rem;
		line-height: 1;
		font-weight: 300;
	}

	.frame-tile--active {
		border-color: #2563eb !important;
	}
</style>
