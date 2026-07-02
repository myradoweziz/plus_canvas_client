<script setup lang="ts">
	defineProps<{
		statusCode?: number | string
	}>()

	const emit = defineEmits(['home'])

	const goHome = () => {
		emit('home')
	}
</script>

<template>
	<div class="relative w-full flex flex-col items-center justify-center py-16 sm:py-24 px-4 overflow-hidden select-none">
		<!-- Background Decorative Pluses / Crosses -->
		<div class="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
			<!-- Top Left -->
			<svg class="absolute top-10 left-[8%] w-16 h-16 text-[#2B7FFF]/10 transform -rotate-12" viewBox="0 0 100 100" fill="currentColor">
				<path d="M35 15C35 9.477 39.477 5 45 5H55C60.523 5 65 9.477 65 15V35H85C90.523 35 95 39.477 95 45V55C95 60.523 90.523 65 85 65H65V85C65 90.523 60.523 95 55 95H45C39.477 95 35 90.523 35 85V65H15C9.477 65 5 60.523 5 55V45C5 39.477 9.477 35 15 35H35V15Z" />
			</svg>
			<svg class="absolute top-[28%] left-[15%] w-12 h-12 text-[#101828]/5 transform rotate-45" viewBox="0 0 100 100" fill="currentColor">
				<path d="M35 15C35 9.477 39.477 5 45 5H55C60.523 5 65 9.477 65 15V35H85C90.523 35 95 39.477 95 45V55C95 60.523 90.523 65 85 65H65V85C65 90.523 60.523 95 55 95H45C39.477 95 35 90.523 35 85V65H15C9.477 65 5 60.523 5 55V45C5 39.477 9.477 35 15 35H35V15Z" />
			</svg>
			<svg class="absolute top-[55%] left-[6%] w-20 h-20 text-[#2B7FFF]/10 transform rotate-12" viewBox="0 0 100 100" fill="currentColor">
				<path d="M35 15C35 9.477 39.477 5 45 5H55C60.523 5 65 9.477 65 15V35H85C90.523 35 95 39.477 95 45V55C95 60.523 90.523 65 85 65H65V85C65 90.523 60.523 95 55 95H45C39.477 95 35 90.523 35 85V65H15C9.477 65 5 60.523 5 55V45C5 39.477 9.477 35 15 35H35V15Z" />
			</svg>
			<svg class="absolute bottom-[15%] left-[18%] w-14 h-14 text-[#101828]/5 transform -rotate-45" viewBox="0 0 100 100" fill="currentColor">
				<path d="M35 15C35 9.477 39.477 5 45 5H55C60.523 5 65 9.477 65 15V35H85C90.523 35 95 39.477 95 45V55C95 60.523 90.523 65 85 65H65V85C65 90.523 60.523 95 55 95H45C39.477 95 35 90.523 35 85V65H15C9.477 65 5 60.523 5 55V45C5 39.477 9.477 35 15 35H35V15Z" />
			</svg>

			<!-- Top Right -->
			<svg class="absolute top-12 right-[10%] w-18 h-18 text-[#2B7FFF]/10 transform rotate-45" viewBox="0 0 100 100" fill="currentColor">
				<path d="M35 15C35 9.477 39.477 5 45 5H55C60.523 5 65 9.477 65 15V35H85C90.523 35 95 39.477 95 45V55C95 60.523 90.523 65 85 65H65V85C65 90.523 60.523 95 55 95H45C39.477 95 35 90.523 35 85V65H15C9.477 65 5 60.523 5 55V45C5 39.477 9.477 35 15 35H35V15Z" />
			</svg>
			<svg class="absolute top-[32%] right-[20%] w-14 h-14 text-[#101828]/5 transform -rotate-12" viewBox="0 0 100 100" fill="currentColor">
				<path d="M35 15C35 9.477 39.477 5 45 5H55C60.523 5 65 9.477 65 15V35H85C90.523 35 95 39.477 95 45V55C95 60.523 90.523 65 85 65H65V85C65 90.523 60.523 95 55 95H45C39.477 95 35 90.523 35 85V65H15C9.477 65 5 60.523 5 55V45C5 39.477 9.477 35 15 35H35V15Z" />
			</svg>
			<svg class="absolute top-[48%] right-[8%] w-22 h-22 text-[#2B7FFF]/10 transform rotate-12" viewBox="0 0 100 100" fill="currentColor">
				<path d="M35 15C35 9.477 39.477 5 45 5H55C60.523 5 65 9.477 65 15V35H85C90.523 35 95 39.477 95 45V55C95 60.523 90.523 65 85 65H65V85C65 90.523 60.523 95 55 95H45C39.477 95 35 90.523 35 85V65H15C9.477 65 5 60.523 5 55V45C5 39.477 9.477 35 15 35H35V15Z" />
			</svg>
			<svg class="absolute bottom-[22%] right-[16%] w-16 h-16 text-[#101828]/5 transform -rotate-45" viewBox="0 0 100 100" fill="currentColor">
				<path d="M35 15C35 9.477 39.477 5 45 5H55C60.523 5 65 9.477 65 15V35H85C90.523 35 95 39.477 95 45V55C95 60.523 90.523 65 85 65H65V85C65 90.523 60.523 95 55 95H45C39.477 95 35 90.523 35 85V65H15C9.477 65 5 60.523 5 55V45C5 39.477 9.477 35 15 35H35V15Z" />
			</svg>
		</div>

		<!-- Content -->
		<div class="relative z-10 text-center max-w-2xl mx-auto flex flex-col items-center">
			<h1 class="text-[100px] sm:text-[140px] md:text-[160px] font-extrabold text-[#101828] tracking-tight leading-none mb-4">
				{{ statusCode || '404' }}
			</h1>
			
			<h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-[#101828] tracking-wide mb-3">
				Aradığınız eser galerimizde bulunamadı....
			</h2>
			
			<p class="text-sm sm:text-base md:text-lg text-[#4A5565] font-medium mb-8 tracking-wide">
				Belki de fırçamız bu sayfaya henüz dokunmamıştır.
			</p>
			
			<button 
				@click="goHome"
				class="bg-[#2B7FFF] hover:bg-[#1e68d8] text-white font-bold px-8 py-3.5 rounded-xl shadow-[0px_4px_15px_0px_#2B7FFF33] hover:shadow-[0px_6px_20px_0px_#2B7FFF4D] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-base sm:text-lg inline-flex items-center justify-center cursor-pointer"
			>
				Ana Sayfaya Dön
			</button>
		</div>
	</div>
</template>
