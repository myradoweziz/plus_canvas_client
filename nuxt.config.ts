import svgLoader from 'vite-svg-loader'

export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	devtools: { enabled: false },
	app: {
		head: {
			charset: 'utf-8',
			viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0',
			title: 'PlusCanvas',
			link: [{ rel: 'shortcut icon', type: 'image/png', href: `/images/icons/plus_logo.svg` }],
			meta: [
				{ name: 'author', content: 'PlusCanvas' },
				{ property: 'og:image:width', content: `500` },
				{ property: 'og:image:height', content: `500` },
				{ property: 'og:image', content: '/images/icons/plus_logo.svg' },
				{ name: 'twitter:image', content: '/images/icons/plus_logo.svg' },
				{ name: 'twitter:site', content: 'PlusCanvas' },
				{ property: 'article:content_tier', content: 'metered' },
				{ property: 'article:opinion', content: false }
			]
		}
	},
	ssr: false,
	devServer: {
		port: 3002,
		host: '0.0.0.0'
	},
	runtimeConfig: {
		public: {
			baseUrl: process.env.BASE_URL,
			sessionIdleTime: process.env.SESSION_IDLE_TIME
		}
	},
	modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'nuxt-swiper'],
	plugins: ['~/plugins/vueToastification'],
	css: ['@/assets/styles/main.css'],
	tailwindcss: {
		config: {
			theme: {
				extend: {
					screens: {
						lg: '960px',
						sm: '360px'
					},
					colors: {
						'black-800': '#121212',
						'black-600': '#626262',
						'black-500': '#8a8a8a',
						'black-400': '#b2b2b2',
						'black-300': '#dadada',
						'black-200': '#EEEEEE',
						'black-150': '#F1F1F1',
						'black-100': '#f8f8f8',
						'black-0': '#ffffff',
						'green-600': '#005D12',
						'green-500': '#00853A',
						'green-400': '#28AD62',
						'green-300': '#50D58A',
						'red-error-600': '#BE1922',
						'red-error': '#EB1B1B',
						'red-error-400': '#FF5761',
						'red-error-100': '#FFF9F9',
						'black-overlay': '#12121299'
					},
					rotate: {
						'180': '180deg'
					}
				}
			}
		}
	},
	vite: {
		plugins: [
			svgLoader({
				svgoConfig: {
					multipass: true,
					plugins: [
						{
							name: 'preset-default',
							params: {
								overrides: {
									removeViewBox: false,
									cleanupIds: false
								}
							}
						}
					]
				}
			})
		]
	}
})
