<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	defineProps<{
		deliveryDirections: { icon: string; title: string; description: string }[]
		deliveryDirectionColors: (index: number) => { backgroundColor: string; iconColor: string; textColor: string }
	}>()
</script>

<template>
	<section class="pt-8 sm:pt-12 md:pt-20">
		<div class="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-4 sm:gap-6 md:gap-10">
			<div
				v-for="(deliveryDirection, index) in deliveryDirections"
				:key="index"
				class="p-5 sm:p-6 rounded-2xl w-full sm:max-w-80 sm:min-w-[280px] sm:flex-1 sm:basis-[280px] flex flex-col items-start"
				:style="{ backgroundColor: deliveryDirectionColors(index).backgroundColor }"
			>
				<Icon :name="deliveryDirection.icon" :style="{ color: deliveryDirectionColors(index).iconColor }" />
				<h2 class="text-xl sm:text-2xl font-bold pt-5 sm:pt-7" :style="{ color: deliveryDirectionColors(index).textColor }">
					{{ deliveryDirection.title }}
				</h2>
				<p class="text-sm" :style="{ color: deliveryDirectionColors(index).textColor }">
					{{ deliveryDirection.description }}
				</p>
			</div>
		</div>
	</section>
</template>

<style lang="scss" scoped></style>
