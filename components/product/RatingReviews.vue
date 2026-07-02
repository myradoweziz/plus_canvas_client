<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { Comment } from '~/utils/types'

	const props = defineProps<{
		comments: Comment[]
	}>()

	const INITIAL_VISIBLE_COUNT = 3

	const showAll = ref(false)

	const visibleComments = computed(() =>
		showAll.value ? props.comments : props.comments.slice(0, INITIAL_VISIBLE_COUNT)
	)

	const hasMore = computed(() => !showAll.value && props.comments.length > INITIAL_VISIBLE_COUNT)

	const reviewCount = computed(() => props.comments.length)

	const averageRating = computed(() => {
		if (reviewCount.value === 0) return 0
		const sum = props.comments.reduce((acc, c) => acc + (Number(c.rating) || 0), 0)
		return sum / reviewCount.value
	})

	const ratingCounts = computed(() => {
		const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
		props.comments.forEach(c => {
			const r = Math.round(Number(c.rating) || 0)
			if (r >= 1 && r <= 5) {
				counts[r as keyof typeof counts]++
			}
		})
		return counts
	})

	const getRatingPercentage = (count: number) => {
		if (reviewCount.value === 0) return 0
		return Math.round((count / reviewCount.value) * 100)
	}
</script>

<template>
	<main v-if="comments.length" class="mt-16 md:mt-24">
		<h1 class="text-3xl md:text-4xl font-bold text-center text-[#313131]">Derecelendirme ve İncelemeler</h1>

		<div class="mt-10 md:mt-16 flex flex-col-reverse lg:flex-row gap-8 lg:gap-10 items-start">
			<!-- Left Column: Comments List -->
			<section class="flex-1 flex flex-col gap-5 w-full">
				<div v-for="(comment, index) in visibleComments" :key="index" class="bg-white p-6 md:p-8 rounded-[20px] shadow-sm w-full">
					<h2 class="text-[#313131] font-bold text-xl">{{ comment.author_name }}</h2>
					<p class="pt-1 text-sm text-[#B3B3B3] font-medium">{{ comment.updated_at }}</p>
					
					<div class="flex items-center pt-3">
						<Icon v-for="value in Math.round(Number(comment.rating) || 0)" :key="'filled-'+value" name="star" class="w-5 h-5 text-yellow-400" />
						<Icon v-for="value in (5 - Math.round(Number(comment.rating) || 0))" :key="'empty-'+value" name="star" class="w-5 h-5 text-gray-200" />
					</div>
					
					<p class="pt-4 text-[#313131] text-sm md:text-base leading-relaxed">
						{{ comment.comment }}
					</p>
				</div>

				<div v-if="hasMore" class="mt-4 w-full">
					<button
						class="bg-transparent border border-[#5e5e5e] hover:bg-[#F9F9F9] rounded-xl py-4 px-4 text-[#313131] font-medium transition duration-300 w-full"
						@click="showAll = true"
					>
						Tüm yorumları gör
					</button>
				</div>
			</section>

			<!-- Right Column: Overall Rating Box -->
			<aside class="w-full lg:w-[420px] shrink-0 bg-white p-8 rounded-[24px] shadow-sm lg:sticky lg:top-[120px]">
				<div class="flex items-end gap-4">
					<span class="text-[56px] font-bold text-[#313131] leading-none">{{ averageRating.toFixed(1) }}</span>
					<div class="flex flex-col mb-2">
						<div class="relative inline-block w-max">
							<div class="flex text-gray-200">
								<Icon v-for="i in 5" :key="i" name="star" class="w-[22px] h-[22px]" />
							</div>
							<div class="absolute top-0 left-0 flex text-yellow-400 overflow-hidden whitespace-nowrap" :style="{ width: `${(averageRating / 5) * 100}%` }">
								<Icon v-for="i in 5" :key="i" name="star" class="w-[22px] h-[22px] shrink-0" />
							</div>
						</div>
						<span class="text-xs text-[#8e8e8e] mt-1 font-semibold">genel sıralama</span>
					</div>
				</div>
				<p class="text-sm text-[#B3B3B3] mt-2 mb-8 font-medium">{{ reviewCount }} Değerlendirme</p>

				<div class="flex flex-col gap-3">
					<div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-3 text-sm font-bold text-[#313131]">
						<div class="flex items-center gap-1 w-8 shrink-0">
							{{ star }} <Icon name="star" class="w-4 h-4 text-yellow-400" />
						</div>
						<div class="flex-1 h-[6px] bg-[#E5E5E5] rounded-full overflow-hidden">
							<div class="h-full bg-yellow-400 rounded-full" :style="{ width: `${getRatingPercentage(ratingCounts[star as keyof typeof ratingCounts])}%` }"></div>
						</div>
						<div class="w-8 text-right text-xs text-[#8e8e8e] font-medium shrink-0">{{ getRatingPercentage(ratingCounts[star as keyof typeof ratingCounts]) }}%</div>
					</div>
				</div>

				<!-- <button class="w-full mt-10 bg-[#2B7FFF] hover:bg-[#2B7FFF]/90 text-white font-bold text-[15px] rounded-full py-4 transition-colors shadow-lg shadow-[#2B7FFF]/20">
					İnceleme yaz
				</button> -->
			</aside>
		</div>
	</main>
</template>

<style lang="scss" scoped></style>
