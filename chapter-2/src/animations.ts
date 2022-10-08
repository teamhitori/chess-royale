import { Animation } from "babylonjs"

var frameRate = 25;

export function getRotateAlphaAnim(rotationFrom: number, rotationTo: number): Animation {
    var movein = new Animation(
        "movein",
        "alpha",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var movein_keys = [];
    movein_keys.push({
        frame: 0,
        value: BABYLON.Tools.ToRadians(rotationFrom)
    });
    movein_keys.push({
        frame: 5 * frameRate,
        value: BABYLON.Tools.ToRadians(rotationTo)
    });
    movein.setKeys(movein_keys);
    return movein;
}

export function getRotateBetaAnim(rotationFrom: number, rotationTo: number): Animation {
    var movein = new Animation(
        "movein",
        "beta",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var movein_keys = [];
    movein_keys.push({
        frame: rotationFrom,
        value: BABYLON.Tools.ToRadians(0)
    });
    movein_keys.push({
        frame: 5 * frameRate,
        value: BABYLON.Tools.ToRadians(rotationTo)
    });
    movein.setKeys(movein_keys);
    return movein;
}