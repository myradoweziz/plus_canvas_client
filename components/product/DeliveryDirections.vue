<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	defineProps<{
		deliveryDirections: { icon: string; title: string; description: string }[]
		deliveryDirectionColors: (index: number) => { backgroundColor: string; iconColor: string; textColor: string }
	}>()
</script>

<template>
	<section class="pt-20">
		<div class="flex justify-center gap-10">
			<div
				v-for="(deliveryDirection, index) in deliveryDirections"
				:key="index"
				class="p-6 rounded-2xl max-w-80 min-w-80 flex flex-col items-start"
				:style="{ backgroundColor: deliveryDirectionColors(index).backgroundColor }"
			>
				<Icon :name="deliveryDirection.icon" :style="{ color: deliveryDirectionColors(index).iconColor }" />
				<h2 class="text-2xl font-bold pt-7" :style="{ color: deliveryDirectionColors(index).textColor }">
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
