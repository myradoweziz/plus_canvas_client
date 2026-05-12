<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	const route = useRoute()

	const sidebarMenu = [
		{ name: 'Profil Bilgilerim', icon: 'profile', link: '/profile' },
		{ name: 'Siparişlerim', icon: 'box', link: '/profile/orders' },
		{ name: 'Adreslerim', icon: 'location', link: '/profile/addresses' },
		{ name: 'Favorilerim', icon: 'heart', link: '/profile/favorites' },
		{ name: 'Kuponlarım', icon: 'coupon', link: '/profile/coupons' }
	]

	const logout = () => {
		useAuthStore().logout()
	}
</script>
<template>
	<nav class="sticky top-[150px] w-[250px] bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] p-6 max-h-max">
		<ul class="space-y-3">
			<li
				v-for="menu in sidebarMenu"
				:key="menu.name"
				:class="[
					'py-3 px-7 font-medium hover:bg-[#155DFC1A] hover:text-[#2B7FFF] rounded-lg transition-all duration-300 cursor-pointer',
					`${route.path === menu.link ? 'text-[#2B7FFF] bg-[#155DFC1A]' : 'text-[#364153]'}`
				]"
			>
				<nuxt-link :to="menu.link" class="flex items-center gap-2">
					<Icon :name="menu.icon" class="w-5 h-5" />
					<p>{{ menu.name }}</p>
				</nuxt-link>
			</li>

			<li
				@click="logout"
				class="border-t border-[#E4E7EC] flex items-center gap-2 py-3 pt-3 px-7 text-[#364153] font-medium hover:text-[#2B7FFF] transition-all duration-300 cursor-pointer"
			>
				<Icon name="logout" class="w-5 h-5" />
				<p>Çıkış Yap</p>
			</li>
		</ul>
	</nav>
</template>

<style lang="scss" scoped></style>
