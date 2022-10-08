import { Mesh, StandardMaterial, Vector3 } from "babylonjs"

export enum EventType {
    GameState,
    GameSide
}

export interface GameEvent {
    type: EventType;
    data: any;
}

export enum PlayerSide {
    top,
    left,
    bottom,
    right
}

export interface EnterGame {
    myPlayerSide: PlayerSide
}

export interface GridBlock {
    mesh: Mesh,
    material: StandardMaterial,
    defaultPosition: Vector3,
    status: GridBlockStatus
}

export enum GridBlockStatus {
    unselected,
    primary,
    secondary,
    path,
    blocked,
    hit
}
