module.exports = {
	apps: [
		{
			name: 'e-portal-nuxt-3',
			port: 3030,
			exec_mode: 'fork',
			script: './.output/server/index.mjs'
		}
	]
}
