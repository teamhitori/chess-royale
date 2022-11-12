import { BackendTopic, createBackendLocal } from '@frakas/api/public';
import { LogLevel } from '@frakas/api/utils/LogLevel';
import { filter, tap } from 'rxjs'
import { AI } from './ai';
import { frontendGame } from './babylonGameScene';
import { AliveState, ConfirmedMove, EventType, getValidMoves, InvalidMove, orderSide, PieceType, RequestMove } from "./shared";

var backend = (await createBackendLocal({ loglevel: LogLevel.diagnosic }))!!

backend.receiveEvent<RequestMove>()
    .pipe(
        filter(e => e.topic == BackendTopic.playerEvent),
        filter(e => e.state?.eventType == EventType.move),
        tap(e => playerMove(e.playerPosition!!, e.state!!))

    ).subscribe()

function playerMove(playerPosition: number, requestMove: RequestMove) {

    var playerSide = orderSide[playerPosition];
    const player = frontendGame.players[playerSide];
    const piece = player.pieces[requestMove.playerPiece.pieceName];

    if (piece?.aliveState == AliveState.alive) {

        player.requestMove = {
            eventType: EventType.move,
            playerPiece: piece,
            playerAction: requestMove.playerAction,
        };

        var validMoveList = getValidMoves(player.requestMove.playerPiece, player.playerSide, frontendGame.players);
        var moveTo = validMoveList.filter(m => m.gridPosition == requestMove.playerAction?.gridPosition)[0];

        if (moveTo != undefined) {
            piece.gridPosition = requestMove.playerAction!!.gridPosition;

            if (requestMove.playerAction?.opponentPiece != undefined) {

                var opponent = frontendGame.players[requestMove.playerAction?.opponentPiece.playerSide];

                if (opponent == undefined) {
                    return;
                }

                opponent.pieces[requestMove.playerAction.opponentPiece!!.playerPiece.pieceName].aliveState = AliveState.dead;

                if (requestMove.playerAction?.opponentPiece.playerPiece.pieceType == PieceType.king) {
                    opponent.aliveState = AliveState.dead
                }

                var alivePlayers = Object.keys(frontendGame.players).filter(playerSide => frontendGame.players[+playerSide].aliveState == AliveState.alive)

            }

            var confirmedMove = <ConfirmedMove>{
                eventType: EventType.move,
                playerSide: playerSide,
                playerPiece: piece,
                playerAction: moveTo,
                opponentPiece: moveTo.opponentPiece
            }

            backend.sendToAll(confirmedMove);

        } else {
            backend.sendToAll(<InvalidMove>{
                eventType: EventType.invalidMove
            });

        }
    } else {
        backend.sendToAll(<InvalidMove>{
            eventType: EventType.invalidMove
        });
    }
}

for (const playerPosition in frontendGame.players) {
    // create AI for all positions, not my own(0)
    if (+playerPosition != 0) {
        var ai = new AI(+playerPosition);
        await ai.init();
    }
}