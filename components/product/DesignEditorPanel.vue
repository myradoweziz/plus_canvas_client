<script setup lang="ts">
	import type { CanvasFormat } from '~/utils/productDesignConfig'
	import type { Product, TempDesignImage } from '~/utils/types'

	defineProps<{
		images: TempDesignImage[]
		isThumbActive: (index: number) => boolean
		previewUrl: (url: string) => string
		formatPresets: CanvasFormat[]
		formatPreviewSrc: string
		activeFormatId: number | null
		product: Product
	}>()

	defineEmits<{
		(e: 'thumb-select', index: number): void
		(e: 'select-format', formatId: number): void
	}>()
</script>

<template>
	<div class="flex gap-5">
		<ProductDesignThumbs
			:images="images"
			:is-thumb-active="isThumbActive"
			:preview-url="previewUrl"
			@select="$emit('thumb-select', $event)"
		/>

		<section class="product-editor-main w-full min-w-0 max-w-4xl">
			<slot name="canvas" />

			<ProductDesignFormatStrip
				:formats="formatPresets"
				:preview-src="formatPreviewSrc"
				:active-format-id="activeFormatId"
				@select-format="$emit('select-format', $event)"
			/>

			<ProductDesignDeliveryBanner />
		</section>
	</div>
</template>

<style lang="scss" scoped>
	.product-editor-main {
		display: flex;
		flex-direction: column;
	}
</style>
