
import { Engine, Scene, Vector3, HemisphericLight, ShadowGenerator, PointLight, MeshBuilder, StandardMaterial, ArcRotateCamera, Matrix, Color3, AssetContainer, SceneLoader, Texture, AbstractMesh, DynamicTexture } from "babylonjs";
import { createFrontend, FrontendTopic } from '@frakas/api/public';
import { LogLevel } from "@frakas/api/utils/LogLevel";
import { bufferWhen, filter, map, Subject, tap } from "rxjs";
import { EnterGame, EventType, GameEvent, GridBlock, GridBlockStatus, PlayerSide } from "./shared";
import 'babylonjs-loaders';

var squareSize = 1;
var gridWidth = 12;
var halfGridWidth = gridWidth / 2;

// Create frontend and receive api for calling backend
var api = (await createFrontend({loglevel: LogLevel.info}))!!;

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

var pieceMapping: { [piece: string]: number } = {
    "pawn1": 0,
    "pawn2": 0,
    "pawn3": 0,
    "pawn4": 0,
    "pawn5": 0,
    "pawn6": 0,
    "pawn7": 0,
    "pawn8": 0,
    "tower1": 1,
    "tower2": 1,
    "knight1": 5,
    "knight2": 5,
    "bishop1": 2,
    "bishop2": 2,
    "queen": 3,
    "king": 4
}

var grid: { [index: number]: GridBlock } = {};

for (let index = 0; index < gridWidth * gridWidth; index++) {
    var block = MeshBuilder.CreateBox(`block`, { width: 0.85, height: 0.1, depth: 0.85 });
    block.id = `${index}`;
    var blockMaterial = new StandardMaterial("groundMaterial", scene);
    var blockTexture = new DynamicTexture("dynamic texture", { width: 512, height: 256 }, scene);

    var font = "bold 100px monospace";

    blockTexture.drawText(`${index}`, 75, 135, font, "green", "white", true, true);

    var defaultPosition = new Vector3(Math.floor(index / gridWidth), 0.05, index % gridWidth);
    blockMaterial.diffuseTexture = blockTexture;
    block.material = blockMaterial;
    block.receiveShadows = true;
    block.position = defaultPosition;

    grid[index] = <GridBlock>{
        mesh: block,
        defaultPosition: defaultPosition,
        material: blockMaterial,
        status: GridBlockStatus.unselected
    }
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

var myPlayerSide: PlayerSide | undefined;

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

    }
}

// Babylonjs on pointerup event
scene.onPointerUp = function castRay() {

}

var renderLoop = new Subject<any>();
// Babylonjs render loop
engine.runRenderLoop(() => {
    renderLoop.next({})
    scene?.render();
});

// the canvas/window resize event handler
window.addEventListener('resize', () => {
    engine.resize();
});

// Send Player enter event to backend, ust be called before sending other events to backend
api?.playerEnter();

// receive public events from backend
api?.receiveEvent<GameEvent>()
    .pipe(
        map(e => e),
        bufferWhen(() => renderLoop.asObservable()),
        tap(event => {
            event
                .filter(gameEvent => gameEvent?.topic == FrontendTopic.privateEvent)
                .map(gameEvent => gameEvent?.state?.data!! as EnterGame)
                .forEach(enter => {
                    console.log(`My Player Side: ${PlayerSide[enter.myPlayerSide]}`)
                    myPlayerSide = enter.myPlayerSide;
                });
        })
    )
    .subscribe();


