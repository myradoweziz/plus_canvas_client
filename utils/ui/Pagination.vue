<script setup lang="ts">
	import Icon from './Icon.vue'
</script>

<template>
	<div class="mt-5 md:mt-10 flex justify-center items-center gap-2">
		<button
			class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all"
		>
			<Icon name="arrowBottom" class="w-4 h-4 rotate-90" />
		</button>
		<button
			class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#1853a0] text-white font-semibold text-sm flex items-center justify-center shadow-lg"
		>
			1
		</button>
		<button
			class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-gray-200 font-semibold text-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
		>
			2
		</button>
		<button
			class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-gray-200 font-semibold text-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
		>
			3
		</button>
		<span class="px-2 text-gray-400">...</span>
		<button
			class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-gray-200 font-semibold text-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
		>
			12
		</button>
		<button
			class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
		>
			<Icon name="arrowBottom" class="w-4 h-4 -rotate-90" />
		</button>
	</div>
</template>

<style lang="scss" scoped></style>
