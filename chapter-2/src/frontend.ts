import { Color3, Matrix, Vector3 } from 'babylonjs';
import { getDiffuseColorAnim, getPositionAnim, getRotateAlphaAnim, getRotateAnim, getRotateBetaAnim, getVisibilityAnim } from './animations';
import './babylonGameScene';
import { camera, frontendGame, grid, gridToWorld, scene } from './babylonGameScene';
import { ActionType, AliveState, ConfirmedMove, EventType, FrontendPlayer, getValidMoves, orderSide, PieceType, PlayerAction, PlayerSide, RequestMove, rotations } from './shared';

import './gameLogic'
import { createFrontendLocal, FrontendTopic } from '@frakas/api/public';
import { LogLevel } from '@frakas/api/utils/LogLevel';
import { filter, tap } from 'rxjs'

const frontend = (await createFrontendLocal(0, {loglevel: LogLevel.diagnosic}))!!
frontend.playerEnter();

var myPlayerside: PlayerSide = orderSide[0]

frontend.receiveEvent<ConfirmedMove>()
    .pipe(
        filter(e => e.topic == FrontendTopic.publicEvent),
        filter(e => e.state?.eventType == EventType.move),
        tap(e => playerMove(e.state!!.playerSide!!, e.state!!))

    ).subscribe()

const myPlayer = frontendGame.players[myPlayerside];

scene.onPointerUp = function castRay() {

    var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
    var hit = scene.pickWithRay(ray, mesh => { return mesh && mesh.name == "block" });

    console.log(hit?.pickedMesh?.id);

    if (hit?.pickedMesh != undefined && hit?.pickedPoint != undefined) {

        onSelection(myPlayer, +hit.pickedMesh.id);
    }
}

function onSelection(myPlayer: FrontendPlayer, gridPosition: number) {

    if (myPlayer.requestMove != undefined &&
        myPlayer.requestMove.playerPiece.gridPosition != gridPosition) {

        var validMoveList = getValidMoves(myPlayer.requestMove.playerPiece, myPlayer.playerSide, frontendGame.players);
        var playerAction = validMoveList.filter(m => m.gridPosition == gridPosition)[0]

        if (playerAction != undefined) {

            var requestMove = <RequestMove>{
                eventType: EventType.move,
                playerAction: playerAction,
                playerPiece: myPlayer.requestMove.playerPiece
            };

            frontend.sendEvent(requestMove);
        }

        myPlayer.requestMove = undefined;

    } else {
        selectPiece(myPlayer, gridPosition);
    }

    updateGridColor(myPlayer);
}

function selectPiece(myPlayer: FrontendPlayer, gridPosition: number) {

    for (const pieceName in myPlayer.pieces) {
        const piece = myPlayer.pieces[pieceName]!!;

        if (piece.gridPosition == gridPosition && piece.aliveState == AliveState.alive) {

            if (!myPlayer.requestMove) {
                myPlayer.requestMove = {
                    eventType: EventType.move,
                    playerPiece: piece,
                    playerAction: undefined
                };

                updateGridColor(myPlayer);

                return;
            }
            if (myPlayer.requestMove.playerPiece.gridPosition == gridPosition) {
                myPlayer.requestMove = undefined;

                updateGridColor(myPlayer);

                return;
            }
        }
    }
}


function playerMove(playerSide: PlayerSide, confirmedMove: ConfirmedMove) {

    const player = frontendGame.players[playerSide]!!;
    const piece = player.pieces[confirmedMove.playerPiece.pieceName]!!
    const newWorldPosition = gridToWorld(confirmedMove.playerAction!!.gridPosition);

    scene.beginDirectAnimation(
        player.meshes[piece.pieceName],
        [
          getPositionAnim(
            player.meshes[piece.pieceName].position,
            newWorldPosition
          ),
        ],
        0,
        25,
        false,
        10
      );
      
    piece.gridPosition = confirmedMove.playerAction!!.gridPosition;
    piece.isFirstMove = false;

    if (confirmedMove.playerAction?.actionType == ActionType.attack
        && confirmedMove.opponentPiece != undefined) {

        var opponent = frontendGame.players[+confirmedMove.opponentPiece.playerSide]!!;

        if (confirmedMove.opponentPiece.playerPiece.pieceType != PieceType.king) {
            takeoutPiece(opponent, confirmedMove.opponentPiece.playerPiece.pieceName, false);
        } else {
            opponent.aliveState = AliveState.dead

            takeoutPiece(opponent, confirmedMove.opponentPiece.playerPiece.pieceName, false);

            takeoutPlayer(opponent.playerSide);
        }

    }

    updateGridColor(myPlayer!!);
}

function updateGridColor(myPlayer: FrontendPlayer) {

    var validMoveList:PlayerAction[] = []

    if (myPlayer.requestMove != undefined) {
        validMoveList = getValidMoves(myPlayer.requestMove.playerPiece, myPlayer.playerSide, frontendGame.players);
    }

    setGridColor(validMoveList);

}

function setGridColor(validMoveList: PlayerAction[]) {

    if (myPlayer?.requestMove == undefined) {
        for (const gridPos in grid) {
            const gridEl = grid[gridPos];
            scene.beginDirectAnimation(gridEl, [getDiffuseColorAnim(gridEl.material.diffuseColor, Color3.FromInts(255, 255, 255))], 0, 25, false, 3);
        }
    } else {
        for (const gridPos in grid) {
            if (myPlayer.requestMove.playerPiece.gridPosition == +gridPos) continue;
            const gridEl = grid[gridPos];
            var blocked = false;

            for (const pieceName in myPlayer.pieces) {
                var piece = myPlayer.pieces[pieceName];
                if (piece.gridPosition == +gridPos && piece.aliveState == AliveState.alive) blocked = true;
            }

            var color = Color3.FromInts(90, 90, 90);
            if (blocked) {
                color = Color3.FromInts(255, 50, 50);
            } else if (validMoveList.some(m => m.gridPosition == +gridPos && m.actionType == ActionType.attack)) {
                color = Color3.FromInts(0, 100, 255);
            } else if (validMoveList.some(m => m.gridPosition == +gridPos && m.actionType == ActionType.move)) {
                color = Color3.FromInts(255, 255, 255);
            }
            scene.beginDirectAnimation(gridEl, [getDiffuseColorAnim(gridEl.material.diffuseColor, color)], 0, 25, false, 3);
        }
    }
}

function takeoutPlayer(playerSide: PlayerSide) {
    var opponent = frontendGame.players[playerSide]!!;
    var alivePieceName = Object.keys(opponent.pieces).filter(pieceName => opponent.pieces[pieceName].aliveState == AliveState.alive)[0]
    takeoutPiece(opponent, alivePieceName, true);
}

function takeoutPiece(opponent: FrontendPlayer, opponentPieceName: string, takeoutAll: boolean) {
    var opponentPiece = opponent.pieces[opponentPieceName];
    var opponentMesh = opponent.meshes[opponentPieceName];

    opponentPiece.aliveState = AliveState.dead;


    scene.beginDirectAnimation(
        opponentMesh,
        [getRotateAnim("r1", new Vector3(-0.5, 0, -0.5), new Vector3(0.5, 0, 0.5), BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)],
        0, 25, false, 5);

    scene.beginDirectAnimation(
        opponentMesh,
        [getPositionAnim(opponentMesh.position, new Vector3(10, 10, 10)),
        getVisibilityAnim(1, 0)],
        0, 25, false, 0.5);

    if (takeoutAll) {
        setTimeout(() => {
            var alivePieceName = Object.keys(opponent.pieces).reverse().filter(pieceName => opponent.pieces[pieceName].aliveState == AliveState.alive)[0]
            if (alivePieceName != undefined) {
                takeoutPiece(opponent, alivePieceName, true);
            }
        }, 1)
    }
}

scene.beginDirectAnimation(
    camera,
    [getRotateAlphaAnim(0, rotations[myPlayerside]), getRotateBetaAnim(10, 40)],
    0, 25, false, 0.5);