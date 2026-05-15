<script setup lang="ts">
	import axios, { isAxiosError } from 'axios'

	import Icon from '~/utils/ui/Icon.vue'

	import type { TempDesignImage } from '~/utils/types'
	import { createUploadSessionId } from '~/utils/uploadSessionId'

	const props = withDefaults(
		defineProps<{
			isOpen: boolean
			/** Maksimum yüklenebilir görsel sayısı; tanımsız = sınırsız */
			maxImages?: number
		}>(),
		{
			maxImages: undefined
		}
	)

	const emit = defineEmits<{
		(e: 'close'): void
		(e: 'go-next', payload: { images: TempDesignImage[] }): void
	}>()

	const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

	type TempUploadApiResponse = {
		message: string
		data: {
			session_id: string
			user_id: number | null
			file_path: string
			original_name: string
			mime_type: string
			size: number
			updated_at: string
			created_at: string
			id: number
			url: string
		}
	}

	type UploadedItem = {
		id: number
		url: string
		progress: number
		isUploading: boolean
		sessionId?: string
		serverId?: number
	}

	const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/pjpeg', 'image/x-png'])

	const fileInput = ref<HTMLInputElement | null>(null)
	const isDragging = ref(false)
	const uploadedImages = ref<UploadedItem[]>([])
	const errorMessage = ref<string | null>(null)
	const uploadSessionId = ref<string | null>(null)

	const getOrCreateUploadSessionId = () => {
		if (!uploadSessionId.value) {
			uploadSessionId.value = createUploadSessionId()
		}
		return uploadSessionId.value
	}

	const resetUploadSessionId = () => {
		uploadSessionId.value = null
	}

	watch(
		() => props.isOpen,
		(open) => {
			if (!open) resetUploadSessionId()
		}
	)

	const hasUploadLimit = computed(() => typeof props.maxImages === 'number' && props.maxImages > 0)

	const remainingUploadSlots = computed(() => {
		if (!hasUploadLimit.value) return Infinity
		return Math.max(0, props.maxImages! - uploadedImages.value.length)
	})

	const canUploadMore = computed(() => remainingUploadSlots.value > 0)

	const showMaxImagesError = () => {
		showError(`En fazla ${props.maxImages} görsel yükleyebilirsiniz.`)
	}

	/** Tam API URL — boş baseUrl ile istek Nuxt origin’e gider ve API’ye ulaşmaz. */
	const getUploadTempUrl = (): string | null => {
		const base = String(useRuntimeConfig().public.baseUrl ?? '')
			.trim()
			.replace(/\/+$/, '')
		if (!base) return null
		return `${base}/api/media/upload-temp`
	}

	const uploadAuthHeaders = (): Record<string, string> => {
		const authCookie = useCookie<string | null>('Authorization', {
			path: '/',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30,
			secure: !import.meta.dev
		})
		const t = typeof authCookie.value === 'string' ? authCookie.value.trim() : ''
		return t ? { Authorization: `Bearer ${t}` } : {}
	}

	const showError = (message: string) => {
		errorMessage.value = message
		window.setTimeout(() => {
			if (errorMessage.value === message) errorMessage.value = null
		}, 4000)
	}

	const openFileSelector = () => {
		if (!canUploadMore.value) {
			showMaxImagesError()
			return
		}
		fileInput.value?.click()
	}

	const queueFilesForUpload = (files: File[]) => {
		if (!files.length) return
		if (!canUploadMore.value) {
			showMaxImagesError()
			return
		}
		const allowed = hasUploadLimit.value ? files.slice(0, remainingUploadSlots.value) : files
		if (allowed.length < files.length) {
			showError(`Yalnızca ${allowed.length} görsel daha eklenebilir (maks. ${props.maxImages}).`)
		}
		allowed.forEach((file) => validateAndUpload(file))
	}

	const uploadTempImage = async (file: File) => {
		const localId = Date.now() + Math.random()
		uploadedImages.value.push({
			id: localId,
			url: '',
			progress: 0,
			isUploading: true
		})

		const sessionId = getOrCreateUploadSessionId()
		const formData = new FormData()
		formData.append('file', file)
		formData.append('session_id', sessionId)

		const uploadUrl = getUploadTempUrl()

		if (!uploadUrl) {
			showError('API adresi eksik: .env içinde BASE_URL tanımlayın (ör. http://sunucu:8000).')
			uploadedImages.value = uploadedImages.value.filter((i) => i.id !== localId)
			return
		}

		try {
			const { data: res } = await axios.post<TempUploadApiResponse>(uploadUrl, formData, {
				headers: uploadAuthHeaders(),
				onUploadProgress: (ev) => {
					const item = uploadedImages.value.find((i) => i.id === localId)
					if (!item) return
					const total = ev.total
					if (total && total > 0) {
						item.progress = Math.min(99, Math.round((ev.loaded * 100) / total))
					}
				}
			})
			const item = uploadedImages.value.find((i) => i.id === localId)
			if (!item) return
			const url = typeof res?.data?.url === 'string' ? res.data.url.trim() : ''
			if (!url) {
				showError('Sunucudan görüntü adresi alınamadı.')
				uploadedImages.value = uploadedImages.value.filter((i) => i.id !== localId)
				return
			}
			item.url = url
			item.serverId = res.data.id
			item.sessionId = res.data.session_id?.trim() || sessionId
			item.progress = 100
			item.isUploading = false
		} catch (e) {
			uploadedImages.value = uploadedImages.value.filter((i) => i.id !== localId)
			if (isAxiosError(e)) {
				const data = e.response?.data as { message?: string } | undefined
				const msg = data?.message ?? e.message
				if (msg) showError(msg)
			} else if (e instanceof Error) {
				showError(e.message)
			} else {
				showError('Yükleme başarısız.')
			}
		}
	}

	const validateAndUpload = (file: File) => {
		if (!canUploadMore.value) {
			showMaxImagesError()
			return
		}
		const mime = (file.type || '').toLowerCase()
		if (mime && !ALLOWED_MIME.has(mime)) {
			showError(`“${file.name}”: yalnızca PNG, JPG, JPEG veya GIF.`)
			return
		}
		if (file.size > MAX_FILE_SIZE_BYTES) {
			const sizeMb = (file.size / 1024 / 1024).toFixed(1)
			showError(`Файл “${file.name}” слишком большой (${sizeMb} MB). Максимум 10 MB.`)
			return
		}
		uploadTempImage(file)
	}

	const handleDrop = (e: DragEvent) => {
		e.preventDefault()
		isDragging.value = false
		const files = e.dataTransfer?.files
		if (files?.length) queueFilesForUpload(Array.from(files))
	}

	const handleFileSelect = (e: Event) => {
		const target = e.target as HTMLInputElement
		const files = target.files
		if (files?.length) queueFilesForUpload(Array.from(files))
		target.value = ''
	}

	const removeImage = (id: number) => {
		uploadedImages.value = uploadedImages.value.filter((img) => img.id !== id)
	}

	const resetUpload = () => {
		uploadedImages.value = []
		resetUploadSessionId()
	}

	const goNext = () => {
		const ready: TempDesignImage[] = uploadedImages.value
			.filter((i) => !i.isUploading && i.url.trim())
			.map((i) => ({
				url: i.url.trim(),
				id: i.serverId ?? 0,
				session_id: i.sessionId ?? ''
			}))
		if (!ready.length) {
			showError('Önce bir görsel yükleyin ve yüklemenin bitmesini bekleyin.')
			return
		}
		emit('go-next', { images: ready })
	}
</script>

<template>
	<Teleport to="body">
		<Transition name="fade">
			<div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
				<!-- Modal Content -->
				<div
					class="relative w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] bg-white md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8 md:p-16"
				>
					<!-- Close Button -->
					<button
						class="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all z-10"
						@click="emit('close')"
					>
						<Icon name="close" class="w-6 h-6" />
					</button>

					<!-- Hidden File Input -->
					<input
						type="file"
						ref="fileInput"
						class="hidden"
						@change="handleFileSelect"
						accept="image/png, image/jpeg, image/jpg, image/gif"
						multiple
					/>

					<!-- Dynamic Content Area -->
					<div class="w-full flex flex-col items-center">
						<!-- 1. Multiple Images Grid State -->
						<div
							v-if="uploadedImages.length > 0"
							class="w-full bg-[#F8F9FB] border border-[#E5E7EB] rounded-[32px] p-6 md:p-10 flex flex-col items-center min-h-[450px]"
						>
							<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
								<!-- Image Thumbnails -->
								<div
									v-for="img in uploadedImages"
									:key="img.id"
									class="relative group aspect-square rounded-2xl shadow-sm border border-gray-100 overflow-hidden bg-gray-50"
									:class="img.url ? 'bg-white' : ''"
								>
									<img v-if="img.url" :src="img.url" :alt="img.url" class="w-full h-full object-cover" />

									<div
										v-if="img.isUploading"
										class="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4"
									>
										<div class="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
											<div
												class="h-full bg-white transition-all duration-150"
												:style="{ width: Math.min(100, Math.max(0, img.progress)) + '%' }"
											/>
										</div>
										<span class="text-[10px] font-bold text-white uppercase tracking-wider"
											>{{ Math.min(100, Math.max(0, Math.round(img.progress))) }}%</span
										>
									</div>

									<button
										v-if="!img.isUploading"
										type="button"
										@click="removeImage(img.id)"
										class="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur shadow-md rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-gray-500 z-[1]"
									>
										<Icon name="close" class="w-4 h-4" />
									</button>
								</div>

								<!-- Add More Card -->
								<button
									v-if="canUploadMore"
									type="button"
									@click="openFileSelector"
									class="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#2B7FFF] hover:bg-blue-50/30 transition-all group"
								>
									<div
										class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#2B7FFF] transition-all"
									>
										<Icon name="plus" class="w-5 h-5 text-gray-400 group-hover:text-white" />
									</div>
									<span class="text-xs font-bold text-gray-400 group-hover:text-[#2B7FFF]">Daha Ekle</span>
								</button>
							</div>

							<!-- Action Footer -->
							<div class="mt-auto pt-10 flex gap-4 w-full justify-center">
								<button
									type="button"
									@click="goNext"
									:disabled="uploadedImages.length === 0 || uploadedImages.some((i) => i.isUploading || !i.url.trim())"
									class="bg-[#2B7FFF] hover:bg-blue-600 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 transition-all min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Devam Et
								</button>
								<button
									@click="resetUpload"
									class="bg-white border border-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all"
								>
									Hepsini Sil
								</button>
							</div>
						</div>

						<!-- 2. Empty / Default State -->
						<div
							v-else
							class="w-full max-w-2xl bg-[#F8F9FB] border-2 border-dashed border-[#E5E7EB] rounded-[32px] p-10 flex flex-col items-center justify-center transition-all duration-300 min-h-[400px]"
							:class="{ 'border-[#2B7FFF] bg-blue-50/30 scale-[1.02]': isDragging }"
							@dragover.prevent="isDragging = true"
							@dragleave.prevent="isDragging = false"
							@drop="handleDrop"
						>
							<div
								class="w-20 h-20 bg-[#2B7FFF] rounded-full flex items-center justify-center shadow-xl shadow-blue-200 mb-8"
							>
								<Icon name="upload" class="w-10 h-10 text-white" />
							</div>

							<h3 class="text-3xl font-black text-[#101828] mb-3">Sürükle & Bırak</h3>
							<p class="text-gray-500 mb-10 text-center font-medium">
								veya alttaki yükleme seçeneklerinden birisini kullan
							</p>

							<button
								class="bg-[#2B7FFF] hover:bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg shadow-blue-100"
								@click="openFileSelector"
							>
								<Icon name="desktop" class="w-6 h-6" />
								Bilgisayarım
							</button>

							<div class="mt-10 flex flex-wrap justify-center gap-4 opacity-40">
								<span class="text-xs font-bold uppercase tracking-widest text-gray-600">
									PNG, JPG, JPEG veya GIF (Maks. 10MB<span v-if="hasUploadLimit">, en fazla {{ maxImages }} görsel</span>)
								</span>
							</div>
						</div>
					</div>

					<!-- Hint Box -->
					<div
						class="mt-12 w-full max-w-2xl bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4"
					>
						<div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
							<Icon name="lightbulb" class="w-5 h-5 text-[#2B7FFF]" />
						</div>
						<p class="text-sm text-gray-600 leading-snug">
							<span class="font-bold text-[#2B7FFF]">İpucu:</span> En iyi sonuç için yüksek çözünürlüklü (300 DPI)
							görüntüler kullanın.
						</p>
					</div>

					<!-- Error Message -->
					<div
						v-if="errorMessage"
						class="mt-4 w-full max-w-2xl bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium"
					>
						{{ errorMessage }}
					</div>

					<div class="mt-12 text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
						© 2026 PlusCanvas. Tüm Hakları Saklıdır.
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
	.fade-enter-active,
	.fade-leave-active {
		transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
	}

	.fade-enter-active .relative,
	.fade-leave-active .relative {
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.fade-enter-from .relative {
		transform: scale(0.9) translateY(20px);
	}

	.fade-leave-to .relative {
		transform: scale(0.9) translateY(20px);
	}
</style>
