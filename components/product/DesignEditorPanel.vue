<script setup lang="ts">
	import type { CanvasFormat } from '~/utils/productDesignConfig'
	import { getFormatStaticPreviewSvg } from '~/utils/canvasPaintingDisplay'
	import type { ActiveMockupSceneSetting, Product, TempDesignImage } from '~/utils/types'

	defineProps<{
		images: TempDesignImage[]
		isThumbActive: (index: number) => boolean
		getThumbPreviewSrc: (index: number) => string
		getProductThumbBackgroundSrc?: (index: number) => string
		getProductThumbCollageSrc?: (index: number) => string
		formatPresets: CanvasFormat[]
		formatPreviewById: Record<number, string>
		canvasPreviewSrc?: string
		activeFormatId: number | null
		isCanvasLoading?: boolean
		isMockupSceneActive?: boolean
		activeMockupSceneSettings?: ActiveMockupSceneSetting[]
		useStaticFormatPreviews?: boolean
		/** Галерея: без overlay inner_images на миниатюрах */
		hideThumbCollageOverlay?: boolean
		product: Product
	}>()

	defineEmits<{
		(e: 'thumb-select', index: number): void
		(e: 'select-format', formatId: number): void
		(e: 'mockup-scene-color-change', settingIndex: number, color: string): void
	}>()
</script>

<template>
	<div class="flex gap-5">
		<ProductDesignThumbs
			:images="images"
			:is-thumb-active="isThumbActive"
			:get-thumb-preview-src="getThumbPreviewSrc"
			:get-product-thumb-background-src="hideThumbCollageOverlay ? undefined : getProductThumbBackgroundSrc"
			:get-product-thumb-collage-src="hideThumbCollageOverlay ? undefined : getProductThumbCollageSrc"
			:use-static-thumb-bg="hideThumbCollageOverlay"
			@select="$emit('thumb-select', $event)"
		/>

		<section class="product-editor-main w-full min-w-0 max-w-4xl">
			<div class="product-editor-canvas relative w-full min-h-[620px]">
				<slot name="canvas" />
				<ProductMockupSceneHotspots
					v-if="isMockupSceneActive && activeMockupSceneSettings?.length"
					:settings="activeMockupSceneSettings"
					:disabled="isCanvasLoading"
					@color-change="(index, color) => $emit('mockup-scene-color-change', index, color)"
				/>
				<div
					v-if="isCanvasLoading"
					class="canvas-loading-overlay absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F5F2ED]/85 backdrop-blur-[2px]"
					aria-live="polite"
					aria-busy="true"
				>
					<svg
						class="h-10 w-10 animate-spin text-[#2B7FFF]"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					<span class="text-sm font-medium text-[#364153]">Görseller yükleniyor…</span>
				</div>
			</div>

			<ProductDesignFormatStrip
				:formats="formatPresets"
				:format-preview-by-id="formatPreviewById"
				:canvas-preview-src="canvasPreviewSrc"
				:active-format-id="activeFormatId"
				:use-static-format-previews="useStaticFormatPreviews"
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
