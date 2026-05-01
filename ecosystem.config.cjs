module.exports = {
	apps: [
		{
			name: 'plus-canvas-client',
			port: 3002,
			exec_mode: 'fork',
			script: './.output/server/index.mjs'
		}
	]
}
