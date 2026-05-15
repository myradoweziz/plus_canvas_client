<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { TempDesignImage } from '~/utils/types'

	const steps = [
		{ icon: 'upload', title: 'Fotoğrafını Yükle', desc: 'Telefonundan veya bilgisayarından sevdiğin fotoğrafı yükle' },
		{ icon: 'palette', title: 'Tablonu Tasarla', desc: 'Boyutunu ve çerçeve stilini seçerek tablonu kişiselleştir' },
		{ icon: 'basket', title: 'Siparişi Ver', desc: 'Siparişini tamamla ve tablonun üretime başlasın' },
		{ icon: 'truck', title: 'Kapına Teslim', desc: 'Özenle hazırlanan kanvas tablon kısa sürede adresine gelsin' }
	]

	const isUploaderOpen = ref(false)

	const openUploader = () => {
		isUploaderOpen.value = true
	}

	const closeUploader = () => {
		isUploaderOpen.value = false
	}

	const router = useRouter()
	const designStore = useProductDesignStore()

	const goNext = async (payload: { images: TempDesignImage[] }) => {
		if (!payload.images.length) return
		const productId = 1
		designStore.setSession(productId, payload.images)
		closeUploader()
		await router.push(`/products/${productId}`)
	}
</script>

<template>
	<section class="max-w-[1400px] mx-auto px-4 md:px-10 py-16 md:py-24 text-center bg-[#f8f9fa]">
		<h2 class="text-2xl md:text-3xl lg:text-[38px] font-bold text-[#1853a0] leading-tight">
			Kendi Kanvas Tablonu Oluşturmak Çok Kolay
		</h2>
		<p class="mt-4 text-gray-500 text-sm md:text-base">
			Sadece birkaç adımda fotoğrafını özel bir kanvas tabloya dönüştür
		</p>

		<div class="relative mt-12 md:mt-20">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative z-10">
				<div v-for="(step, index) in steps" :key="index" class="relative">
					<div
						class="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all p-8 flex flex-col items-center h-full relative z-10"
					>
						<div
							class="w-20 h-20 rounded-full bg-[#f0f5fa] text-[#1853a0] flex flex-col items-center justify-center mb-6 border-[6px] border-white shadow-sm relative z-20"
						>
							<Icon :name="step.icon" class="w-8 h-8 flex justify-center" />
						</div>

						<h3 class="text-[17px] font-bold text-gray-900 mb-3">{{ step.title }}</h3>
						<p class="text-[13px] text-gray-500 leading-relaxed px-2">{{ step.desc }}</p>
					</div>

					<div
						v-if="index !== steps.length - 1"
						class="hidden lg:block absolute top-[36px] left-[calc(50%+36px)] w-[calc(100%+16px-72px)] z-[30] pointer-events-none"
					>
						<Icon name="arrowSteps" class="w-full h-auto" />
					</div>
				</div>
			</div>
		</div>

		<div class="mt-12 md:mt-16">
			<button
				@click="openUploader"
				class="bg-[#1853a0] hover:bg-[#124080] text-white px-10 py-3.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
			>
				Hemen Başla
			</button>
		</div>
	</section>

	<catalog-uploader-modal :is-open="isUploaderOpen" @close="closeUploader" @go-next="goNext" />
</template>

<style scoped></style>
