<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	definePageMeta({
		layout: 'account'
	})

	useHead({ title: 'Adreslerim | PlusCanvas' })
</script>

<template>
	<section class="bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] p-6 md:p-8 min-h-[320px] h-full">
		<header class="flex items-center justify-between">
			<h2 class="text-2xl font-bold text-[#101828]">Adreslerim</h2>
			<button
				class="font-semibold px-4 py-2 rounded-full bg-[#2B7FFF] text-white flex items-center gap-2 hover:bg-[#1853a0] transition-all"
			>
				<Icon name="plus" class="w-4 h-4" />
				Yeni Adres Ekle
			</button>
		</header>

		<div class="mt-6 grid grid-cols-2 gap-6">
			<div v-for="address in 10" :key="address" class="shadow-[0px_4px_15px_0px_#00000014] p-6 rounded-2xl">
				<div class="flex items-center justify-between">
					<div>
						<p class="font-bold">Ev Adresi</p>
						<button
							v-if="address === 1"
							class="text-[#2B7FFF] text-sm font-semibold bg-[#155DFC1A] px-4 py-2 rounded-full mt-2"
						>
							Varsayılan
						</button>
					</div>
					<div class="flex items-center gap-2">
						<Icon name="edit" class="w-7 h-7 hover:text-[#2B7FFF] transition-all" />
						<Icon name="trash" class="w-7 h-7 hover:text-[#2B7FFF] transition-all" />
					</div>
				</div>

				<div class="pt-4 space-y-1">
					<p class="text-[#101828] text-sm font-semibold">Ahmet Yılmaz</p>
					<p class="text-[#4A5565] text-sm">0555 123 45 67</p>
					<p class="text-[#4A5565] text-sm">Atatürk Cad. No:123 Daire:5</p>
					<p class="text-[#4A5565] text-sm">Kadıköy, İstanbul</p>
				</div>
			</div>
		</div>
	</section>
</template>
