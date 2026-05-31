export interface MockupScenePoint {
	x: number
	y: number
}

export interface MockupSceneSetting {
	id?: string | number | null
	name: string
	value: string
	palette?: string[]
	point?: MockupScenePoint
	point_of_interest?: { x?: number; y?: number; X?: number; Y?: number }
	PointOfInterest?: { x?: number; y?: number; X?: number; Y?: number; IsEmpty?: boolean }
}

export interface MockupScene {
	group?: string
	settings: MockupSceneSetting[]
	associated_format_ids?: number[]
	associated_frame_ids?: (number | string)[]
	render_template?: string
}

/** Настройка сцены для UI (hotspot + текущий цвет). */
export interface ActiveMockupSceneSetting {
	index: number
	name: string
	value: string
	x: number
	y: number
	palette: string[]
}
