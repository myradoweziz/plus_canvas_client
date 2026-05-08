<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	defineProps<{
		isOpen: boolean
	}>()

	const emit = defineEmits<{
		(e: 'close'): void
		(e: 'go-next'): void
	}>()

	const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

	const fileInput = ref<HTMLInputElement | null>(null)
	const isDragging = ref(false)
	const uploadedImages = ref<{ id: number; url: string; progress: number; isUploading: boolean }[]>([])
	const errorMessage = ref<string | null>(null)

	const showError = (message: string) => {
		errorMessage.value = message
		window.setTimeout(() => {
			if (errorMessage.value === message) errorMessage.value = null
		}, 4000)
	}

	const openFileSelector = () => {
		fileInput.value?.click()
	}

	const simulateUpload = (file: File) => {
		const id = Date.now() + Math.random()
		const newImage = {
			id,
			url: '',
			progress: 0,
			isUploading: true
		}
		uploadedImages.value.push(newImage)

		// Create preview
		const reader = new FileReader()
		reader.onload = (e) => {
			const targetImage = uploadedImages.value.find((img) => img.id === id)
			if (targetImage) {
				targetImage.url = e.target?.result as string
			}
		}
		reader.readAsDataURL(file)

		// Simulate progress
		const interval = setInterval(() => {
			const targetImage = uploadedImages.value.find((img) => img.id === id)
			if (!targetImage) {
				clearInterval(interval)
				return
			}

			targetImage.progress += Math.floor(Math.random() * 20) + 10
			if (targetImage.progress >= 100) {
				targetImage.progress = 100
				clearInterval(interval)
				setTimeout(() => {
					targetImage.isUploading = false
				}, 500)
			}
		}, 300)
	}

	const validateAndUpload = (file: File) => {
		if (file.size > MAX_FILE_SIZE_BYTES) {
			const sizeMb = (file.size / 1024 / 1024).toFixed(1)
			showError(`Файл “${file.name}” слишком большой (${sizeMb} MB). Максимум 10 MB.`)
			return
		}
		simulateUpload(file)
	}

	const handleDrop = (e: DragEvent) => {
		e.preventDefault()
		isDragging.value = false
		const files = e.dataTransfer?.files
		if (files) {
			Array.from(files).forEach((file) => validateAndUpload(file))
		}
	}

	const handleFileSelect = (e: Event) => {
		const target = e.target as HTMLInputElement
		const files = target.files
		if (files) {
			Array.from(files).forEach((file) => validateAndUpload(file))
		}
		target.value = ''
	}

	const removeImage = (id: number) => {
		uploadedImages.value = uploadedImages.value.filter((img) => img.id !== id)
	}

	const resetUpload = () => {
		uploadedImages.value = []
	}

	const goNext = () => {
		emit('go-next')
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
									class="relative group aspect-square bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
								>
									<img v-if="img.url" :src="img.url" class="w-full h-full object-cover" />

									<!-- Progress Overlay -->
									<div
										v-if="img.isUploading"
										class="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4"
									>
										<div class="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
											<div
												class="h-full bg-white transition-all duration-300"
												:style="{ width: img.progress + '%' }"
											></div>
										</div>
										<span class="text-[10px] font-bold text-white uppercase tracking-wider">{{ img.progress }}%</span>
									</div>

									<!-- Remove Button -->
									<button
										v-if="!img.isUploading"
										@click="removeImage(img.id)"
										class="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur shadow-md rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-gray-500"
									>
										<Icon name="close" class="w-4 h-4" />
									</button>
								</div>

								<!-- Add More Card -->
								<button
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
									@click="goNext"
									:disabled="uploadedImages.length === 0"
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
									PNG, JPG, JPEG veya GIF (Maks. 10MB)
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
