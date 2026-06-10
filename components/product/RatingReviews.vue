<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { Comment } from '~/utils/types'

	const props = defineProps<{
		comments: Comment[]
	}>()

	const INITIAL_VISIBLE_COUNT = 10

	const showAll = ref(false)

	const visibleComments = computed(() =>
		showAll.value ? props.comments : props.comments.slice(0, INITIAL_VISIBLE_COUNT)
	)

	const hasMore = computed(() => !showAll.value && props.comments.length > INITIAL_VISIBLE_COUNT)
</script>

<template>
	<main v-if="comments.length" class="mt-20">
		<h1 class="text-4xl font-semibold text-center text-[#313131]">Derecelendirme ve İncelemeler</h1>

		<section class="mt-10 flex flex-col gap-5">
			<div v-for="(comment, index) in visibleComments" :key="index" class="bg-white p-6 rounded-2xl">
				<h2 class="text-[#313131] font-bold text-2xl">{{ comment.author_name }}</h2>
				<p class="pt-2 text-[#B3B3B3]">{{ comment.updated_at }}</p>
				<div class="flex items-center pt-3">
					<Icon v-for="value in comment.rating" :key="value" name="star" class="w-6 h-6 text-yellow-300" />
				</div>

				<p class="pt-5 text-[#313131]">
					{{ comment.comment }}
				</p>
			</div>

			<div v-if="hasMore" class="mt-5 flex justify-center">
				<button
					class="border border-[#313131] hover:bg-[#313131]/80 hover:text-white rounded-md py-3 px-4 text-[#313131] transition duration-300 w-full max-w-[400px]"
					@click="showAll = true"
				>
					Tüm yorumları gör
				</button>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped></style>
