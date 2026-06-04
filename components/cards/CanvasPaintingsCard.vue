<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import { extractCollageLayoutFromProduct, getProductImageUrl } from '~/utils/collageLayout'
	import type { Image, Product, TempDesignImage } from '~/utils/types'
	import { CANVAS_PAINTING_CATEGORY_SLUG } from '~/utils/types/category'

	const props = withDefaults(
		defineProps<{
			product: Product
			showButton?: boolean
			delegateUploader?: boolean
		}>(),
		{ delegateUploader: false }
	)

	const emit = defineEmits<{
		(e: 'openUploader', product: Product): void
	}>()

	const router = useRouter()

	const isUploaderOpen = ref(false)

	const openUploader = () => {
		if (props.delegateUploader) {
			emit('openUploader', props.product)
			return
		}
		if (props.product.main_category?.slug === CANVAS_PAINTING_CATEGORY_SLUG) {
			router.push(`/products/${props.product.id}`)
			return
		}
		isUploaderOpen.value = true
	}

	const closeUploader = () => {
		isUploaderOpen.value = false
	}

	const designStore = useProductDesignStore()

	const goNext = async (payload: { images: TempDesignImage[] }) => {
		if (!payload.images.length) return
		designStore.setSession(props.product.id, payload.images)
		closeUploader()
		await router.push(`/products/editor/${props.product.id}`)
	}

	const discountedPrice = computed(() => {
		return Math.round(props.product.price - (props.product.price * props.product.discount) / 100)
	})

	/** Лимит загрузки из API; 0 или меньше — без ограничения в модалке */
	const uploadMaxImages = computed(() => {
		const n = props.product.upload_image_count
		return typeof n === 'number' && n > 0 ? n : undefined
	})

	const cardImages = computed(() => {
		const list = Array.isArray(props.product.images) ? props.product.images : []
		return list.map((img) => getProductImageUrl(img as Image)).filter((url) => url.length > 0)
	})

	const hasCollageLayout = computed(() => {
		const layout = extractCollageLayoutFromProduct(props.product)
		return (layout?.layout_json.length ?? 0) > 0
	})
</script>

<template>
	<div class="flex flex-col h-full min-h-0">
		<div class="group flex flex-col h-full rounded-2xl cursor-pointer" @click="openUploader">
			<!-- Картинка -->
			<div
				class="canvas-card-media relative w-full rounded-2xl overflow-hidden aspect-[4/5]"
				:class="!hasCollageLayout ? 'canvas-card-media--collage' : 'bg-gray-100'"
			>
				<template v-if="!hasCollageLayout">
					<img
						src="/images/product-card-bg.svg"
						alt=""
						class="canvas-card-media__bg absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
						aria-hidden="true"
					/>
					<img
						v-for="(src, index) in cardImages"
						:key="`${product.id}-${index}`"
						:src="src"
						:alt="product.name"
						class="canvas-card-media__photo relative z-[1] w-full h-full object-contain p-3 md:p-4 transition-transform duration-500 group-hover:scale-[1.02]"
					/>
				</template>
				<template v-else>
					<img
						v-for="(src, index) in cardImages"
						:key="`${product.id}-${index}`"
						:src="src"
						:alt="product.name"
						class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
				</template>

				<!-- Бейдж скидки -->
				<div
					v-if="product.discount > 0"
					class="absolute top-4 left-4 bg-[#1853a0] text-white text-[11px] md:text-[12px] font-bold px-2 py-1 rounded-md z-10"
				>
					-{{ product.discount }}%
				</div>

				<!-- Кнопки действий -->
				<div
					class="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
				>
					<button
						class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-[#1853a0] hover:text-white transition-all text-[#1853a0]"
					>
						<Icon name="eye" class="w-4 h-4 md:w-5 md:h-5" />
					</button>
					<button
						class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition-all text-[#1853a0]"
					>
						<Icon name="heart" class="w-4 h-4 md:w-5 md:h-5" />
					</button>
				</div>
			</div>

			<!-- Инфа -->
			<div class="flex flex-col flex-grow pt-4">
				<h3
					class="text-[15px] md:text-[16px] font-semibold text-gray-900 leading-snug hover:text-[#1853a0] transition-colors"
				>
					{{ product.name }}
				</h3>
				<div class="flex items-center gap-2 mt-1.5 md:mt-2">
					<span v-if="product.discount > 0" class="text-sm md:text-[14px] font-medium text-gray-400 line-through"
						>₺{{ product.price }}</span
					>
					<span class="text-lg md:text-[18px] font-bold text-[#1853a0]">₺{{ discountedPrice }}</span>
				</div>

				<!-- Кнопка -->
				<div v-if="showButton" class="mt-auto pt-4">
					<button
						class="w-full bg-[#1853a0] hover:bg-[#124080] text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm md:text-[14px] shadow-sm hover:shadow-md"
					>
						<Icon name="basket" class="w-4 h-4 text-white" />
						Sepete Ekle
					</button>
				</div>
			</div>
		</div>

		<!-- Uploader Modal -->
		<catalog-uploader-modal
			v-if="!delegateUploader"
			:is-open="isUploaderOpen"
			:max-images="uploadMaxImages"
			@close="closeUploader"
			@go-next="goNext"
		/>
	</div>
</template>

<style lang="scss" scoped>
	.canvas-card-media--collage {
		background-color: #d4d4d4;
	}

	.canvas-card-media__bg {
		z-index: 0;
	}

	.canvas-card-media__photo {
		object-position: center;
	}
</style>
