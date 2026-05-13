<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { ContactInfo } from '~/utils/types'

	defineProps<{
		contactInfo: ContactInfo
	}>()

	const homeStore = useHomeStore()

	console.log(homeStore.personalizedCanvasPaintingsCategories)

	const footerLinks = reactive({
		gallery: [
			{ name: 'Çok Satan Tablolar', href: '#' },
			{ name: 'Yeni Tablolar', href: '#' },
			{ name: 'Başyapıt Tablolar', href: '#' },
			{ name: 'Modern Sanat Tabloları', href: '#' },
			{ name: 'Manzara Tabloları', href: '#' },
			{ name: 'Çiçek Tabloları', href: '#' },
			{ name: 'Soyut Tablolar', href: '#' },
			{ name: 'İstanbul Tabloları', href: '#' }
		],
		personalized: [
			{ name: 'Fotoğrafından Tablo', href: '#' },
			{ name: 'Sevgiliye Fotoğraf Hediyesi', href: '#' },
			{ name: 'Mozaik Fotoğraflı Tablo', href: '#' },
			{ name: 'Evlilik ve Nişan Fotoğrafları', href: '#' },
			{ name: 'Bebek ve Çocuk Fotoğrafları', href: '#' },
			{ name: 'Doğum Günü Foto Hediyesi', href: '#' },
			{ name: 'Anılar için Hediye', href: '#' }
		],
		about: [
			{ name: 'Biz Kimiz?', href: '/about' },
			{ name: 'Garanti', href: '#' },
			{ name: 'Teslimat', href: '#' },
			{ name: 'Üyelik Bilgileri', href: '#' },
			{ name: 'Bize Ulaşın', href: '#' },
			{ name: 'BLOG', href: '#' }
		]
	})

	watchEffect(() => {
		footerLinks.gallery = homeStore.canvasPaintingCategories.map((category) => ({
			name: category.name,
			href: `/products?category_id=${category.id}`
		}))
		footerLinks.personalized = homeStore.personalizedCanvasPaintingsCategories.map((category) => ({
			name: category.name,
			href: `/products?category_id=${category.id}`
		}))
	})

	const topLinks = [
		{ name: 'Hesabım', href: '#' },
		{ name: 'Sipariş Takibi', href: '#' }
	]

	const bottomLinks = [
		{ name: 'Gizlilik Politikası', href: '#' },
		{ name: 'Kullanım Koşulları', href: '#' },
		{ name: 'Kargo & İade', href: '#' }
	]
</script>

<template>
	<footer class="bg-white">
		<!-- Features Section -->
		<div class="border-b border-gray-100">
			<div class="max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-16">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
					<!-- Feature 1 -->
					<div class="flex flex-col items-center text-center">
						<div class="text-[#215EA5] mb-4">
							<Icon name="footerCard" class="w-14 h-14 md:w-16 md:h-16" />
						</div>
						<h3 class="font-bold text-[#101828] text-base md:text-lg mb-2">Taksitli ödeme</h3>
						<p class="text-gray-500 text-sm md:text-[15px] leading-relaxed max-w-[280px]">
							Banka havalesi veya kredi kartı ile ödeme. 3, 6 veya 9 taksit imkanı.
						</p>
					</div>
					<!-- Feature 2 -->
					<div class="flex flex-col items-center text-center">
						<div class="text-[#215EA5] mb-4">
							<Icon name="footerBus" class="w-14 h-14 md:w-16 md:h-16" />
						</div>
						<h3 class="font-bold text-[#101828] text-base md:text-lg mb-2">Kargo bedava</h3>
						<p class="text-gray-500 text-sm md:text-[15px] leading-relaxed max-w-[280px]">
							Tüm Türkiye'ye hızlı kargo bedava 2 iş gününde kargoda.
						</p>
					</div>
					<!-- Feature 3 -->
					<div class="flex flex-col items-center text-center">
						<div class="text-[#215EA5] mb-4">
							<Icon name="footerMedal" class="w-14 h-14 md:w-16 md:h-16" />
						</div>
						<h3 class="font-bold text-[#101828] text-base md:text-lg mb-2">Mükemmel kalite</h3>
						<p class="text-gray-500 text-sm md:text-[15px] leading-relaxed max-w-[280px]">
							Malzeme ve işçilikte maksimum kalite. Ömür boyu dayanıklı tablolar.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Footer Content -->
		<div class="max-w-[1400px] mx-auto px-4 md:px-10 md:py-5">
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-8">
				<!-- Logo and Info -->
				<div class="lg:col-span-1">
					<nuxt-link to="/" class="block mb-6">
						<img :src="contactInfo.logo" alt="PlusCanvas" class="h-8 md:h-10 object-contain" />
					</nuxt-link>
					<p class="text-gray-500 text-sm md:text-[15px] leading-relaxed pr-4">
						{{ contactInfo.slogan }}
					</p>
				</div>

				<!-- Gallery Links -->
				<div>
					<h4 class="font-bold text-[#101828] text-base mb-6">Kanvas Tablo Galerisi</h4>
					<ul class="space-y-4">
						<li v-for="link in footerLinks.gallery" :key="link.name">
							<a :href="link.href" class="text-gray-500 hover:text-[#215EA5] text-sm md:text-[15px] transition-colors">
								{{ link.name }}
							</a>
						</li>
					</ul>
				</div>

				<!-- Personalized Links -->
				<div>
					<h4 class="font-bold text-[#101828] text-base mb-6">Kişiye Özel Kanvas Tablo</h4>
					<ul class="space-y-4">
						<li v-for="link in footerLinks.personalized" :key="link.name">
							<a :href="link.href" class="text-gray-500 hover:text-[#215EA5] text-sm md:text-[15px] transition-colors">
								{{ link.name }}
							</a>
						</li>
					</ul>
				</div>

				<!-- About Links -->
				<div>
					<h4 class="font-bold text-[#101828] text-base mb-6">Hakkımızda</h4>
					<ul class="space-y-4">
						<li v-for="link in footerLinks.about" :key="link.name">
							<a :href="link.href" class="text-gray-500 hover:text-[#215EA5] text-sm md:text-[15px] transition-colors">
								{{ link.name }}
							</a>
						</li>
					</ul>
				</div>

				<!-- Contact Info -->
				<div>
					<h4 class="font-bold text-[#101828] text-base mb-6">İletişim & Destek</h4>
					<div class="space-y-5">
						<div class="flex items-start gap-3">
							<Icon name="footerMail" class="w-5 h-5 text-gray-400 mt-0.5" />
							<div>
								<span class="block text-gray-400 text-xs uppercase tracking-wider mb-1">E-posta</span>
								<a
									href="mailto:info@pluscanvas.com"
									class="text-[#101828] font-medium text-sm md:text-[15px] hover:text-[#215EA5]"
								>
									{{ contactInfo.email }}
								</a>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Icon name="footerCall" class="w-5 h-5 text-gray-400 mt-0.5" />
							<div>
								<span class="block text-gray-400 text-xs uppercase tracking-wider mb-1">Telefon</span>
								<a
									href="tel:+905001234567"
									class="text-[#101828] font-medium text-sm md:text-[15px] hover:text-[#215EA5]"
								>
									{{ contactInfo.phone_number }}
								</a>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Icon name="footerMapPin" class="w-5 h-5 text-gray-400 mt-0.5" />
							<div>
								<span class="block text-gray-400 text-xs uppercase tracking-wider mb-1">Adres</span>
								<p class="text-[#101828] font-medium text-sm md:text-[15px]">{{ contactInfo.address }}</p>
							</div>
						</div>

						<!-- Social Icons -->
						<div class="flex items-center gap-3 pt-2">
							<a
								href="#"
								class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#215EA5] hover:bg-gray-50 transition-colors"
							>
								<Icon name="facebook" class="w-5 h-5" />
							</a>
							<a
								href="#"
								class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#215EA5] hover:bg-gray-50 transition-colors"
							>
								<Icon name="instagram" class="w-5 h-5" />
							</a>
							<a
								href="#"
								class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#215EA5] hover:bg-gray-50 transition-colors"
							>
								<Icon name="linkedin" class="w-5 h-5" />
							</a>
						</div>
					</div>
				</div>
			</div>

			<!-- Top Links (Hesabım, etc) -->
			<div class="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
				<template v-for="(link, index) in topLinks" :key="link.name">
					<a :href="link.href" class="text-gray-500 hover:text-[#215EA5] text-sm md:text-[15px] transition-colors">
						{{ link.name }}
					</a>
					<div v-if="index !== topLinks.length - 1" class="hidden sm:block w-[1px] h-3 bg-gray-300"></div>
				</template>
			</div>
		</div>

		<!-- Footer Bottom -->
		<div class="bg-white border-t border-gray-100">
			<div
				class="max-w-[1400px] mx-auto px-4 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6"
			>
				<!-- Copyright -->
				<div class="text-gray-500 text-sm text-center md:text-left">© 2026 PlusCanvas. Tüm hakları saklıdır.</div>

				<!-- Payment Icons -->
				<div class="flex items-center gap-4">
					<img src="/images/master_card.svg" alt="MasterCard" class="h-6 object-contain" />
					<div class="text-gray-400 font-bold text-lg italic tracking-widest opacity-50">VISA</div>
				</div>

				<!-- Policy Links -->
				<div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
					<a
						v-for="link in bottomLinks"
						:key="link.name"
						:href="link.href"
						class="text-gray-500 hover:text-[#215EA5] text-xs md:text-sm transition-colors"
					>
						{{ link.name }}
					</a>
				</div>
			</div>
		</div>
	</footer>
</template>

<style lang="scss" scoped>
	/* Custom styles if needed beyond Tailwind */
</style>
