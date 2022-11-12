import { AbstractMesh, Mesh, StandardMaterial, Vector3 } from "babylonjs";
import { rotate } from "./babylonGameScene";

export const squareSize = 1;
export const gridWidth = 12;
export const halfGridWidth = gridWidth / 2;

export enum PlayerSide {
  top = 0,
  left = 1,
  bottom = 2,
  right = 3,
}


export enum PieceType {
  pawn = 0,
  tower = 1,
  bishop = 2,
  queen = 3,
  king = 4,
  knight = 5
}

export const colorMapping: { [playerSide in PlayerSide]: string }  = {
  0: "#590696",
  1: "#FBCB0A",
  2: "#37E2D5",
  3: "#C70A80"
}

export enum AliveState {
  alive,
  dead,
}

export enum EventType {
  move,
  invalidMove,
}

export interface PlayerEvent {
  eventType: EventType
}

export interface PlayerPiece {
  pieceName: string;
  pieceType: PieceType;
  gridPosition: number;
  aliveState: AliveState;
  isFirstMove: boolean;
}

export interface Player {
  aliveState: AliveState;
  playerSide: PlayerSide;
  playerName: string;
  pieces: { [name: string]: PlayerPiece };
  requestMove: RequestMove | undefined,
}

export interface FrontendPlayer extends Player {
    meshes: { [name: string]: AbstractMesh },
}

export interface FrontendGame {
  players: { [playerSide: number]: FrontendPlayer }
}

export enum ActionType {
  move,
  attack,
  defend,
}

export interface PlayerAction {
  gridPosition: number;
  actionType: ActionType;
  opponentPiece:
    | { playerSide: PlayerSide; playerPiece: PlayerPiece }
    | undefined;
}

export interface RequestMove extends PlayerEvent {
  eventType: EventType.move;
  playerPiece: PlayerPiece;
  playerAction: PlayerAction | undefined;
}

export interface ConfirmedMove extends RequestMove  {
  playerSide: number,
  opponentPiece: { playerSide: PlayerSide, playerPiece: PlayerPiece } | undefined
}

export interface InvalidMove extends PlayerEvent {
  eventType: EventType.invalidMove;
}

export const rotations: { [playerSide in PlayerSide]: number } = {
  0: 180,
  1: 90,
  2: 0,
  3: 270
}


export enum MovementType {
  fixed,
  continuous
}

export interface Movement {
  movementType: MovementType,
  moveDirection: { x: number, y: number }[],
  attackDirection: { x: number, y: number }[]
}

export enum GridBlockStatus {
  unselected,
  primary,
  secondary,
  path,
  blocked,
  hit
}

export interface GridBlock {
  mesh: Mesh,
  material: StandardMaterial,
  defaultPosition: Vector3,
  status: GridBlockStatus
}

export const validMoves: { [pieceTypeName: string]: Movement } = {
  "pawn-first-move": {
      movementType: MovementType.fixed,
      moveDirection: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 0 }, { x: -1, y: 0 }],
      attackDirection: [{ x: 1, y: 1 }, { x: -1, y: 1 }]
  },
  "pawn": {
      movementType: MovementType.fixed,
      moveDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }],
      attackDirection: [{ x: 1, y: 1 }, { x: -1, y: 1 }]
  },
  "tower": <Movement>{
      movementType: MovementType.continuous,
      moveDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }],
      attackDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }]
  },
  "knight": <Movement>{
      movementType: MovementType.fixed,
      moveDirection: [{ x: 1, y: 2 }, { x: -1, y: 2 }, { x: 2, y: -1 }, { x: 2, y: 1 }, { x: -1, y: -2 }, { x: 1, y: -2 }, { x: -2, y: 1 }, { x: -2, y: -1 }],
      attackDirection: [{ x: 1, y: 2 }, { x: 2, y: -1 }, { x: -1, y: -2 }, { x: -2, y: 1 }]
  },
  "bishop": <Movement>{
      movementType: MovementType.continuous,
      moveDirection: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }],
      attackDirection: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }]
  },
  "queen": <Movement>{
      movementType: MovementType.continuous,
      moveDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }],
      attackDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }]
  },
  "king": <Movement>{
      movementType: MovementType.fixed,
      moveDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }],
      attackDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }]
  }
}

export const orderSide: { [entranceOrder: number]: PlayerSide } = {
  0: 0,
  1: 2,
  2: 1,
  3: 3
}

export function getValidMoves(playerPiece: PlayerPiece, playerSide: PlayerSide, players: { [playerSide: number]: Player | FrontendPlayer }): PlayerAction[] {

  var actualMoveList: PlayerAction[] = [];

  var myplayer = players[playerSide]

  if (myplayer.aliveState == AliveState.alive && playerPiece.aliveState == AliveState.alive) {

      var pieceTypeName: string = PieceType[playerPiece.pieceType]

      var moves = playerPiece.pieceType == PieceType.pawn &&
          playerPiece.isFirstMove == true ? validMoves["pawn-first-move"] : validMoves[pieceTypeName];

      moves.moveDirection.forEach(m => {
          var myRelativeGridPos = rotate(playerPiece.gridPosition, playerSide, false);

          var nextPosition = myRelativeGridPos + m.x + m.y * gridWidth;
          var rawMoveList: number[] = [];

          // first work out player moves without cosidering collisions
          if (moves.movementType == MovementType.continuous) {

              while (
                  nextPosition >= 0 &&
                  nextPosition < gridWidth * gridWidth &&
                  Math.floor((myRelativeGridPos + m.y * gridWidth) / gridWidth) == Math.floor((nextPosition) / gridWidth)) {

                  rawMoveList.push(nextPosition);

                  myRelativeGridPos = nextPosition;
                  nextPosition += m.x + m.y * gridWidth;
              }
          } else {
              if (nextPosition >= 0 &&
                  nextPosition < gridWidth * gridWidth &&
                  Math.floor((myRelativeGridPos + m.y * gridWidth) / gridWidth) == Math.floor((nextPosition) / gridWidth)) {

                  rawMoveList.push(nextPosition)
              }
          }

          // now itterate throgh moves and exclude collisions, for valid moves, work out if the movement will
          // hit an apponents piece
          for (const move of rawMoveList) {
              for (const pieceName in myplayer.pieces) {
                  const piece = myplayer.pieces[pieceName];

                  var playerGridPos = rotate(piece.gridPosition, playerSide, false);

                  if (playerGridPos == move && piece.aliveState == AliveState.alive) {
                      return;
                  }
              }

              for (const opponentSide in players) {
                  const opponent = players[+opponentSide];

                  if (+opponentSide == playerSide) continue;
                  if (opponent.aliveState == AliveState.dead) continue;

                  for (const opponentPieceName in opponent.pieces) {
                      var opponentPiece = opponent.pieces[opponentPieceName];
                      var relativePosition = rotate(opponentPiece.gridPosition, playerSide, false);

                      if (relativePosition == +move && opponentPiece.aliveState == AliveState.alive) {
                          actualMoveList.push({
                              actionType: ActionType.attack,
                              gridPosition: rotate(move, playerSide, true),
                              opponentPiece: { playerSide: +opponentSide, playerPiece: opponentPiece }
                          });
                          return;
                      }
                  }
              }

              actualMoveList.push({ actionType: ActionType.move, gridPosition: rotate(move, myplayer.playerSide, true), opponentPiece: undefined });
          }
      });
  }

  console.log(`${playerPiece.pieceName}: ${AliveState[playerPiece.aliveState]}, player: ${AliveState[myplayer.aliveState]} moves`, actualMoveList)

  return actualMoveList;
}

