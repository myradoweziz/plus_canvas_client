<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Icon from '~/utils/ui/Icon.vue'
import { useRouter } from 'vue-router'
import { useNuxtApp } from '#app'

const { $customFetch } = useNuxtApp()
const router = useRouter()

const searchQuery = ref('')
const results = ref<any[]>([])
const isDropdownOpen = ref(false)
const searchContainer = ref<HTMLElement | null>(null)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const closeDropdown = (e: MouseEvent) => {
	if (searchContainer.value && !searchContainer.value.contains(e.target as Node)) {
		isDropdownOpen.value = false
	}
}

onMounted(() => {
	window.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
	window.removeEventListener('click', closeDropdown)
})

const fetchResults = async () => {
	if (searchQuery.value.length < 2) {
		results.value = []
		isDropdownOpen.value = false
		return
	}

	try {
		// $customFetch returns the raw JSON response which is an array
		const response: any = await $customFetch(`/api/search?q=${searchQuery.value}`)
		if (Array.isArray(response)) {
			results.value = response
			isDropdownOpen.value = results.value.length > 0
		} else if (response && Array.isArray(response.data)) {
            results.value = response.data
            isDropdownOpen.value = results.value.length > 0
        }
	} catch (error) {
		console.error('Search failed:', error)
	}
}

watch(searchQuery, () => {
	if (debounceTimeout) clearTimeout(debounceTimeout)
	debounceTimeout = setTimeout(() => {
		fetchResults()
	}, 300)
})

const goToResult = (item: any) => {
	isDropdownOpen.value = false
	searchQuery.value = ''
	
	if (item.type === 'product') {
		router.push(`/products/${item.slug}`)
	} else if (item.type === 'category') {
		router.push(`/categories/${item.slug}`)
	} else if (item.type === 'main_category') {
		router.push(`/main-categories/${item.slug}`)
	} else if (item.type === 'sub_category') {
		router.push(`/sub-categories/${item.slug}`)
	}
}

const performSearch = () => {
    // Optional: go to a search results page if they click the button or hit enter
    if (searchQuery.value.length >= 2) {
        // You can handle standard search here or let them select from dropdown
    }
}
</script>

<template>
	<div class="relative min-w-[500px]" ref="searchContainer">
        <!-- Original Design Search Input -->
		<div class="flex items-center relative border-[1px] border-[#215EA5] rounded-[15px] overflow-hidden bg-white">
			<input
				v-model="searchQuery"
				@focus="() => { if(results.length > 0) isDropdownOpen = true }"
                @keydown.enter="performSearch"
				type="text"
				placeholder="Aradığınız tablo konusunu yazın..."
				class="placeholder:text-[#101828] text-sm font-normal outline-none px-8 py-1.5 w-full"
			/>
			<button
                @click="performSearch"
				class="absolute top-0 right-0 bg-[#215EA5] text-white font-semibold text-sm flex gap-2 items-center justify-center px-4 py-1.5 h-full hover:bg-[#1b4b84] transition-colors"
			>
				<Icon name="search" class="w-4 h-4 text-white" />
				Ara
			</button>
		</div>

        <!-- Dropdown Results -->
		<div v-if="isDropdownOpen" class="absolute top-full left-0 right-0 mt-2 bg-white border border-[#215EA5]/20 shadow-lg z-50 rounded-[10px] overflow-hidden">
			<ul class="max-h-[400px] overflow-y-auto py-2">
				<li 
					v-for="item in results" 
					:key="item.id + item.type"
					@click="goToResult(item)"
					class="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
				>
					<div v-if="item.image" class="w-[40px] h-[40px] flex-shrink-0 mr-4 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center border border-gray-100">
						<img :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
					</div>
					<div v-else class="w-[40px] h-[40px] flex-shrink-0 mr-4 bg-gray-50 rounded-md flex items-center justify-center border border-gray-100">
						<Icon name="image" class="w-5 h-5 text-gray-300" />
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-[14px] font-medium text-[#101828] truncate">{{ item.name }}</p>
                        <p v-if="item.type === 'product' && item.price" class="text-xs text-[#215EA5] mt-0.5">{{ item.price }} ₺</p>
					</div>
				</li>
				<li v-if="results.length === 0 && searchQuery.length >= 2" class="px-4 py-4 text-[14px] text-gray-500 text-center">
					Sonuç bulunamadı
				</li>
			</ul>
		</div>
	</div>
</template>

<style lang="scss" scoped>
ul::-webkit-scrollbar {
	width: 6px;
}
ul::-webkit-scrollbar-track {
	background: #f1f1f1; 
}
ul::-webkit-scrollbar-thumb {
	background: #cbd5e1; 
	border-radius: 4px;
}
ul::-webkit-scrollbar-thumb:hover {
	background: #94a3b8; 
}
</style>
