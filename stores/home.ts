import { defineStore } from 'pinia'

import type { Banner, DisCount, Faq, FeaturedCategory, MainCategory } from '~/utils/types'
import {
	CANVAS_PAINTING_CATEGORY,
	FEATURED_CATEGORY,
	MOST_SEARCHED_CATEGORY,
	PERSONALIZED_CANVAS_PAINTINGS_CATEGORY
} from '~/utils/types'

type BannersApiResponse = { data: Banner[] }
type FeaturedCategoriesApiResponse = { data: FeaturedCategory[] }
type MainCategoriesApiResponse = { data: MainCategory[] }
type DiscountsApiResponse = { data: DisCount[] }
type FaqsApiResponse = { data: Faq[] }

const homeFetchOptions = (path: string) => ({
	baseURL: useRuntimeConfig().public.baseUrl as string,
	method: 'GET' as const,
	key: `home-${path}`
})

export const useHomeStore = defineStore('home', () => {
	const banners = ref<Banner[]>([])
	const bannersStatus = ref<'pending' | 'success' | 'error'>('success')

	const featuredCategoriesAll = ref<FeaturedCategory[]>([])
	const mainCategories = ref<MainCategory[]>([])
	const discounts = ref<DisCount[]>([])
	const faqs = ref<Faq[]>([])

	const featuredCategories = computed(() =>
		featuredCategoriesAll.value.filter((c) => c.category_type === FEATURED_CATEGORY)
	)

	const mostSearchedCategories = computed(() =>
		featuredCategoriesAll.value.filter((c) => c.category_type === MOST_SEARCHED_CATEGORY)
	)

	const mainCategoryId = computed(
		() => mainCategories.value?.find((c) => c.category_type === PERSONALIZED_CANVAS_PAINTINGS_CATEGORY)?.id ?? 1
	)

	const canvasPaintingCategories = computed(() =>
		featuredCategoriesAll.value.filter((c) => c.main_category?.name === CANVAS_PAINTING_CATEGORY)
	)

	const personalizedCanvasPaintingsCategories = computed(() =>
		featuredCategoriesAll.value.filter((c) => c.main_category?.name === PERSONALIZED_CANVAS_PAINTINGS_CATEGORY)
	)

	async function fetchBanners() {
		bannersStatus.value = 'pending'
		const { data, error } = await useFetch<BannersApiResponse>('/api/banners', homeFetchOptions('/api/banners'))
		if (error.value) {
			bannersStatus.value = 'error'
			banners.value = []
			return
		}
		banners.value = data.value?.data ?? []
		bannersStatus.value = 'success'
	}

	async function fetchFeaturedCategories() {
		const { data, error } = await useFetch<FeaturedCategoriesApiResponse>(
			'/api/categories',
			homeFetchOptions('/api/categories')
		)
		if (!error.value) featuredCategoriesAll.value = data.value?.data ?? []
	}

	async function fetchMainCategories() {
		const { data, error } = await useFetch<MainCategoriesApiResponse>(
			'/api/main-categories',
			homeFetchOptions('/api/main-categories')
		)
		if (!error.value) mainCategories.value = data.value?.data ?? []
	}

	async function fetchDiscounts() {
		const { data, error } = await useFetch<DiscountsApiResponse>('/api/discounts', homeFetchOptions('/api/discounts'))
		if (!error.value) discounts.value = data.value?.data ?? []
	}

	async function fetchFaqs() {
		const { data, error } = await useFetch<FaqsApiResponse>('/api/faqs', homeFetchOptions('/api/faqs'))
		if (!error.value) faqs.value = data.value?.data ?? []
	}

	async function fetchHomePage() {
		await fetchBanners()
		await fetchFeaturedCategories()
		await fetchMainCategories()
		await fetchDiscounts()
		await fetchFaqs()
	}

	return {
		banners,
		bannersStatus,
		featuredCategoriesAll,
		mainCategories,
		discounts,
		faqs,
		featuredCategories,
		mostSearchedCategories,
		mainCategoryId,
		canvasPaintingCategories,
		personalizedCanvasPaintingsCategories,
		fetchBanners,
		fetchFeaturedCategories,
		fetchMainCategories,
		fetchDiscounts,
		fetchFaqs,
		fetchHomePage
	}
})
