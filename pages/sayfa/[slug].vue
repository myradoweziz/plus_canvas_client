<script setup lang="ts">
import { useRoute } from 'vue-router'
import { request } from '~/api'

const route = useRoute()
const slug = route.params.slug as string

const { data: response, pending, error } = await useAsyncData(`topic-${slug}`, () =>
  request({ url: `/api/topics/${slug}`, method: 'GET' })
)

const topic = computed(() => response.value?.data)

useHead({
  title: computed(() => topic.value?.meta_title || topic.value?.title || 'Sayfa | PlusCanvas'),
  meta: [
    { name: 'description', content: computed(() => topic.value?.meta_description || '') },
    { name: 'keywords', content: computed(() => topic.value?.meta_keywords || '') }
  ]
})
</script>

<template>
  <main class="min-h-screen pb-10">
    <div v-if="pending" class="flex justify-center py-20 text-gray-500">
      Yükleniyor...
    </div>
    <div v-else-if="error || !topic" class="w-full">
      <Error404 status-code="404" @home="$router.push('/')" />
    </div>
    <div v-else class="topic-content w-full">
      <div v-html="topic.body"></div>
    </div>
  </main>
</template>
