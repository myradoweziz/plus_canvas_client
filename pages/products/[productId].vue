<script setup lang="ts">
	import { Autoplay, Navigation } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'

	import { getProductImageUrl } from '~/utils/collageLayout'
	import { extractCanvasFormatsFromProduct, extractCanvasFramesFromProduct } from '~/utils/productDesignConfig'
	import type { BreadcrumbItem, Product, ProductDesignPayload } from '~/utils/types'
	import { CANVAS_PAINTING_CATEGORY_SLUG } from '~/utils/types/category'

	const route = useRoute()
	const router = useRouter()
	const designStore = useProductDesignStore()

	const productId = computed(() => {
		const id = route.params.productId
		if (Array.isArray(id)) return id[0] ?? ''
		return String(id ?? '')
	})

	const breadcrumbs = [
		{ label: 'Kategoriler', link: '/products' },
		{ label: 'Ürünler', link: `/products` },
		{ label: 'Ürün Detayı', link: `/products/${productId.value}` }
	] as BreadcrumbItem[]

	const lastDesign = ref<ProductDesignPayload | null>(null)
	const onDesignUpdate = (payload: ProductDesignPayload) => {
		lastDesign.value = payload
	}

	const canvasWrapRef = ref<HTMLElement | null>(null)

	const { data: productData, status: productStatus } = await useFetch<{ data: Product }>(
		() => `/api/canvas-products/${productId.value}`,
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
			if (newProduct.main_category?.slug === CANVAS_PAINTING_CATEGORY_SLUG) {
				const tempImages = (newProduct.inner_images ?? [])
					.map((img, idx) => ({
						url: getProductImageUrl(img),
						id: idx + 1,
						session_id: 'canvas-painting'
					}))
					.filter((item) => item.url.length > 0)
				if (tempImages.length > 0) {
					designStore.setSession(productId.value, tempImages)
				}
			} else {
				// Standard product: if session exists, go to editor, else catalog
				if (designStore.hasSessionFor(String(newProduct.id))) {
					router.replace(`/products/editor/${newProduct.id}`)
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
		canvasPreviewSrc,
		formatPreviewById,
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
		isCanvasLoading,
		selectedFormat,
		selectedSize,
		isMockupSceneActive,
		activeMockupSceneSettings,
		setMockupSceneColor
	} = useProductCanvasEditor({
		productId,
		wrapRef: canvasWrapRef,
		canvasFormats,
		canvasFrames: frames,
		product,
		onDesignUpdate
	})

	const onThumbSelect = (index: number) => {
		void selectThumb(index)
	}

	const onMockupSceneColorChange = (settingIndex: number, color: string) => {
		void setMockupSceneColor(settingIndex, color)
	}

	onBeforeRouteLeave((to) => {
		const nextId = to.params.id || to.params.productId
		const nextProductId = Array.isArray(nextId) ? nextId[0] : nextId
		const stayingOnSameProduct = to.path.startsWith('/products/') && String(nextProductId ?? '') === productId.value
		if (!stayingOnSameProduct) {
			designStore.clearSession()
		}
	})

	watch(productId, async (newId, oldId) => {
		if (!oldId || newId === oldId) return
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
		<section class="max-w-[1400px] mx-auto px-4 md:px-0 py-10 md:py-9">
			<Breadcrumbs :items="breadcrumbs" />

			<div v-if="productStatus === 'pending'" class="mt-20 text-center text-[#364153]">Yükleniyor…</div>

			<div v-else-if="product" class="product-detail-layout mt-20 flex gap-10 items-start">
				<div class="product-detail-editor min-w-0">
					<ProductDesignEditorPanel
						:product="product"
						:images="thumbImages"
						:is-thumb-active="isThumbActive"
						:get-thumb-preview-src="getThumbPreviewSrc"
						:get-product-thumb-background-src="getProductThumbBackgroundSrc"
						:get-product-thumb-collage-src="getProductThumbCollageSrc"
						:format-presets="formatPresets"
						:format-preview-by-id="formatPreviewById"
						:canvas-preview-src="canvasPreviewSrc"
						:active-format-id="activeFormatId"
						:is-canvas-loading="isCanvasLoading"
						:is-mockup-scene-active="isMockupSceneActive"
						:active-mockup-scene-settings="activeMockupSceneSettings"
						@thumb-select="onThumbSelect"
						@select-format="(id) => void applyFormatById(id)"
						@mockup-scene-color-change="onMockupSceneColorChange"
					>
						<template #canvas>
							<div ref="canvasWrapRef" class="mySwiper2 relative w-full h-[620px] overflow-hidden" />
						</template>
					</ProductDesignEditorPanel>

					<p v-if="!formatPresets.length" class="mt-4 text-sm text-amber-700">
						Bu ürün için format bulunamadı (API: canvas_formats).
					</p>

					<ProductDetailTabs />
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

			<ProductRatingReviews />
		</section>
		<section class="mt-20 bg-white">
			<div class="max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-16">
				<div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 md:mb-12">
					<h2 class="text-[#101828] text-2xl md:text-3xl lg:text-4xl font-bold">Bu tabloyu alanlar bunları da aldı</h2>
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
	.product-detail-layout {
		align-items: flex-start;
	}

	.product-detail-editor {
		flex: 1 1 auto;
		min-width: 0;
	}

	.product-detail-sidebar {
		flex: 0 0 380px;
		max-width: 420px;
	}

	@media (max-width: 1024px) {
		.product-detail-layout {
			flex-direction: column;
		}

		.product-detail-sidebar {
			flex: 1 1 auto;
			max-width: none;
			width: 100%;
		}
	}

	:deep(.mySwiper2) {
		width: 100%;
		min-height: 620px;
		height: 620px;
		margin: auto 0;
		background-color: #f5f2ed;
		position: relative;
		display: block;

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
		padding-left: 3rem;
		padding-right: 3rem;

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
