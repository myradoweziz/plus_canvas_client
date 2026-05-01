<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	const route = useRoute()

	const menu = [
		{ id: 0, title: 'KİŞİYE ÖZEL KANVAS TABLO', link: '/catalog/1' },
		{ id: 1, title: 'KATEGORİLER', link: '/categories' },
		{ id: 2, title: 'GALERI', link: '/gallery' }
	]
</script>

<template>
	<div>
		<ul class="flex gap-5">
			<li v-for="item in menu" :key="item.id">
				<nuxt-link
					:to="item.link"
					class="font-medium text-sm uppercase flex items-center gap-2 hover:text-[#215EA5] hover:underline transition-all duration-300"
					:class="route.path === item.link ? 'text-[#215EA5] underline' : 'text-[#101828]'"
				>
					{{ item.title }}
					<div v-if="item.id !== 1 && route.path === item.link" class="w-[5px] h-[5px] bg-[#215EA5] rounded-full"></div>
					<Icon v-if="item.id === 1" name="arrowBottom" />
				</nuxt-link>
			</li>
		</ul>
	</div>
</template>

<style lang="scss" scoped></style>
