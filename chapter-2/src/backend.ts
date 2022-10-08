import { Color3, NullEngine, Scene } from "babylonjs";
import { BackendTopic, createBackend } from '@frakas/api/public';
import { EnterGame, EventType, GameEvent, PlayerSide } from "./shared";
import { LogLevel } from "@frakas/api/utils/LogLevel";
import { filter, tap, mergeMap, bufferWhen, Subject } from "rxjs";

// Create backend and receive api for calling frontend
var api = await createBackend({ loglevel: LogLevel.info });

var engine = new NullEngine();
var scene = new Scene(engine);
var renderLoop = new Subject<any>();
engine.runRenderLoop(() => {
    renderLoop.next({})
});

var nextSide = 0;

api?.receiveEvent<GameEvent>()
    .pipe(
        filter(e => e.topic == BackendTopic.playerEnter),
        bufferWhen(() => renderLoop.asObservable()),
        mergeMap(e => e),
        filter(e => e?.playerPosition != undefined),
        tap(event => {
            var playerPosition = event!!.playerPosition!!;
            if (nextSide < 4) {
                
                console.log(`playerPosition:${playerPosition} is side ${PlayerSide[nextSide]}`);
                api?.sendToPlayer(
                    playerPosition,
                    <GameEvent>{
                        type: EventType.GameSide,
                        data: <EnterGame>{
                            myPlayerSide: nextSide
                        }
                    });
                nextSide++
            } else {
                console.log("Game FULL");
            }
        })
    ).subscribe();

