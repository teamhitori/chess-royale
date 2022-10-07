import { Color3 } from "babylonjs";
import { BackendTopic, createBackend } from '@frakas/api/public';
import { PlayerColor, PlayerEvent } from "./shared";
import { LogLevel } from "@frakas/api/utils/LogLevel";
import { filter, tap } from "rxjs";

// Create backend and receive api for calling frontend
var api = await createBackend({ loglevel: LogLevel.info });

// default sphere color
var sphereDefaultColor = new Color3(0.7, 0.7, 0.7);

// keep track of entered players
var playerColors: { [playerPosition: number]: Color3 | undefined } = {};

api?.receiveEvent<PlayerEvent>()
    .pipe(
        filter(e => e.topic == BackendTopic.playerEvent),
        tap(event => {
            // set player color (if defined)
            playerColors[event.playerPosition!!] = event?.state?.color;

            // send most recent color to all players if exists, or else send default color
            if (event?.state?.color) {
                api?.sendToAll(<PlayerEvent>{
                    enable: true,
                    color: event?.state?.color
                });
            } else {
                api?.sendToAll(<PlayerEvent>{
                    enable: false
                });
            }
        })
    ).subscribe();

