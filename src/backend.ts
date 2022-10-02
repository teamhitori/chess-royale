import { Color3 } from "babylonjs";
import { createBackend } from '@frakas/api/public';
import { PlayerColor, PlayerEvent } from "./shared";
import { LogLevel } from "@frakas/api/utils/LogLevel";

// Create backend and receive api for calling frontend
var api = await createBackend({ loglevel: LogLevel.diagnosic });

// default sphere color
var sphereDefaultColor = new Color3(0.7, 0.7, 0.7);

// keep track of entered players in array
var playerColors: PlayerColor[] = [];

api?.onPlayerEvent<PlayerEvent>()
    .subscribe((event) => {

        if (event.playerState.enable) {

            // Add player color to list, if not already added
            if (!playerColors.some(p => p.playerPosition == event.playerPosition)) {
                playerColors.push({ playerPosition: event.playerPosition, color: event.playerState.color });
            }
        } else {

            // else remove player color, if exists in list
            playerColors = playerColors.filter(p => p.playerPosition != event.playerPosition);
        }

        // send most recent color to all players if exists, or else send default color
        if (playerColors.length) {
            var playerColor = playerColors[playerColors.length - 1];

            api?.sendToAll(<PlayerEvent>{
                enable: true,
                color: playerColor.color
            });
        } else {
            api?.sendToAll(<PlayerEvent>{
                enable: true,
                color: sphereDefaultColor
            });
        }
    });

