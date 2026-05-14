<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { ProductDesignPayload } from '~/utils/types'

	const props = withDefaults(
		defineProps<{
			canvasWidth?: number
			canvasHeight?: number
		}>(),
		{ canvasWidth: 560, canvasHeight: 420 }
	)

	const emit = defineEmits<{
		(e: 'update:design', payload: ProductDesignPayload): void
	}>()

	const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/pjpeg', 'image/x-png'])
	const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

	const { uploadFileSafe } = useMediaUploadTemp()

	const wrapRef = ref<HTMLDivElement | null>(null)
	const fileInput = ref<HTMLInputElement | null>(null)
	const errorMessage = ref<string | null>(null)
	const isBusy = ref(false)
	const lastTemp = ref<{ url: string; id: number; session_id: string } | null>(null)

	let fabricLib: typeof import('fabric').fabric | null = null
	let fabricCanvas: import('fabric').fabric.Canvas | null = null
	let photoObject: import('fabric').fabric.Image | null = null

	const showError = (message: string) => {
		errorMessage.value = message
		window.setTimeout(() => {
			if (errorMessage.value === message) errorMessage.value = null
		}, 4500)
	}

	const disposeCanvas = () => {
		if (fabricCanvas) {
			try {
				fabricCanvas.dispose()
			} catch {
				/* noop */
			}
			fabricCanvas = null
		}
		photoObject = null
		if (wrapRef.value) wrapRef.value.innerHTML = ''
	}

	const buildPayload = (): ProductDesignPayload | null => {
		if (!fabricCanvas || !fabricLib) return null
		const fabricJson = fabricCanvas.toJSON() as Record<string, unknown>
		return {
			fabric: fabricJson,
			tempImage: lastTemp.value,
			canvasWidth: props.canvasWidth,
			canvasHeight: props.canvasHeight
		}
	}

	const emitDesign = () => {
		const p = buildPayload()
		if (p) emit('update:design', p)
	}

	const initCanvas = async () => {
		if (!import.meta.client || !wrapRef.value) return
		disposeCanvas()
		const mod = await import('fabric')
		const fabric = mod.fabric
		fabricLib = fabric

		const el = document.createElement('canvas')
		wrapRef.value.appendChild(el)

		fabricCanvas = new fabric.Canvas(el, {
			width: props.canvasWidth,
			height: props.canvasHeight,
			backgroundColor: '#F5F2ED',
			preserveObjectStacking: true,
			selection: true
		})

		fabricCanvas.on('object:modified', () => emitDesign())
		fabricCanvas.on('text:changed', () => emitDesign())
		emitDesign()
	}

	const addImageFromUrl = (url: string) => {
		if (!fabricCanvas || !fabricLib) return
		const fabric = fabricLib
		fabric.Image.fromURL(
			url,
			(img) => {
				if (!fabricCanvas) return
				if (photoObject) {
					fabricCanvas.remove(photoObject)
					photoObject = null
				}
				const maxW = props.canvasWidth * 0.92
				const maxH = props.canvasHeight * 0.92
				const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1)
				img.set({
					scaleX: scale,
					scaleY: scale,
					originX: 'center',
					originY: 'center',
					left: props.canvasWidth / 2,
					top: props.canvasHeight / 2,
					cornerStyle: 'circle',
					transparentCorners: false
				})
				img.setControlsVisibility({ mtr: true })
				fabricCanvas.add(img)
				fabricCanvas.setActiveObject(img)
				photoObject = img
				fabricCanvas.requestRenderAll()
				emitDesign()
			},
			{ crossOrigin: 'anonymous' }
		)
	}

	const addText = () => {
		if (!fabricCanvas || !fabricLib) return
		const fabric = fabricLib
		const text = new fabric.IText('Metin', {
			left: props.canvasWidth / 2,
			top: props.canvasHeight / 2,
			originX: 'center',
			originY: 'center',
			fill: '#215EA5',
			fontFamily: 'Inter, system-ui, sans-serif',
			fontSize: 28,
			fontWeight: 'bold'
		})
		fabricCanvas.add(text)
		fabricCanvas.setActiveObject(text)
		fabricCanvas.requestRenderAll()
		emitDesign()
	}

	const openFile = () => fileInput.value?.click()

	const onFile = async (e: Event) => {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		input.value = ''
		if (!file) return
		const mime = (file.type || '').toLowerCase()
		if (mime && !ALLOWED_MIME.has(mime)) {
			showError('Yalnızca PNG, JPG, JPEG veya GIF.')
			return
		}
		if (file.size > MAX_FILE_SIZE_BYTES) {
			showError(`Dosya çok büyük (maks. ${(MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)} MB).`)
			return
		}
		isBusy.value = true
		const res = await uploadFileSafe(file)
		isBusy.value = false
		if ('error' in res) {
			showError(res.error)
			return
		}
		lastTemp.value = { url: res.url, id: res.id, session_id: res.session_id }
		if (!fabricCanvas) await initCanvas()
		addImageFromUrl(res.url)
	}

	const exportPng = () => {
		if (!fabricCanvas) return
		try {
			const dataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 1 })
			const a = document.createElement('a')
			a.href = dataUrl
			a.download = 'pluscanvas-tasarim.png'
			a.click()
		} catch {
			showError('PNG dışa aktarılamadı (CORS veya boş tuval).')
		}
	}

	onMounted(async () => {
	 await initCanvas()
	})

	onUnmounted(() => {
		disposeCanvas()
		fabricLib = null
	})
</script>

<template>
	<div class="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
		<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
			<div>
				<h2 class="text-lg font-bold text-[#101828]">Tasarım editörü</h2>
				<p class="text-sm text-gray-500 mt-1">
					Görsel yükleyin, sürükleyin, döndürün; metin ekleyin. Fabric.js ile önizleme.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<input
					ref="fileInput"
					type="file"
					class="hidden"
					accept="image/png,image/jpeg,image/jpg,image/gif"
					@change="onFile"
				/>
				<button
					type="button"
					class="px-4 py-2 rounded-xl bg-[#215EA5] text-white text-sm font-semibold hover:bg-[#1a4d8a] transition-colors disabled:opacity-50"
					:disabled="isBusy"
					@click="openFile"
				>
					{{ isBusy ? 'Yükleniyor…' : 'Görsel yükle' }}
				</button>
				<button
					type="button"
					class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#101828] hover:bg-gray-50 transition-colors"
					@click="addText"
				>
					Metin ekle
				</button>
				<button
					type="button"
					class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#101828] hover:bg-gray-50 transition-colors"
					@click="exportPng"
				>
					PNG indir
				</button>
			</div>
		</div>

		<p v-if="errorMessage" class="mb-3 text-sm text-red-600 flex items-center gap-2">
			<Icon name="close" class="w-4 h-4 shrink-0" />
			{{ errorMessage }}
		</p>

		<div
			ref="wrapRef"
			class="mx-auto rounded-xl overflow-hidden border border-gray-100 bg-[#F5F2ED] flex justify-center items-center min-h-[200px]"
			:style="{ maxWidth: canvasWidth + 'px' }"
		/>
	</div>
</template>
