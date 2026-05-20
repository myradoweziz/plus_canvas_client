<script setup lang="ts">
	const tabs = ['Açıklama', 'Sıkça Sorulan Sorular', 'Ürün Özellikleri'] as const
</script>

<template>
	<div>
		<section class="flex items-center justify-between mt-6">
			<button
				v-for="(label, index) in tabs"
				:key="label"
				type="button"
				:class="[
					'font-medium border-b-2 transition-all w-full hover:border-[#2B7FFF] hover:text-[#2B7FFF]',
					index === 0 ? 'border-[#2B7FFF] text-[#2B7FFF]' : 'border-[#B3B3B3] text-[#B3B3B3]'
				]"
			>
				{{ label }}
			</button>
		</section>

		<div class="mt-6 text-[#313131] text-left">
			Starry Night, Vincent van Gogh tarafından 1889 yılında yapılmış ve sanat tarihinin en ikonik tablolarından biri
			olarak kabul edilmiştir. Dalgamsı fırça darbeleri, dramatik gökyüzü ve yoğun renk kontrastlarıyla Van Gogh’un
			duygusal dünyasını yansıtır. Bu eşsiz eser, PlusCanvas kalitesiyle kanvas tablo olarak yeniden hayat bulur
		</div>
	</div>
</template>
