<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	type Orientation = 'vertical' | 'horizontal' | 'square'
	type FrameStyle = 'none' | 'black' | 'white' | 'wood'
	type Effect = 'normal' | 'bw' | 'warm'

	type CanvasSize = {
		label: string
		width: number
		height: number
		basePrice: number
	}

	const fileInput = ref<HTMLInputElement | null>(null)
	const uploadedImage = ref<string | null>(null)
	const uploadedFileName = ref('')

	const orientation = ref<Orientation>('vertical')
	const selectedSize = ref('40x60')
	const frameStyle = ref<FrameStyle>('none')
	const thickness = ref(2)
	const effect = ref<Effect>('normal')
	const scale = ref(1)
	const positionX = ref(0)
	const positionY = ref(0)

	const isDragging = ref(false)
	const dragStart = reactive({ x: 0, y: 0, positionX: 0, positionY: 0 })

	const sizes: CanvasSize[] = [
		{ label: '30x40 cm', width: 30, height: 40, basePrice: 299 },
		{ label: '40x60 cm', width: 40, height: 60, basePrice: 399 },
		{ label: '50x70 cm', width: 50, height: 70, basePrice: 549 },
		{ label: '60x90 cm', width: 60, height: 90, basePrice: 749 }
	]

	const orientations: Array<{ value: Orientation; label: string; hint: string }> = [
		{ value: 'vertical', label: 'Dikey', hint: '3:4' },
		{ value: 'horizontal', label: 'Yatay', hint: '4:3' },
		{ value: 'square', label: 'Kare', hint: '1:1' }
	]

	const frames: Array<{ value: FrameStyle; label: string; price: number; className: string }> = [
		{ value: 'none', label: 'Çerçevesiz', price: 0, className: 'border-gray-200 bg-white' },
		{ value: 'black', label: 'Siyah', price: 90, className: 'border-gray-900 bg-gray-900' },
		{ value: 'white', label: 'Beyaz', price: 90, className: 'border-gray-200 bg-white' },
		{ value: 'wood', label: 'Ahşap', price: 130, className: 'border-amber-700 bg-amber-700' }
	]

	const effects: Array<{ value: Effect; label: string }> = [
		{ value: 'normal', label: 'Normal' },
		{ value: 'bw', label: 'Siyah Beyaz' },
		{ value: 'warm', label: 'Sıcak Ton' }
	]

	const selectedSizeDetails = computed(
		() => sizes.find((size) => `${size.width}x${size.height}` === selectedSize.value) ?? sizes[1]
	)
	const selectedFrame = computed(() => frames.find((frame) => frame.value === frameStyle.value) ?? frames[0])

	const canvasDimensions = computed(() => {
		const { width, height } = selectedSizeDetails.value
		const smallerSide = Math.min(width, height)
		const largerSide = Math.max(width, height)

		if (orientation.value === 'square') return { width: largerSide, height: largerSide }
		if (orientation.value === 'horizontal') return { width: largerSide, height: smallerSide }
		return { width: smallerSide, height: largerSide }
	})

	const orientedSizeLabel = computed(() => `${canvasDimensions.value.width}x${canvasDimensions.value.height} cm`)

	const previewBoxStyle = computed(() => {
		const largestConfiguredSide = Math.max(...sizes.map((size) => Math.max(size.width, size.height)))
		const largestCurrentSide = Math.max(canvasDimensions.value.width, canvasDimensions.value.height)
		const width = 300 + (largestCurrentSide / largestConfiguredSide) * 220

		return {
			aspectRatio: `${canvasDimensions.value.width} / ${canvasDimensions.value.height}`,
			maxWidth: `${Math.round(width)}px`
		}
	})

	const imageEffectClass = computed(() => {
		if (effect.value === 'bw') return 'grayscale'
		if (effect.value === 'warm') return 'sepia saturate-125'
		return ''
	})

	const framePreviewClass = computed(() => {
		if (frameStyle.value === 'black') return 'border-gray-950 shadow-[0_16px_40px_rgba(0,0,0,0.24)]'
		if (frameStyle.value === 'white') return 'border-white shadow-[0_16px_40px_rgba(0,0,0,0.14)]'
		if (frameStyle.value === 'wood') return 'border-amber-700 shadow-[0_16px_40px_rgba(120,53,15,0.22)]'
		return 'border-transparent shadow-[0_16px_40px_rgba(0,0,0,0.12)]'
	})

	const frameBorderWidth = computed(() =>
		frameStyle.value === 'none' ? '0px' : `${Math.max(thickness.value, 2) * 3}px`
	)

	const imageTransform = computed(() => `translate(${positionX.value}px, ${positionY.value}px) scale(${scale.value})`)

	const totalPrice = computed(() => {
		const thicknessPrice = thickness.value > 2 ? (thickness.value - 2) * 35 : 0
		const effectPrice = effect.value === 'normal' ? 0 : 40
		return selectedSizeDetails.value.basePrice + selectedFrame.value.price + thicknessPrice + effectPrice
	})

	const triggerUpload = () => fileInput.value?.click()

	const resetImageAdjustments = () => {
		scale.value = 1
		positionX.value = 0
		positionY.value = 0
	}

	const handleFileUpload = (event: Event) => {
		const input = event.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		if (uploadedImage.value) URL.revokeObjectURL(uploadedImage.value)

		uploadedImage.value = URL.createObjectURL(file)
		uploadedFileName.value = file.name
		resetImageAdjustments()
	}

	const removeImage = () => {
		if (uploadedImage.value) URL.revokeObjectURL(uploadedImage.value)
		uploadedImage.value = null
		uploadedFileName.value = ''
		if (fileInput.value) fileInput.value.value = ''
		resetImageAdjustments()
	}

	const setSize = (size: CanvasSize) => {
		selectedSize.value = `${size.width}x${size.height}`
	}

	const beginDrag = (event: PointerEvent) => {
		if (!uploadedImage.value) return
		isDragging.value = true
		dragStart.x = event.clientX
		dragStart.y = event.clientY
		dragStart.positionX = positionX.value
		dragStart.positionY = positionY.value
		;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
	}

	const moveDrag = (event: PointerEvent) => {
		if (!isDragging.value) return
		positionX.value = Math.round(dragStart.positionX + event.clientX - dragStart.x)
		positionY.value = Math.round(dragStart.positionY + event.clientY - dragStart.y)
	}

	const endDrag = (event: PointerEvent) => {
		if (!isDragging.value) return
		isDragging.value = false
		;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
	}

	onBeforeUnmount(() => {
		if (uploadedImage.value) URL.revokeObjectURL(uploadedImage.value)
	})
</script>

<template>
	<main class="min-h-screen bg-[#f8f9fa]">
		<section class="bg-white border-b border-gray-100">
			<div class="max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-14">
				<p class="text-sm font-semibold text-[#5aa4f0]">PlusCanvas Editor</p>
				<div class="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
					<div>
						<h1 class="text-3xl md:text-5xl font-black text-[#215EA5] leading-tight">Kendi Kanvas Tablonu Tasarla</h1>
						<p class="mt-4 max-w-2xl text-[#4A5565]">
							Fotoğrafını yükle, ölçü ve çerçeve seç, görüntüyü kadraja oturt ve siparişe hazır canlı önizlemeyi gör.
						</p>
					</div>

					<div class="bg-[#215EA5] text-white rounded-2xl px-5 py-4 shadow-lg">
						<div class="text-xs uppercase tracking-wide opacity-80">Toplam</div>
						<div class="text-3xl font-black">₺{{ totalPrice }}</div>
					</div>
				</div>
			</div>
		</section>

		<section class="max-w-[1400px] mx-auto px-4 md:px-10 py-8 md:py-12">
			<div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 lg:gap-8">
				<div class="bg-white rounded-[28px] border border-gray-100 shadow-lg p-4 md:p-8">
					<div class="flex items-center justify-between gap-4 mb-5">
						<div>
							<h2 class="text-xl md:text-2xl font-bold text-[#215EA5]">Canlı Önizleme</h2>
							<p class="text-sm text-gray-500 mt-1">
								{{ uploadedImage ? 'Fotoğrafı sürükleyerek kadrajı ayarla.' : 'Başlamak için fotoğraf yükle.' }}
							</p>
						</div>

						<button
							v-if="uploadedImage"
							class="hidden sm:inline-flex text-sm font-semibold text-[#215EA5] hover:underline"
							@click="removeImage"
						>
							Fotoğrafı Kaldır
						</button>
					</div>

					<div class="rounded-[28px] bg-gradient-to-br from-[#f0f5fa] to-white p-4 md:p-8">
						<div class="mx-auto w-full max-w-[520px]">
							<div
								class="relative mx-auto w-full bg-white rounded-[22px] transition-all duration-300"
								:class="framePreviewClass"
								:style="{ ...previewBoxStyle, borderWidth: frameBorderWidth }"
							>
								<div
									class="absolute inset-0 overflow-hidden rounded-[18px] bg-gray-100 touch-none"
									:class="{ 'cursor-grabbing': isDragging, 'cursor-grab': uploadedImage && !isDragging }"
									@pointerdown="beginDrag"
									@pointermove="moveDrag"
									@pointerup="endDrag"
									@pointercancel="endDrag"
								>
									<img
										v-if="uploadedImage"
										:src="uploadedImage"
										:alt="uploadedFileName || 'Uploaded canvas photo'"
										class="w-full h-full object-cover select-none pointer-events-none transition-[filter] duration-300"
										:class="imageEffectClass"
										:style="{ transform: imageTransform }"
										draggable="false"
									/>

									<button
										v-else
										class="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-4 text-center p-6"
										@click="triggerUpload"
									>
										<span class="w-20 h-20 rounded-full bg-[#eaf4ff] text-[#215EA5] flex items-center justify-center">
											<Icon name="upload" class="w-9 h-9" />
										</span>
										<span>
											<span class="block text-lg font-bold text-[#215EA5]">Fotoğrafını Yükle</span>
											<span class="block text-sm text-gray-500 mt-1">PNG, JPG veya WEBP</span>
										</span>
									</button>
								</div>
							</div>

							<input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileUpload" />

							<div class="mt-6 flex flex-col sm:flex-row gap-3">
								<button
									class="flex-1 bg-[#215EA5] hover:bg-[#124080] text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
									@click="triggerUpload"
								>
									<Icon name="upload" class="w-5 h-5" />
									{{ uploadedImage ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle' }}
								</button>
								<button
									class="flex-1 bg-white border border-gray-200 hover:border-[#215EA5] text-[#215EA5] px-5 py-3 rounded-xl font-bold transition-all"
									@click="resetImageAdjustments"
								>
									Kadrajı Sıfırla
								</button>
							</div>

							<div class="mt-4 text-center text-sm font-semibold text-[#4A5565]">
								Seçili ölçü: {{ orientedSizeLabel }}
							</div>

							<div v-if="uploadedImage" class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
								<label class="block">
									<span class="text-sm font-semibold text-[#4A5565]">Yakınlaştır</span>
									<input
										v-model.number="scale"
										type="range"
										min="0.7"
										max="2.4"
										step="0.05"
										class="mt-3 w-full accent-[#215EA5]"
									/>
								</label>
								<label class="block">
									<span class="text-sm font-semibold text-[#4A5565]">Yatay Konum</span>
									<input
										v-model.number="positionX"
										type="range"
										min="-160"
										max="160"
										step="1"
										class="mt-3 w-full accent-[#215EA5]"
									/>
								</label>
								<label class="block">
									<span class="text-sm font-semibold text-[#4A5565]">Dikey Konum</span>
									<input
										v-model.number="positionY"
										type="range"
										min="-160"
										max="160"
										step="1"
										class="mt-3 w-full accent-[#215EA5]"
									/>
								</label>
							</div>
						</div>
					</div>
				</div>

				<aside class="bg-white rounded-[28px] border border-gray-100 shadow-lg p-5 md:p-6 h-fit xl:sticky xl:top-6">
					<h2 class="text-xl md:text-2xl font-bold text-[#215EA5]">Ayarlar</h2>
					<p class="text-sm text-gray-500 mt-1">Ölçü, yön, çerçeve ve efektleri seç.</p>

					<div class="mt-6 space-y-7">
						<div>
							<div class="text-sm font-bold text-[#215EA5] mb-3">Yön</div>
							<div class="grid grid-cols-3 gap-2">
								<button
									v-for="item in orientations"
									:key="item.value"
									class="rounded-xl border px-3 py-3 text-center transition-all"
									:class="
										orientation === item.value
											? 'border-[#215EA5] bg-[#eaf4ff] text-[#215EA5]'
											: 'border-gray-200 text-[#4A5565] hover:border-[#215EA5]/50'
									"
									@click="orientation = item.value"
								>
									<span class="block text-sm font-bold">{{ item.label }}</span>
									<span class="block text-xs opacity-70 mt-1">{{ item.hint }}</span>
								</button>
							</div>
						</div>

						<div>
							<div class="text-sm font-bold text-[#215EA5] mb-3">Ölçü</div>
							<div class="grid grid-cols-2 gap-2">
								<button
									v-for="size in sizes"
									:key="size.label"
									class="rounded-xl border px-3 py-3 text-left transition-all"
									:class="
										selectedSize === `${size.width}x${size.height}`
											? 'border-[#215EA5] bg-[#eaf4ff]'
											: 'border-gray-200 hover:border-[#215EA5]/50'
									"
									@click="setSize(size)"
								>
									<span class="block text-sm font-bold text-[#215EA5]">{{ size.label }}</span>
									<span class="block text-xs text-gray-500 mt-1">₺ {{ size.basePrice }}</span>
								</button>
							</div>
						</div>

						<div>
							<div class="text-sm font-bold text-[#215EA5] mb-3">Çerçeve</div>
							<div class="grid grid-cols-2 gap-2">
								<button
									v-for="frame in frames"
									:key="frame.value"
									class="rounded-xl border px-3 py-3 text-left transition-all"
									:class="
										frameStyle === frame.value
											? 'border-[#215EA5] bg-[#eaf4ff]'
											: 'border-gray-200 hover:border-[#215EA5]/50'
									"
									@click="frameStyle = frame.value"
								>
									<span class="flex items-center gap-2">
										<span class="w-5 h-5 rounded-md border-4" :class="frame.className" />
										<span class="text-sm font-bold text-[#4A5565]">{{ frame.label }}</span>
									</span>
									<span class="block text-xs text-gray-500 mt-2">{{
										frame.price ? `+₺${frame.price}` : 'Ücretsiz'
									}}</span>
								</button>
							</div>
						</div>

						<label class="block">
							<span class="text-sm font-bold text-[#215EA5]">Kanvas Kalınlığı: {{ thickness }} cm</span>
							<input
								v-model.number="thickness"
								type="range"
								min="2"
								max="5"
								step="1"
								class="mt-3 w-full accent-[#215EA5]"
							/>
						</label>

						<div>
							<div class="text-sm font-bold text-[#215EA5] mb-3">Efekt</div>
							<div class="grid grid-cols-3 gap-2">
								<button
									v-for="item in effects"
									:key="item.value"
									class="rounded-xl border px-3 py-3 text-sm font-bold transition-all"
									:class="
										effect === item.value
											? 'border-[#215EA5] bg-[#eaf4ff] text-[#215EA5]'
											: 'border-gray-200 text-[#4A5565] hover:border-[#215EA5]/50'
									"
									@click="effect = item.value"
								>
									{{ item.label }}
								</button>
							</div>
						</div>

						<div class="rounded-2xl bg-[#f8f9fa] border border-gray-100 p-4">
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-500">Ölçü</span>
								<span class="font-bold text-[#4A5565]">{{ orientedSizeLabel }}</span>
							</div>
							<div class="flex items-center justify-between text-sm mt-2">
								<span class="text-gray-500">Çerçeve</span>
								<span class="font-bold text-[#4A5565]">{{ selectedFrame.label }}</span>
							</div>
							<div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
								<span class="font-bold text-[#215EA5]">Toplam</span>
								<span class="text-2xl font-black text-[#215EA5]">₺{{ totalPrice }}</span>
							</div>
						</div>

						<button
							class="w-full bg-[#5aa4f0] hover:bg-[#215EA5] text-white py-3.5 rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-md"
						>
							<Icon name="basket" class="w-5 h-5 text-white" />
							Sepete Ekle
						</button>
					</div>
				</aside>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>
	input[type='range'] {
		cursor: pointer;
	}
</style>
