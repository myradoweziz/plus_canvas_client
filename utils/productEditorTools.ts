import type { EditorToolId } from '~/utils/productEditorTypes'

export type EditorStickyTool = {
	id: EditorToolId
	name: string
	icon: string
}

export const EDITOR_STICKY_TOOLS: EditorStickyTool[] = [
	{ id: 'effect', name: 'Efekt', icon: 'effect' },
	{ id: 'text', name: 'Yazı', icon: 'textIcon' },
	{ id: 'frame', name: 'Kadraj', icon: 'frame' }
]
