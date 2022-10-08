import { AbstractMesh, Mesh, StandardMaterial, Vector3 } from "babylonjs"

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

export enum PieceState {
    alive,
    dead
}

export interface PlayerPiece {
    pieceName: string
    gridPosition: number,
    pieceState: PieceState
}

export interface Player {
    playerSide: PlayerSide,
    pieces: { [name: string]: PlayerPiece }
}

export interface FrontendPlayer extends Player {
    meshes: { [name: string]: AbstractMesh },
    selectedPiece: PlayerPiece | undefined,
}

const __grid_width = 12;

export function gridToWorld(gridPosition: number, ): Vector3 {
    return new Vector3(-Math.floor(gridPosition / __grid_width), 0.1, (gridPosition % __grid_width))
}