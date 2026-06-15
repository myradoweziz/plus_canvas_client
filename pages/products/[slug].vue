<script setup lang="ts">
	import { Autoplay, Navigation } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'

	import { getCanvasPaintingArtworkUrl, isCanvasPaintingGalleryProduct } from '~/utils/canvasPaintingDisplay'
	import { extractCanvasFormatsFromProduct, extractCanvasFramesFromProduct } from '~/utils/productDesignConfig'
	import { editorPagePath, normalizeRouteParam, productApiPath, productPagePath } from '~/utils/productRoute'
	import type { BreadcrumbItem, Product, ProductDesignPayload } from '~/utils/types'

	const route = useRoute()
	const router = useRouter()
	const designStore = useProductDesignStore()

	const productSlug = computed(() => normalizeRouteParam(route.params.slug ?? route.params.productId))

	const productSessionKey = productSlug

	const breadcrumbs = computed(
		() =>
			[
				{ label: 'Kategoriler', link: '/products' },
				{ label: 'Ürünler', link: `/products` },
				{ label: 'Ürün Detayı', link: productPagePath(productSlug.value) }
			] as BreadcrumbItem[]
	)

	const lastDesign = ref<ProductDesignPayload | null>(null)
	const onDesignUpdate = (payload: ProductDesignPayload) => {
		lastDesign.value = payload
	}

	const canvasWrapRef = ref<HTMLElement | null>(null)

	const { data: productData, status: productStatus } = await useFetch<{ data: Product }>(
		() => productApiPath(productSlug.value),
		{
			method: 'GET',
			baseURL: useRuntimeConfig().public.baseUrl
		}
	)

	const product = computed(() => productData.value?.data)

	// Manage session and redirection based on product category
	watch(
		product,
		(newProduct) => {
			if (!newProduct) return
			if (isCanvasPaintingGalleryProduct(newProduct)) {
				const artworkUrl = getCanvasPaintingArtworkUrl(newProduct)
				if (artworkUrl) {
					designStore.setSession(productSlug.value, [{ url: artworkUrl, id: 1, session_id: 'canvas-artwork' }])
				}
			} else {
				// Standard product: if session exists, go to editor, else catalog
				if (designStore.hasSessionFor(newProduct.slug)) {
					router.replace(editorPagePath(newProduct.slug))
				} else {
					router.replace('/products')
				}
			}
		},
		{ immediate: true }
	)

	const canvasFormats = computed(() => extractCanvasFormatsFromProduct(product.value))
	const frames = computed(() => extractCanvasFramesFromProduct(product.value))

	const {
		thumbImages,
		thumbOverlayByIndex,
		canvasPreviewSrc,
		canvasDesignPreviewSrc,
		formatPreviewById,
		formatDesignPreviewById,
		getFormatStripBackgroundSrc,
		isThumbActive,
		previewUrl,
		selectThumb,
		getThumbPreviewSrc,
		getProductThumbBackgroundSrc,
		getProductThumbCollageSrc,
		formatPresets,
		sizeOptions,
		frameOptions,
		applyFormatById,
		applySizeById,
		applyFrameByIndex,
		activeFormatId,
		activeFrameId,
		showFrameSelector,
		isCanvasLoading,
		selectedFormat,
		selectedSize,
		isMockupSceneActive,
		activeMockupSceneSettings,
		setMockupSceneColor,
		useStaticFormatPreviews
	} = useProductCanvasEditor({
		productId: productSessionKey,
		wrapRef: canvasWrapRef,
		canvasFormats,
		canvasFrames: frames,
		product,
		onDesignUpdate
	})

	const { quote: priceQuote } = useCanvasProductPrice({
		productId: productSlug,
		formatId: computed(() => selectedFormat.value?.id ?? null),
		sizeId: computed(() => selectedSize.value?.id ?? null),
		frameId: activeFrameId,
		frames: frameOptions
	})

	const discountPercent = computed(() => {
		const fromApi = priceQuote.value?.discount
		if (typeof fromApi === 'number' && Number.isFinite(fromApi) && fromApi > 0) {
			return Math.round(fromApi)
		}
		const old = priceQuote.value?.old_price
		const total = priceQuote.value?.total_price
		if (typeof old === 'number' && typeof total === 'number' && old > total) {
			return Math.round((1 - total / old) * 100)
		}
		const p = product.value?.discount ?? 0
		return p > 0 ? Math.round(p) : 0
	})

	const onThumbSelect = (index: number) => {
		void selectThumb(index)
	}

	const onMockupSceneColorChange = (settingIndex: number, color: string) => {
		void setMockupSceneColor(settingIndex, color)
	}

	onBeforeRouteLeave((to) => {
		const nextSlug = normalizeRouteParam(to.params.slug ?? to.params.id ?? to.params.productId)
		const stayingOnSameProduct =
			to.path.startsWith('/products/') && nextSlug.length > 0 && nextSlug === productSlug.value
		if (!stayingOnSameProduct) {
			designStore.clearSession()
		}
	})

	watch(productSlug, async (newSlug, oldSlug) => {
		if (!oldSlug || newSlug === oldSlug) return
		designStore.clearSession()
		await router.replace('/products')
	})

	const deliveryDirections = [
		{ icon: 'carTruck', title: 'Ücretsiz Kargo', description: 'Tüm siparişlerde' },
		{
			icon: 'money',
			title: 'Taksitli ödeme',
			description: 'Banka havalesi veya kredi kartı ile ödeme. 3, 6 veya 9 taksit imkanı.'
		},
		{ icon: 'shield', title: 'Memnuniyet Garantisi', description: '30 gün iade' }
	]

	const deliveryDirectionColors = (index: number) => {
		return {
			backgroundColor: index === 0 ? '#00A63E1A' : index === 1 ? '#F4AE0F1A' : '#155DFC1A',
			iconColor: index === 0 ? '#00A63E' : index === 1 ? '#F4AE0F' : '#155DFC',
			textColor: index === 0 ? '#0D542B' : index === 1 ? '#F4AE0F' : '#155DFC'
		}
	}

	const homeStore = useHomeStore()
	await homeStore.fetchProducts()

	const relatedProducts = computed(() => {
		const list = homeStore.canvasPaintingProducts.length ? homeStore.canvasPaintingProducts : homeStore.products
		return list
	})

	const swiperModules = [Navigation, Autoplay]

	const relatedSwiperBeginning = ref(true)
	const relatedSwiperEnd = ref(false)

	const onRelatedSwiper = (swiper: any) => {
		relatedSwiperBeginning.value = swiper.isBeginning
		relatedSwiperEnd.value = swiper.isEnd

		swiper.on('slideChange', () => {
			relatedSwiperBeginning.value = swiper.isBeginning
			relatedSwiperEnd.value = swiper.isEnd
		})
	}
</script>

<template>
	<div class="bg-[#F5F2ED]">
		<section class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-0 py-6 sm:py-8 md:py-9">
			<Breadcrumbs :items="breadcrumbs" />

			<div v-if="productStatus === 'pending'" class="mt-10 md:mt-20 text-center text-[#364153]">Yükleniyor…</div>

			<div
				v-else-if="product"
				class="product-detail-layout mt-8 sm:mt-12 md:mt-20 flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-10 items-stretch lg:items-start"
			>
				<div class="product-detail-editor min-w-0">
					<ProductDesignEditorPanel
						:product="product"
						:images="thumbImages"
						:is-thumb-active="isThumbActive"
						:thumb-overlay-by-index="thumbOverlayByIndex"
						:get-thumb-preview-src="getThumbPreviewSrc"
						:get-product-thumb-background-src="getProductThumbBackgroundSrc"
						:get-product-thumb-collage-src="getProductThumbCollageSrc"
						:format-presets="formatPresets"
						:format-preview-by-id="formatPreviewById"
						:format-design-preview-by-id="formatDesignPreviewById"
						:canvas-preview-src="canvasPreviewSrc"
						:canvas-design-preview-src="canvasDesignPreviewSrc"
						:format-strip-background-src="getFormatStripBackgroundSrc()"
						:active-format-id="activeFormatId"
						:is-canvas-loading="isCanvasLoading"
						:is-mockup-scene-active="isMockupSceneActive"
						:active-mockup-scene-settings="activeMockupSceneSettings"
						:use-static-format-previews="useStaticFormatPreviews"
						:hide-thumb-collage-overlay="useStaticFormatPreviews"
						:discount-percent="discountPercent"
						@thumb-select="onThumbSelect"
						@select-format="(id) => void applyFormatById(id)"
						@mockup-scene-color-change="onMockupSceneColorChange"
					>
						<template #canvas>
							<div ref="canvasWrapRef" class="mySwiper2 relative w-full overflow-hidden" />
						</template>
					</ProductDesignEditorPanel>

					<ProductDetailTabs :product="product" />
				</div>

				<div class="product-detail-sidebar w-full shrink-0">
					<ProductDetailSidebar
						:product="product"
						:format-presets="formatPresets"
						:size-options="sizeOptions"
						:frames="frameOptions"
						:selected-format-id="selectedFormat?.id ?? null"
						:selected-size-id="selectedSize?.id ?? null"
						:active-frame-id="activeFrameId"
						:show-frame-selector="showFrameSelector"
						:is-canvas-loading="isCanvasLoading"
						@format-change="applyFormatById"
						@size-change="applySizeById"
						@frame-select="applyFrameByIndex"
					/>
				</div>
			</div>
			<ProductDeliveryDirections
				:delivery-directions="deliveryDirections"
				:delivery-direction-colors="deliveryDirectionColors"
			/>

			<ProductFeatures />

			<ProductRatingReviews :comments="product?.comments ?? []" />
		</section>
		<section class="mt-10 sm:mt-16 md:mt-20 bg-white">
			<div class="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 py-8 sm:py-10 md:py-16">
				<div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8 md:mb-12">
					<h2 class="text-[#101828] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
						Bu tabloyu alanlar bunları da aldı
					</h2>
				</div>

				<div v-if="relatedProducts.length" class="related-swiper-wrap relative">
					<button
						v-if="relatedProducts.length > 4"
						type="button"
						:class="[
							'related-prev',
							{ 'swiper-button-disabled': relatedSwiperBeginning },
							'related-swiper-nav related-swiper-nav--prev'
						]"
						aria-label="Önceki"
					>
						<Icon name="arrowBottom" class="w-4 h-4 md:w-5 md:h-5 rotate-90" />
					</button>

					<Swiper
						:modules="swiperModules"
						:autoplay="{ delay: 3500, disableOnInteraction: false }"
						:speed="2000"
						:loop="false"
						@swiper="onRelatedSwiper"
						:navigation="{ prevEl: '.related-prev', nextEl: '.related-next' }"
						:slides-per-view="1.2"
						:space-between="16"
						:breakpoints="{
							640: { slidesPerView: 2.2, spaceBetween: 20 },
							1024: { slidesPerView: 4, spaceBetween: 24 }
						}"
					>
						<SwiperSlide v-for="relatedItem in relatedProducts" :key="relatedItem.id" class="h-auto">
							<cards-canvas-paintings-card :product="relatedItem" show-button />
						</SwiperSlide>
					</Swiper>

					<button
						v-if="relatedProducts.length > 4"
						type="button"
						:class="[
							'related-next',
							{ 'swiper-button-disabled': relatedSwiperEnd },
							'related-swiper-nav related-swiper-nav--next'
						]"
						aria-label="Sonraki"
					>
						<Icon name="arrowBottom" class="w-4 h-4 md:w-5 md:h-5 -rotate-90" />
					</button>
				</div>

				<p v-else class="text-[#364153]">Benzer ürün bulunamadı.</p>
			</div>
		</section>
	</div>
</template>

<style lang="scss" scoped>
	.product-detail-editor {
		flex: 1 1 auto;
		min-width: 0;
		width: 100%;
	}

	.product-detail-sidebar {
		flex: 0 0 auto;
		width: 100%;
		max-width: none;
	}

	@media (min-width: 1024px) {
		.product-detail-sidebar {
			flex: 0 0 380px;
			max-width: 420px;
		}
	}

	:deep(.mySwiper2) {
		width: 100%;
		height: clamp(280px, 72vw, 420px);
		min-height: clamp(280px, 72vw, 420px);
		margin: auto 0;
		background-color: #f5f2ed;
		position: relative;
		display: block;

		@media (min-width: 640px) {
			height: clamp(360px, 58vw, 520px);
			min-height: clamp(360px, 58vw, 520px);
		}

		@media (min-width: 1024px) {
			height: 620px;
			min-height: 620px;
		}

		.canvas-container {
			position: absolute;
			inset: 0;
			width: 100% !important;
			height: 100% !important;
			border-radius: 20px;
			overflow: hidden;
			box-shadow: 0 4px 24px rgba(16, 24, 40, 0.08);
		}

		.upper-canvas,
		.lower-canvas {
			width: 100% !important;
			height: 100% !important;
		}
	}

	.related-swiper-wrap {
		padding-left: 0;
		padding-right: 0;

		@media (min-width: 640px) {
			padding-left: 2.5rem;
			padding-right: 2.5rem;
		}

		@media (min-width: 768px) {
			padding-left: 3.5rem;
			padding-right: 3.5rem;
		}
	}

	.related-swiper-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		background-color: #101828;
		color: #fff;
		box-shadow: 0 4px 14px rgba(16, 24, 40, 0.18);
		transition:
			background-color 0.2s ease,
			opacity 0.2s ease;
		pointer-events: auto;

		@media (min-width: 768px) {
			width: 3rem;
			height: 3rem;
		}

		&:hover:not(.swiper-button-disabled) {
			background-color: rgb(16 24 40 / 0.8);
		}

		&.swiper-button-disabled {
			opacity: 0.45;
			background-color: #a5a5a5;
			cursor: not-allowed;
			pointer-events: none;
		}

		&--prev {
			left: 0;
		}

		&--next {
			right: 0;
		}
	}
</style>
