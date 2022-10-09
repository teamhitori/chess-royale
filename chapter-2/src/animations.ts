import { Animation, Color3, Vector3 } from "babylonjs"

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
        frame: frameRate,
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
        frame: 0,
        value: BABYLON.Tools.ToRadians(rotationFrom)
    });
    movein_keys.push({
        frame: frameRate,
        value: BABYLON.Tools.ToRadians(rotationTo)
    });
    movein.setKeys(movein_keys);
    return movein;
}

export function getDiffuseColorAnim(colorFrom: Color3, colorTo: Color3): Animation {
    var movein = new Animation(
        "color",
        "material.diffuseColor",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_COLOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var movein_keys = [];
    movein_keys.push({
        frame: 0,
        value: colorFrom
    });
    movein_keys.push({
        frame: frameRate,
        value: colorTo
    });
    movein.setKeys(movein_keys);

    return movein;
}

export function getPositionAnim(positionFrom: Vector3, positionTo: Vector3): Animation {
    var movein = new Animation(
        "color",
        "position",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var movein_keys = [];
    movein_keys.push({
        frame: 0,
        value: positionFrom
    });
    movein_keys.push({
        frame: frameRate,
        value: positionTo
    });
    movein.setKeys(movein_keys);
    return movein;
}