<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'
</script>

<template>
	<main class="mt-20">
		<h1 class="text-4xl font-semibold text-center text-[#313131]">Derecelendirme ve İncelemeler</h1>

		<section class="mt-10 flex flex-col gap-5">
			<div v-for="i in 3" class="bg-white p-6 rounded-2xl">
				<h2 class="text-[#313131] font-bold text-2xl">Ayşe Y.</h2>
				<p class="pt-2 text-[#B3B3B3]">07.07.2025</p>
				<div class="flex items-center pt-3">
					<Icon v-for="value in 5" :key="value" name="star" class="w-6 h-6 text-yellow-300" />
				</div>
				<p class="capitalize text-sm text-[#B3B3B3] pt-4">ürün seçeneği</p>
				<p class="pt-3 font-medium text-[#313131]">Karışık <span class="text-[#B3B3B3]">|</span> Black</p>
				<p class="pt-5 text-[#313131]">
					Çok kaliteli bir ürün, renkleri canlı ve çerçevesi çok şık. Kesinlikle tavsiye ederim!
				</p>
			</div>

			<div class="mt-5 flex justify-center">
				<button
					class="border border-[#313131] hover:bg-[#313131]/80 hover:text-white rounded-md py-3 px-4 text-[#313131] transition duration-300 w-full max-w-[400px]"
				>
					Tüm yorumları gör
				</button>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped></style>
