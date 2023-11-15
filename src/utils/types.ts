export type DeepTestMsg = {
  scope: string
  content: DeepTestMsgContent
}

export type DeepTestMsgContent = {
  act: string
  mainWindowId: number
  recorderWindowId: number
  recorderTabId: number

  url: string,
  data: object
}

export type DeepTestMsgOpt = {
  selector: object
  value: object
  tagName: object
  action: string
  keyCode: number
  href: string

  uuid: string
  coordinates: Coordinates
  dimensions: Dimensions
  image: string,
}

export interface func{
  (): void
}

export type Coordinates  = {
  x: number
  y: number
}
export type Dimensions = {
  width: number
  height: number
  left: number
  top: number
}