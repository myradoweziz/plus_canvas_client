<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	const faqs = [
		{
			question: 'Kanvas tablo nedir ve nasıl üretilir?',
			answer:
				'PlusCanvas® ile kendi fotoğraflarınızı veya seçtiğiniz sanat eserlerini kanvas tablo olarak bastırabilirsiniz. %100 pamuklu kanvas bezi üzerine yüksek çözünürlüklü baskı yapılır ve fırınlanmış ahşap şaseye gerilerek el işçiliği ile hazırlanır.'
		},
		{
			question: 'Teslimat süresi ne kadar?',
			answer:
				'Siparişleriniz genellikle 24-48 saat içinde üretime alınır ve 2-4 iş günü içinde kargo ile adresinize teslim edilir.'
		},
		{
			question: 'Fotoğraf kalitesi nasıl olmalı?',
			answer:
				'En iyi sonuçlar için fotoğraflarınızın yüksek çözünürlüklü olması önerilir. Yükleme sırasında otomatik kalite kontrolü sistemimiz sizi bilgilendirecektir.'
		},
		{
			question: 'İade ve değişim politikanız nedir?',
			answer:
				'Kişiye özel üretilen ürünlerde üretim hatası dışında iade kabul edilememektedir. Hasarlı teslimat durumunda ücretsiz değişim garantimiz bulunmaktadır.'
		},
		{
			question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
			answer:
				'Tüm kredi kartları ile 12 aya varan taksit seçenekleri, banka kartı ve havale/EFT ile ödeme yapabilirsiniz.'
		}
	]

	const activeIndex = ref(0)

	const toggle = (index: number) => {
		activeIndex.value = activeIndex.value === index ? -1 : index
	}
</script>

<template>
	<section class="max-w-[1400px] mx-auto px-4 md:px-10 py-16 md:py-24">
		<!-- Başlık -->
		<div class="text-center mb-12">
			<h2 class="text-2xl md:text-3xl lg:text-[38px] font-bold text-[#1853a0]">Sıkça Sorulan Sorular</h2>
			<p class="mt-4 text-gray-500 text-sm md:text-base">Merak ettiklerinizin yanıtlarını burada bulabilirsiniz</p>
		</div>

		<!-- Akordeon Listesi -->
		<div class="max-w-4xl mx-auto space-y-4">
			<div
				v-for="(faq, index) in faqs"
				:key="index"
				class="overflow-hidden rounded-xl border border-gray-100 shadow-sm"
			>
				<button
					@click="toggle(index)"
					class="w-full flex items-center justify-between p-6 text-left transition-all duration-300"
					:class="activeIndex === index ? 'bg-[#1853a0] text-white' : 'bg-white text-gray-800 hover:bg-gray-50'"
				>
					<span class="font-bold text-[15px] md:text-base leading-snug">{{ faq.question }}</span>
					<Icon
						name="arrowBottom"
						class="w-3.5 h-3.5 transition-transform duration-300"
						:class="activeIndex === index ? 'rotate-180' : ''"
					/>
				</button>

				<div
					v-show="activeIndex === index"
					class="p-6 bg-white text-gray-600 text-sm md:text-[15px] leading-relaxed border-t border-gray-50"
				>
					{{ faq.answer }}
				</div>
			</div>
		</div>

		<!-- SEO Metni Bölümü -->
	</section>
</template>
