<script setup lang="ts">
	import type { CanvasFormat } from '~/utils/productDesignConfig'
	import type { ActiveMockupSceneSetting, Product, TempDesignImage } from '~/utils/types'

	const props = defineProps<{
		images: TempDesignImage[]
		isThumbActive: (index: number) => boolean
		getThumbPreviewSrc: (index: number) => string
		getProductThumbBackgroundSrc?: (index: number) => string
		getProductThumbCollageSrc?: (index: number) => string
		formatPresets: CanvasFormat[]
		formatPreviewById: Record<number, string>
		formatDesignPreviewById?: Record<number, string>
		canvasPreviewSrc?: string
		canvasDesignPreviewSrc?: string
		formatStripBackgroundSrc?: string
		activeFormatId: number | null
		isCanvasLoading?: boolean
		isMockupSceneActive?: boolean
		activeMockupSceneSettings?: ActiveMockupSceneSetting[]
		useStaticFormatPreviews?: boolean
		/** Серый фон миниатюр + дизайн по центру (mockup только на canvas) */
		useStaticThumbBackground?: boolean
		/** Галерея: без overlay inner_images на миниатюрах */
		hideThumbCollageOverlay?: boolean
		/** Скидка в % (API calculate-price или product.discount) */
		discountPercent?: number | null
		product: Product
	}>()

	const canvasDiscountPercent = computed(() => {
		const fromProp = props.discountPercent
		if (typeof fromProp === 'number' && Number.isFinite(fromProp) && fromProp > 0) {
			return Math.round(fromProp)
		}
		const fromProduct = props.product.discount
		return fromProduct > 0 ? Math.round(fromProduct) : 0
	})

	defineEmits<{
		(e: 'thumb-select', index: number): void
		(e: 'select-format', formatId: number): void
		(e: 'mockup-scene-color-change', settingIndex: number, color: string): void
	}>()
</script>

<template>
	<div class="product-editor-layout flex flex-col lg:flex-row gap-4 sm:gap-5 w-full">
		<ProductDesignThumbs
			:images="images"
			:is-thumb-active="isThumbActive"
			:get-thumb-preview-src="getThumbPreviewSrc"
			:get-product-thumb-background-src="
				hideThumbCollageOverlay || useStaticThumbBackground ? undefined : getProductThumbBackgroundSrc
			"
			:get-product-thumb-collage-src="hideThumbCollageOverlay ? undefined : getProductThumbCollageSrc"
			:use-static-thumb-bg="hideThumbCollageOverlay || useStaticThumbBackground"
			@select="$emit('thumb-select', $event)"
		/>

		<section class="product-editor-main w-full min-w-0 max-w-4xl">
			<div class="product-editor-workspace relative">
				<div class="product-editor-canvas relative w-full min-h-0">
					<div
						v-if="canvasDiscountPercent > 0"
						class="canvas-discount-badge pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4 z-[15]"
						:aria-label="`İndirim %${canvasDiscountPercent}`"
					>
						<span class="canvas-discount-badge__value">{{ canvasDiscountPercent }}%</span>
					</div>
					<slot name="canvas" />
					<ProductMockupSceneHotspots
						v-if="isMockupSceneActive && activeMockupSceneSettings?.length"
						:settings="activeMockupSceneSettings"
						:disabled="isCanvasLoading"
						@color-change="(index, color) => $emit('mockup-scene-color-change', index, color)"
					/>
				</div>

				<ProductDesignFormatStrip
					:formats="formatPresets"
					:format-preview-by-id="formatPreviewById"
					:format-design-preview-by-id="formatDesignPreviewById"
					:canvas-preview-src="canvasPreviewSrc"
					:canvas-design-preview-src="canvasDesignPreviewSrc"
					:format-strip-background-src="formatStripBackgroundSrc"
					:active-format-id="activeFormatId"
					:is-loading="isCanvasLoading"
					@select-format="$emit('select-format', $event)"
				/>

				<Transition name="canvas-loader">
					<div
						v-if="isCanvasLoading"
						class="canvas-loading-overlay absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F5F2ED]/96 backdrop-blur-[3px]"
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
				</Transition>
			</div>

			<ProductDesignDeliveryBanner />
		</section>
	</div>
</template>

<style lang="scss" scoped>
	.product-editor-layout {
		align-items: stretch;
	}

	.product-editor-main {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.product-editor-workspace {
		min-height: 0;
	}

	@media (max-width: 1023px) {
		.product-editor-layout :deep(.product-design-thumbs) {
			order: -1;
		}
	}

	.canvas-loader-enter-active,
	.canvas-loader-leave-active {
		transition: opacity 0.18s ease;
	}

	.canvas-loader-enter-from,
	.canvas-loader-leave-to {
		opacity: 0;
	}

	.canvas-discount-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 60px;
		height: 30px;
		padding: 0 10px;
		border-radius: 20px;
		background: linear-gradient(135deg, #2b7fff 0%, #1853a0 100%);
		color: #fff;
		box-shadow: 0 4px 14px rgba(24, 83, 160, 0.38);
	}

	.canvas-discount-badge__value {
		font-size: 0.8125rem;
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	@media (min-width: 640px) {
		.canvas-discount-badge {
			min-width: 3.5rem;
			height: 3.5rem;
		}

		.canvas-discount-badge__value {
			font-size: 0.9375rem;
		}
	}
</style>
