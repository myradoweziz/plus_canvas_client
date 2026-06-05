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
		isCanvasLoading?: boolean
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

	// New premium interactive features
	const copied = ref(false)
	const isFavorited = ref(false)
	const isAddingToCart = ref(false)
	const showToast = ref(false)
	const toastMessage = ref('')
	const toastSubMessage = ref('')

	const copyProductCode = async () => {
		if (!props.product.product_qode) return
		try {
			await navigator.clipboard.writeText(props.product.product_qode)
			copied.value = true
			setTimeout(() => {
				copied.value = false
			}, 2000)
		} catch (err) {
			console.error('Failed to copy code: ', err)
		}
	}

	const triggerToast = (msg: string, subMsg = '') => {
		toastMessage.value = msg
		toastSubMessage.value = subMsg
		showToast.value = true
		setTimeout(() => {
			showToast.value = false
		}, 3500)
	}

	const toggleFavorite = () => {
		isFavorited.value = !isFavorited.value
		triggerToast(
			isFavorited.value ? 'Favorilere Eklendi!' : 'Favorilerden Çıkarıldı!',
			`"${props.product.name}" favori listenize ${isFavorited.value ? 'eklendi' : 'çıkarıldı'}.`
		)
	}

	const addToCart = () => {
		if (isAddingToCart.value) return
		isAddingToCart.value = true
		setTimeout(() => {
			isAddingToCart.value = false
			const size = props.sizeOptions.find((s) => s.id === props.selectedSizeId)
			const sizeLabel = size?.display_name || 'Standart'
			const frameLabel = selectedFrame.value?.name || 'Çerçevesiz'

			triggerToast(
				'Sepete Eklendi!',
				`Ürün: ${props.product.name}\nBoyut: ${sizeLabel}\nÇerçeve: ${frameLabel}\nFiyat: ${displayPrice.value}₺`
			)
		}, 1000)
	}
</script>

<template>
	<div class="w-full relative">
		<!-- Glassmorphic Premium Toast Notification -->
		<Transition name="toast">
			<div
				v-if="showToast"
				class="fixed top-6 right-6 z-[9999] flex items-start gap-4 max-w-sm w-full bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20"
			>
				<div
					class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#2B7FFF]/10 text-[#2B7FFF]"
				>
					<Icon name="favorite" class="w-6 h-6 text-red-500 fill-current" v-if="toastMessage.includes('Favorilere')" />
					<Icon name="basket" class="w-6 h-6 text-[#2B7FFF]" v-else-if="toastMessage.includes('Sepete')" />
					<Icon name="checkCircle" class="w-6 h-6 text-green-600" v-else />
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-bold text-gray-900">{{ toastMessage }}</p>
					<p class="mt-1 text-xs text-gray-500 whitespace-pre-line leading-relaxed">
						{{ toastSubMessage }}
					</p>
				</div>
				<button @click="showToast = false" class="text-gray-400 hover:text-gray-600 transition-colors">
					<Icon name="close" class="w-4 h-4" />
				</button>
			</div>
		</Transition>

		<h1 class="font-semibold text-4xl text-gray-950">{{ product.name }}</h1>

		<div class="flex items-center gap-2 mt-3">
			<Icon name="star" class="w-6 h-6 text-yellow-400" />
			<span class="text-[#8e8e8e] font-semibold text-sm">
				4.8 •
				<span class="underline hover:text-[#2B7FFF] cursor-pointer transition-colors">22 Değerlendirme</span>
			</span>
		</div>

		<!-- Interactive Copy Code Button -->
		<button
			type="button"
			class="mt-4 text-sm text-[#B3B3B3] hover:text-[#2B7FFF] transition-colors flex items-center gap-2 cursor-pointer outline-none select-none group"
			@click="copyProductCode"
		>
			<span
				>Ürün Kodu:
				<span class="font-bold text-gray-700 group-hover:text-[#2B7FFF] transition-colors">{{
					product.product_qode
				}}</span></span
			>
			<Icon name="copyIcon" class="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
			<Transition name="fade">
				<span
					v-if="copied"
					class="text-xs text-green-600 font-bold ml-2 bg-green-50 px-2 py-0.5 rounded-md border border-green-200"
					>Kopyalandı!</span
				>
			</Transition>
		</button>

		<div class="relative mt-8" :class="{ 'pointer-events-none': isCanvasLoading }">
			<div class="text-sm font-bold text-gray-950 uppercase tracking-wider">Boyut Seçin</div>
			<div class="mt-2 relative w-full max-w-[220px]">
				<select
					name="size"
					:value="selectedSizeId ?? ''"
					class="pcSelect w-full appearance-none bg-[#B3B3B322] hover:bg-[#B3B3B333] rounded-full py-3.5 pl-6 pr-12 font-bold text-[#101828] outline-none transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
					:disabled="!sizeOptions.length || isCanvasLoading"
					@change="onSizeChange"
				>
					<option v-for="size in sizeOptions" :key="size.id" :value="size.id">
						{{ size.display_name }}
					</option>
				</select>
				<div class="pointer-events-none absolute inset-y-0 right-5 flex items-center text-gray-500">
					<Icon name="arrowRight" class="w-4 h-4 rotate-90" />
				</div>
			</div>

			<div class="mt-8 text-sm font-bold text-gray-950 uppercase tracking-wider">Çerçeve Seçin</div>
			<div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 mt-3">
			<button
				v-for="(frame, index) in frames"
				:key="frame.id"
				type="button"
				class="frame-tile group relative aspect-square w-full overflow-hidden rounded-xl border-2 cursor-pointer transition-[border-color,box-shadow] duration-200 hover:border-[#2B7FFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B7FFF] disabled:cursor-not-allowed"
				:disabled="isCanvasLoading"
				:class="
					isFrameActive(frame.id)
						? 'frame-tile--active border-[#2B7FFF] ring-4 ring-[#2B7FFF]/10'
						: 'border-gray-200'
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
			<div
				v-if="isCanvasLoading"
				class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/55 backdrop-blur-[1px]"
				aria-live="polite"
				aria-busy="true"
			>
				<svg
					class="h-8 w-8 animate-spin text-[#2B7FFF]"
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
			</div>
		</div>

		<div class="mt-8 flex items-center gap-5">
			<span class="text-4xl font-extrabold text-[#101828]">{{ displayPrice }}₺</span>
			<span v-if="product.discount > 0" class="text-2xl line-through text-[#B3B3B3]">{{ product.price }}₺</span>
		</div>

		<!-- Interactive Add To Cart and Favorites Controls -->
		<div class="mt-6 flex items-center gap-3">
			<button
				type="button"
				@click="addToCart"
				class="bg-[#2B7FFF] hover:bg-[#2B7FFF]/90 active:scale-[0.98] rounded-full p-4 py-3.5 transition-all text-white font-bold text-lg w-full max-w-[300px] shadow-lg shadow-[#2B7FFF]/20 flex items-center justify-center gap-2 cursor-pointer"
				:disabled="isAddingToCart"
			>
				<template v-if="isAddingToCart">
					<svg
						class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Ekleniyor...
				</template>
				<template v-else> Sepete Ekle </template>
			</button>
			<button
				type="button"
				@click="toggleFavorite"
				class="flex items-center justify-center rounded-full w-[54px] h-[54px] border-2 transition-all active:scale-[0.9] cursor-pointer shadow-md"
				:class="
					isFavorited
						? 'bg-red-50 border-red-200 text-red-500 shadow-red-100 scale-105'
						: 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50'
				"
			>
				<Icon
					name="favorite"
					class="w-6 h-6 transition-transform"
					:class="isFavorited ? 'scale-110 fill-current' : ''"
				/>
			</button>
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
		border-color: #2b7fff !important;
	}

	/* Toast Transition */
	.toast-enter-active,
	.toast-leave-active {
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.toast-enter-from {
		opacity: 0;
		transform: translateY(-20px) scale(0.95);
	}

	.toast-leave-to {
		opacity: 0;
		transform: translateY(-20px) scale(0.95);
	}

	/* Fade Transition */
	.fade-enter-active,
	.fade-leave-active {
		transition: opacity 0.25s ease;
	}
	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
	}
</style>
