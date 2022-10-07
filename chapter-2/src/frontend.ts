
import { Engine, Scene, Vector3, HemisphericLight, ShadowGenerator, PointLight, MeshBuilder, StandardMaterial, ArcRotateCamera, Matrix, Color3, AssetContainer, SceneLoader, Texture, AbstractMesh } from "babylonjs";
import { createFrontend, FrontendTopic } from '@frakas/api/public';
import { PlayerEvent } from "./shared";
import { LogLevel } from "@frakas/api/utils/LogLevel";
import { filter, tap } from "rxjs";

import 'babylonjs-loaders';

var squareSize = 1;
var gridWidth = 12;
var halfGridWidth = gridWidth / 2;

// Create frontend and receive api for calling backend
var api = (await createFrontend({loglevel: LogLevel.diagnosic}))!!;

// My random player color
var myColorRaw = Math.floor(Math.floor(Math.random() * 1000));

// map raw number into Bablylon Color3 vector
var myColor = new Color3((myColorRaw % 10) / 10, ((myColorRaw / 10) % 10) / 10, ((myColorRaw / 100) % 10) / 10);

// Default Grey Color
var sphereDefaultColor = new Color3(0.7, 0.7, 0.7);

// HTML Canvas used by Babylonjs to project game scene
var canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

// Load the 3D engine
var engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

// This creates a basic Babylon Scene object (non-mesh)
var scene = new Scene(engine);

// This creates an arcRotate camera
var camera = new ArcRotateCamera("camera", BABYLON.Tools.ToRadians(0), BABYLON.Tools.ToRadians(55), 14, new Vector3(halfGridWidth, 0, halfGridWidth), scene);

camera.setTarget(new Vector3(halfGridWidth, 0, halfGridWidth));
camera.minZ = 0.1;
camera.wheelPrecision = 100;

camera.minZ = 0.1;
camera.wheelPrecision = 100;

// This attaches the camera to the canvas
camera.attachControl(canvas, true);

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
var lightH = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

// Default intensity is 1. Let's dim the light a small amount
lightH.intensity = 0.7;

var light = new PointLight("point-light", new Vector3(3, 3, -3), scene);
light.position = new Vector3(3, 10, 3);
light.intensity = 0.5;

// Babylonjs built-in 'ground' shape. Params: name, options, scene
var ground = MeshBuilder.CreateGround("ground", { width: gridWidth, height: gridWidth }, scene);
var groundMaterial = new StandardMaterial("groundMaterial", scene);
groundMaterial.diffuseTexture = new Texture(`${api.assetsRoot}/pexels-fwstudio-172276.jpg`);
ground.material = groundMaterial;
ground.receiveShadows = true;
ground.position = new Vector3(halfGridWidth - (squareSize / 2), 0, halfGridWidth - (squareSize / 2));

var shadowGenerator = new ShadowGenerator(1024, light);
shadowGenerator.useExponentialShadowMap = true;

for (let index = 0; index < gridWidth * gridWidth; index++) {
    var block = MeshBuilder.CreateBox(`block`, { width: 0.85, height: 0.1, depth: 0.85 });
    var blockMaterial = new StandardMaterial("groundMaterial", scene);
    var blockTexture = new Texture(`${api.assetsRoot}/pexels-scott-webb-2824173.jpg`);
    blockTexture.vScale = 1/ 10;
    blockTexture.uScale = 1 / 10;
    blockTexture.uOffset = Math.random();
    blockTexture.vOffset = Math.random();
    blockMaterial.diffuseTexture = blockTexture
    block.material = blockMaterial;
    block.receiveShadows = true;
    block.position = new Vector3(index % gridWidth, 0.05, Math.floor(index / gridWidth));
}

var assetContainer = await new Promise<AssetContainer>(resolve => {
    SceneLoader.LoadAssetContainer(`${api.assetsRoot}/`, "chess.glb", scene, (container) => {
        container.addAllToScene();
        for (const g of container.geometries) {
            g.meshes[0].isVisible = false
        }
        resolve(container);
    });
});

var configureMesh = (mesh: AbstractMesh, color: Color3, position: Vector3) => {
    var meshMaterial = new StandardMaterial("groundMaterial", scene);
    meshMaterial.diffuseTexture = new Texture(`${api.assetsRoot}/pexels-fwstudio-172276.jpg`);
    meshMaterial.diffuseColor = color;
    mesh.material = meshMaterial;
    mesh.position = position;
    mesh.isVisible = true;

    shadowGenerator.addShadowCaster(mesh);

    return mesh;
}

var chessPieces = assetContainer.instantiateModelsToScene(name => `chess-pieces`, true, { doNotInstantiate: true });

var pieces1 = {
    "pawn1": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[0].clone("", null, false)!!, Color3.Red(), new Vector3(-10, 0.1, 2)),
    "pawn2": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[0].clone("", null, false)!!, Color3.Red(), new Vector3(-10, 0.1, 3)),
    "pawn3": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[0].clone("", null, false)!!, Color3.Red(), new Vector3(-10, 0.1, 4)),
    "pawn4": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[0].clone("", null, false)!!, Color3.Red(), new Vector3(-10, 0.1, 5)),
    "pawn5": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[0].clone("", null, false)!!, Color3.Red(), new Vector3(-10, 0.1, 6)),
    "pawn6": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[0].clone("", null, false)!!, Color3.Red(), new Vector3(-10, 0.1, 7)),
    "pawn7": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[0].clone("", null, false)!!, Color3.Red(), new Vector3(-10, 0.1, 8)),
    "pawn8": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[0].clone("", null, false)!!, Color3.Red(), new Vector3(-10, 0.1, 9)),
    "tower1": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[1].clone("", null, false)!!, Color3.Red(), new Vector3(-11, 0.1, 2)),
    "tower2": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[1].clone("", null, false)!!, Color3.Red(), new Vector3(-11, 0.1, 9)),
    "knight1": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[5].clone("", null, false)!!, Color3.Red(), new Vector3(-11, 0.1, 3)),
    "knight2": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[5].clone("", null, false)!!, Color3.Red(), new Vector3(-11, 0.1, 8)),
    "bishop1": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[2].clone("", null, false)!!, Color3.Red(), new Vector3(-11, 0.1, 4)),
    "bishop2": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[2].clone("", null, false)!!, Color3.Red(), new Vector3(-11, 0.1, 7)),
    "queen": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[3].clone("", null, false)!!, Color3.Red(), new Vector3(-11, 0.1, 5)),
    "king": configureMesh(chessPieces.rootNodes[0].getChildMeshes()[4].clone("", null, false)!!, Color3.Red(), new Vector3(-11, 0.1, 6))
}


// Babylonjs on pointerdown event
scene.onPointerDown = function castRay() {
    var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);

    var hit = scene.pickWithRay(ray);

    if (hit?.pickedMesh && hit.pickedMesh.name == "sphere") {

        // send enable player color event to backend
        api?.sendEvent(<PlayerEvent>{
            enable: true,
            color: myColor
        });
    }
}

// Babylonjs on pointerup event
scene.onPointerUp = function castRay() {

    // send disable player color event to backend
    api?.sendEvent(<PlayerEvent>{
        enable: false
    });
}

// Babylonjs render loop
engine.runRenderLoop(() => {
    scene?.render();
});

// the canvas/window resize event handler
window.addEventListener('resize', () => {
    engine.resize();
});

// Send Player enter event to backend, ust be called before sending other events to backend
api?.playerEnter();

// receive public events from backend
api?.receiveEvent<PlayerEvent>()
    .pipe(
        filter(e => e.topic == FrontendTopic.publicEvent),
        tap(event => {
            console.log(event)
        })
    )
    .subscribe();

