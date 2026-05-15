<script setup lang="ts">
	import { extractCanvasFormatsFromProduct } from '~/utils/productDesignConfig'
	import type { BreadcrumbItem, Product, ProductDesignPayload } from '~/utils/types'

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
	const canvasFormats = computed(() => extractCanvasFormatsFromProduct(product.value))

	const {
		uploadImages,
		activeImage,
		isThumbActive,
		previewUrl,
		selectUploadImage,
		formatPresets,
		sizeOptions,
		frameOptions,
		applyFormatById,
		applySizeById,
		applyFrameByIndex,
		activeFormatId,
		isFrameActive,
		selectedFormat,
		selectedSize
	} = useProductCanvasEditor({
		productId,
		wrapRef: canvasWrapRef,
		canvasFormats,
		onDesignUpdate
	})

	const onThumbSelect = (index: number) => {
		void selectUploadImage(index)
	}

	const currentPreviewSrc = computed(() => {
		const url = activeImage.value?.url ?? uploadImages.value[0]?.url
		return url ? previewUrl(url) : ''
	})

	onMounted(async () => {
		if (!designStore.hasSessionFor(productId.value)) {
			await router.replace('/products')
		}
	})

	onBeforeRouteLeave((to) => {
		const nextId = to.params.productId
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
						:images="uploadImages"
						:is-thumb-active="isThumbActive"
						:preview-url="previewUrl"
						:format-presets="formatPresets"
						:format-preview-src="currentPreviewSrc"
						:active-format-id="activeFormatId"
						@thumb-select="onThumbSelect"
						@select-format="(id) => void applyFormatById(id)"
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
						:frame-options="frameOptions"
						:selected-format-id="selectedFormat?.id ?? null"
						:selected-size-id="selectedSize?.id ?? null"
						:is-frame-active="isFrameActive"
						@format-change="applyFormatById"
						@size-change="applySizeById"
						@frame-select="applyFrameByIndex"
					/>
				</div>
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
		margin: auto 0;

		.canvas-container {
			margin: 0 auto;
			border-radius: 20px;
			overflow: hidden;
		}
	}
</style>
