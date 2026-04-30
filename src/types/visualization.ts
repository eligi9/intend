export interface CanvasNode {
  id: string
  label: string
  value: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  selected: boolean
}

export interface CanvasSettings {
  speed: number
  attraction: number
  showTrails: boolean
}
