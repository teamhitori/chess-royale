import { Color3 } from "babylonjs"

export interface PlayerColor {
    playerPosition: number,
    color: Color3
}

export interface PlayerEvent {
    enable: boolean,
    color: Color3
}