<script setup lang="ts">
	import Icon from './Icon.vue'

	const props = withDefaults(
		defineProps<{
			page: number
			totalPages: number
		}>(),
		{ page: 1, totalPages: 1 }
	)

	const emit = defineEmits<{
		(e: 'update:page', value: number): void
	}>()

	const go = (p: number) => {
		const tp = Math.max(1, props.totalPages)
		const v = Math.min(Math.max(1, p), tp)
		if (v !== props.page) emit('update:page', v)
	}

	/** Mevcut sayfa ±2, sınırlar dahil */
	const visibleNumbers = computed(() => {
		const t = Math.max(1, props.totalPages)
		const c = Math.min(Math.max(1, props.page), t)
		const lo = Math.max(1, c - 2)
		const hi = Math.min(t, c + 2)
		const list: number[] = []
		for (let i = lo; i <= hi; i++) list.push(i)
		return list
	})

	const btnClass =
		'w-10 h-10 md:w-12 md:h-12 rounded-xl border border-gray-200 flex items-center justify-center text-sm font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none'
	const inactiveClass = `${btnClass} bg-white text-gray-600 hover:bg-gray-50`
	const activeClass = `${btnClass} bg-[#1853a0] text-white border-[#1853a0] shadow-lg`
</script>

<template>
	<div class="mt-5 md:mt-10 flex flex-wrap justify-center items-center gap-2">
		<button
			type="button"
			:class="inactiveClass"
			aria-label="Önceki sayfa"
			:disabled="page <= 1"
			@click="go(page - 1)"
		>
			<Icon name="arrowBottom" class="w-4 h-4 rotate-90" />
		</button>

		<button
			v-for="n in visibleNumbers"
			:key="n"
			type="button"
			:class="n === page ? activeClass : inactiveClass"
			:aria-current="n === page ? 'page' : undefined"
			@click="go(n)"
		>
			{{ n }}
		</button>

		<button
			type="button"
			:class="inactiveClass"
			aria-label="Sonraki sayfa"
			:disabled="page >= totalPages"
			@click="go(page + 1)"
		>
			<Icon name="arrowBottom" class="w-4 h-4 -rotate-90" />
		</button>
	</div>
</template>

<style lang="scss" scoped></style>
