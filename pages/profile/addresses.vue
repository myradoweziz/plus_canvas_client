<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'
	import { ref, onMounted } from 'vue'

	definePageMeta({
		layout: 'account'
	})

	useHead({ title: 'Adreslerim | PlusCanvas' })

	interface Address {
		id: number
		first_name: string | null
		last_name: string | null
		email: string | null
		phone_number: string | null
		address: string
		city: string
		is_default: boolean
	}

	const addresses = ref<Address[]>([])
	const isLoading = ref(true)

	const isModalOpen = ref(false)
	const isSubmitting = ref(false)
	const editingAddressId = ref<number | null>(null)

	const form = ref({
		first_name: '',
		last_name: '',
		email: '',
		phone_number: '',
		city: '',
		address: '',
		is_default: false
	})

	const fetchAddresses = async () => {
		isLoading.value = true
		try {
			const { data, error } = await useCustomFetch<{ data: Address[] }>('/api/user/addresses')
			if (!error.value && data.value) {
				addresses.value = data.value.data
			}
		} catch (err) {
			console.error(err)
		} finally {
			isLoading.value = false
		}
	}

	onMounted(fetchAddresses)

	const openAddModal = () => {
		editingAddressId.value = null
		form.value = {
			first_name: '',
			last_name: '',
			email: '',
			phone_number: '',
			city: '',
			address: '',
			is_default: false
		}
		isModalOpen.value = true
	}

	const openEditModal = (addr: Address) => {
		editingAddressId.value = addr.id
		form.value = {
			first_name: addr.first_name || '',
			last_name: addr.last_name || '',
			email: addr.email || '',
			phone_number: addr.phone_number || '',
			city: addr.city || '',
			address: addr.address || '',
			is_default: addr.is_default
		}
		isModalOpen.value = true
	}

	const closeModal = () => {
		isModalOpen.value = false
	}

	const saveAddress = async () => {
		const { $toast } = useNuxtApp()
		isSubmitting.value = true
		try {
			const endpoint = editingAddressId.value ? `/api/user/addresses/${editingAddressId.value}` : '/api/user/addresses'
			const method = editingAddressId.value ? 'PUT' : 'POST'
			
			const { error } = await useCustomFetch(endpoint, {
				method,
				body: form.value
			})

			if (!error.value) {
				$toast.success(editingAddressId.value ? 'Adres güncellendi.' : 'Yeni adres eklendi.')
				closeModal()
				await fetchAddresses()
			} else {
				$toast.error('Bir hata oluştu, lütfen formu kontrol edin.')
			}
		} catch (err) {
			console.error(err)
			const { $toast } = useNuxtApp()
			$toast.error('Bir hata oluştu.')
		} finally {
			isSubmitting.value = false
		}
	}

	const deleteAddress = async (id: number) => {
		const { $toast } = useNuxtApp()
		if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) return

		try {
			const { error } = await useCustomFetch(`/api/user/addresses/${id}`, {
				method: 'DELETE'
			})
			if (!error.value) {
				$toast.success('Adres silindi.')
				await fetchAddresses()
			} else {
				$toast.error('Adres silinirken bir hata oluştu.')
			}
		} catch (err) {
			console.error(err)
		}
	}
</script>

<template>
	<section class="bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] p-6 md:p-8 min-h-[320px] h-full relative">
		<header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<h2 class="text-2xl font-bold text-[#101828]">Adreslerim</h2>
			<button
				@click="openAddModal"
				class="font-semibold px-5 py-2.5 rounded-full bg-[#2B7FFF] text-white flex items-center justify-center gap-2 hover:bg-[#1853a0] transition-all shadow-md hover:shadow-lg"
			>
				<Icon name="plus" class="w-4 h-4" />
				Yeni Adres Ekle
			</button>
		</header>

		<div v-if="isLoading" class="mt-8 flex justify-center">
			<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2B7FFF]"></div>
		</div>

		<div v-else-if="addresses.length === 0" class="mt-12 flex flex-col items-center text-center">
			<div class="w-20 h-20 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4">
				<Icon name="location" class="w-10 h-10 text-gray-400" />
			</div>
			<p class="text-gray-500 font-medium">Henüz kayıtlı bir adresiniz bulunmuyor.</p>
		</div>

		<div v-else class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
			<div 
				v-for="address in addresses" 
				:key="address.id" 
				class="bg-white border border-gray-100 shadow-[0px_4px_15px_0px_#00000014] p-6 rounded-2xl flex flex-col hover:border-[#2B7FFF] transition-colors"
			>
				<div class="flex items-start justify-between mb-4">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
							<Icon name="location" class="w-5 h-5 text-gray-600" />
						</div>
						<div>
							<p class="font-bold text-gray-900">{{ address.city }}</p>
							<span
								v-if="address.is_default"
								class="inline-block mt-1 text-[#2B7FFF] text-xs font-bold bg-[#155DFC1A] px-2.5 py-1 rounded-md"
							>
								Varsayılan Adres
							</span>
						</div>
					</div>
					<div class="flex items-center gap-1">
						<button @click="openEditModal(address)" class="p-2 text-gray-400 hover:text-[#2B7FFF] hover:bg-blue-50 rounded-lg transition-all" title="Düzenle">
							<Icon name="edit" class="w-5 h-5" />
						</button>
						<button @click="deleteAddress(address.id)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Sil">
							<Icon name="trash" class="w-5 h-5" />
						</button>
					</div>
				</div>

				<div class="space-y-1.5 flex-1">
					<p class="text-[#101828] text-sm font-semibold">{{ address.first_name }} {{ address.last_name }}</p>
					<p class="text-[#4A5565] text-sm" v-if="address.phone_number">{{ address.phone_number }}</p>
					<p class="text-[#4A5565] text-sm mt-2 line-clamp-3">{{ address.address }}</p>
				</div>
			</div>
		</div>

		<!-- Address Modal -->
		<Teleport to="body">
			<div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal"></div>
				
				<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
					<div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
						<h3 class="text-xl font-bold text-gray-900">
							{{ editingAddressId ? 'Adresi Düzenle' : 'Yeni Adres Ekle' }}
						</h3>
						<button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
							<Icon name="close" class="w-6 h-6" />
						</button>
					</div>

					<div class="p-6 overflow-y-auto">
						<form @submit.prevent="saveAddress" class="space-y-4">
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1.5">
									<label class="text-sm font-medium text-gray-700">Ad</label>
									<input v-model="form.first_name" type="text" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 outline-none transition-all" />
								</div>
								<div class="space-y-1.5">
									<label class="text-sm font-medium text-gray-700">Soyad</label>
									<input v-model="form.last_name" type="text" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 outline-none transition-all" />
								</div>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1.5">
									<label class="text-sm font-medium text-gray-700">Telefon</label>
									<input v-model="form.phone_number" type="tel" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 outline-none transition-all" />
								</div>
								<div class="space-y-1.5">
									<label class="text-sm font-medium text-gray-700">Şehir</label>
									<input v-model="form.city" type="text" required class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 outline-none transition-all" />
								</div>
							</div>

							<div class="space-y-1.5">
								<label class="text-sm font-medium text-gray-700">Açık Adres</label>
								<textarea v-model="form.address" required rows="3" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 outline-none transition-all resize-none"></textarea>
							</div>

							<div class="pt-2">
								<label class="flex items-center gap-3 cursor-pointer group">
									<div class="relative flex items-center justify-center">
										<input v-model="form.is_default" type="checkbox" class="peer sr-only" />
										<div class="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-[#2B7FFF] peer-checked:border-[#2B7FFF] transition-colors"></div>
										<Icon name="check" class="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
									</div>
									<span class="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Varsayılan adres olarak kaydet</span>
								</label>
							</div>

							<div class="pt-6 flex gap-3">
								<button type="button" @click="closeModal" class="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
									İptal
								</button>
								<button type="submit" :disabled="isSubmitting" class="flex-1 px-4 py-3 rounded-xl bg-[#2B7FFF] text-white font-semibold hover:bg-[#1853a0] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center">
									<span v-if="isSubmitting" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
									{{ editingAddressId ? 'Güncelle' : 'Kaydet' }}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</Teleport>
	</section>
</template>
