<script setup lang="ts">
	definePageMeta({
		layout: 'account'
	})

	useHead({ title: 'Kuponlarım | PlusCanvas' })
</script>

<template>
	<section class="bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] p-6 md:p-8 min-h-[320px] h-full">
		<h2 class="text-2xl font-bold text-[#101828] mb-4">Kuponlarım</h2>

		<div class="mt-6 grid grid-cols-2 gap-6">
			<div v-for="coupon in 10" :key="coupon" class="bg-[#155DFC1A] p-4 rounded-2xl">
				<p
					class="text-[#2B7FFF] border-dashed border-2 border-[#155DFC4D] text-xl font-bold bg-white w-max px-4 py-2 rounded-full"
				>
					WELCOME20
				</p>
				<p class="text-[#101828] text-3xl font-bold mt-4">20%</p>
				<p class="text-[#4A5565] text-sm mt-2">İlk siparişinizde %20 indirim kazanın</p>

				<div class="mt-4 border-t border-[#d9dbdf] pt-4 flex items-center justify-between">
					<p class="text-[#4A5565] text-sm">Son kullanma: 31 Ağustos 2026</p>
					<button class="text-[#2B7FFF] text-sm font-semibold">Kopyala</button>
				</div>
			</div>
		</div>
	</section>
</template>
