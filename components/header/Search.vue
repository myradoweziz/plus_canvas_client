<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'
</script>

<template>
	<div class="flex items-center relative min-w-[500px] border-[1px] border-[#215EA5] rounded-[15px] overflow-hidden">
		<input
			type="text"
			placeholder="Aradığınız tablo konusunu yazın..."
			class="placeholder:text-[#101828] text-sm font-normal outline-none px-8 py-1 w-full"
		/>
		<button
			class="absolute top-0 right-0 bg-[#215EA5] text-white font-semibold text-sm flex gap-2 items-center justify-center px-4 py-1 h-full"
		>
			<Icon name="search" />
			Ara
		</button>
	</div>
</template>

<style lang="scss" scoped></style>
