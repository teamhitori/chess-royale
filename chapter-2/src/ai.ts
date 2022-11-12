import { createFrontendLocal, FrontendTopic, IFrontendApi } from "@frakas/api/public";
import { filter, tap, map } from 'rxjs';
import { LogLevel } from "@frakas/api/utils/LogLevel";
import { ActionType, AliveState, ConfirmedMove, EventType, getValidMoves, orderSide, PieceType, PlayerSide, RequestMove } from "./shared";
import { frontendGame } from "./babylonGameScene";

const attackWeight = 10;

export class AI {
    private aiSide: PlayerSide = PlayerSide.bottom;
    private canMove = false;
    private frontendApi: IFrontendApi | undefined;

    constructor(private aiPosition: number) {
    }

    public async init() {

        this.frontendApi = (await createFrontendLocal(this.aiPosition, { loglevel: LogLevel.info }))!!;

        this.frontendApi.receiveEvent<ConfirmedMove>()
            .pipe(
                filter(e => e.topic == FrontendTopic.publicEvent),
                filter(e => e.state?.eventType == EventType.move),
                tap(e => this.playerMove(e.state!!))

            ).subscribe()

        this.frontendApi.playerEnter();

        this.calculateMove();
    }

    private calculateMove() {



        var timeout = Math.floor(Math.random() * (1500)) + 600;

        var alivePlayers = Object.keys(frontendGame.players).filter(playerSide => frontendGame.players[+playerSide].aliveState == AliveState.alive)

        if (alivePlayers.length <= 1) return;

        setTimeout(() => {
            this.calculateMove()
        }, timeout);

        if (!this.canMove) {
            //console.log("can't move");
            return;
        } else {
            //console.log("can move")
        }

        var aiSide = orderSide[this.aiPosition];
        const player = frontendGame.players[aiSide];

        if (player.aliveState == AliveState.dead) return;

        var movesWeighted: RequestMove[] = []

        for (const pieceName in player.pieces) {
            const playerPiece = player.pieces[pieceName];

            var requestMove = { playerPiece: playerPiece, playerAction: undefined }

            var validMoveList = getValidMoves(requestMove.playerPiece, player.playerSide, frontendGame.players);

            for (const move of validMoveList) {
                if (move.actionType == ActionType.attack) {
                    for (let i = 0; i < attackWeight; i++) {
                        movesWeighted.push({
                            eventType: EventType.move,
                            playerAction: move,
                            playerPiece: playerPiece
                        })
                    }
                }
                movesWeighted.push({
                    eventType: EventType.move,
                    playerAction: move,
                    playerPiece: playerPiece
                })

            }
        }

        var moveIndex = Math.floor(Math.random() * (movesWeighted.length));
        var move = movesWeighted[moveIndex];

        this.frontendApi?.sendEvent(move);
    }

    private playerMove(confirmedMove: ConfirmedMove) {

        var player = frontendGame.players[+confirmedMove.playerSide]!!;
        var piece = player!!.pieces[confirmedMove.playerPiece.pieceName]!!


        piece.gridPosition = confirmedMove.playerPiece.gridPosition;
        piece.isFirstMove = false;

        if (confirmedMove.playerAction?.actionType == ActionType.attack
            && confirmedMove.opponentPiece != undefined) {

            var opponent = frontendGame.players[+confirmedMove.opponentPiece.playerSide]!!;

            if (confirmedMove.opponentPiece.playerPiece.pieceType != PieceType.king) {

                // takeout piece
                confirmedMove.opponentPiece.playerPiece.aliveState = AliveState.dead;

            } else {
                // takeout player
                opponent.aliveState = AliveState.dead
                this.frontendApi?.dispose();
            }
        }

        player.requestMove = undefined;

        this.canMove = true;
    }
}