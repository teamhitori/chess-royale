
import { Engine, Scene, Vector3, HemisphericLight, ShadowGenerator, PointLight, MeshBuilder, StandardMaterial, ArcRotateCamera, Matrix, Color3, AssetContainer, SceneLoader, Texture, AbstractMesh, DynamicTexture } from "babylonjs";
import { createFrontend, FrontendTopic } from '@frakas/api/public';
import { LogLevel } from "@frakas/api/utils/LogLevel";
import { bufferWhen, filter, map, Subject, tap } from "rxjs";
import { EnterGame, EventType, FrontendPlayer, GameEvent, GridBlock, GridBlockStatus, gridToWorld, PieceState, Player, PlayerPiece, PlayerSide } from "./shared";
import 'babylonjs-loaders';
import { getDiffuseColorAnim, getPositionAnim, getRotateAlphaAnim, getRotateBetaAnim } from "./animations";

var squareSize = 1;
var gridWidth = 12;
var halfGridWidth = gridWidth / 2;

// Create frontend and receive api for calling backend
var api = (await createFrontend({ loglevel: LogLevel.info }))!!;

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
engine.loadingScreen.displayLoadingUI();

// This creates a basic Babylon Scene object (non-mesh)
var scene = new Scene(engine);

// This creates an arcRotate camera
var camera = new ArcRotateCamera("camera", BABYLON.Tools.ToRadians(0), BABYLON.Tools.ToRadians(10), 14, new Vector3(halfGridWidth, 0, halfGridWidth - 0.5), scene);

camera.minZ = 0.1;
camera.wheelPrecision = 100;

camera.minZ = 0.1;
camera.wheelPrecision = 100;
camera.upperBetaLimit = BABYLON.Tools.ToRadians(80);
camera.lowerRadiusLimit = 5;
camera.upperRadiusLimit = 30;

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
    mesh.isPickable = false;

    shadowGenerator.addShadowCaster(mesh);

    return mesh;
}

var chessPieces = assetContainer.instantiateModelsToScene(name => `chess-pieces`, true, { doNotInstantiate: true });

var myPlayerSide: PlayerSide | undefined;
var myPlayer: FrontendPlayer | undefined;

// Babylonjs on pointerdown event
scene.onPointerDown = function castRay() {
    var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);

    var hit = scene.pickWithRay(ray);

    if (hit?.pickedMesh && hit.pickedMesh.name == "sphere") {

    }
}

scene.onPointerUp = function castRay() {

    var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
    var hit = scene.pickWithRay(ray);

    console.log("hit", hit?.pickedMesh?.id, hit?.pickedPoint)

    if (hit?.pickedMesh && hit.pickedMesh.name == "block" && hit.pickedPoint) {

        if (myPlayer != undefined) {
            onSelection(myPlayer, +hit.pickedMesh.id);
            setGridColor(myPlayer);
        }

        console.log("hit block", hit.pickedMesh.id, myPlayer);
    }
}

var renderLoop = new Subject<any>();

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
                    myPlayerSide = enter.myPlayerSide;
                    var player = getStartPosition(enter.myPlayerSide);
                    myPlayer = createNewPlayerMesh(player);

                    engine.loadingScreen.hideLoadingUI();
                    scene.beginDirectAnimation(camera, [getRotateAlphaAnim(0, 180), getRotateBetaAnim(10, 60)], 0, 25, false, 0.5);
                });
        })
    )
    .subscribe();

export function getStartPosition(side: PlayerSide): Player {

    var pieces: { [piece: string]: number } = {
        "pawn1": 14,
        "pawn2": 15,
        "pawn3": 16,
        "pawn4": 17,
        "pawn5": 18,
        "pawn6": 19,
        "pawn7": 20,
        "pawn8": 21,
        "tower1": 2,
        "tower2": 9,
        "knight1": 3,
        "knight2": 8,
        "bishop1": 4,
        "bishop2": 7,
        "queen": 5,
        "king": 6
    }

    var player = <Player>{
        pieces: {},
        playerSide: side
    }

    for (const pieceName in pieces) {
        var gridPosition = pieces[pieceName];
        var playerPiece = <PlayerPiece>{
            pieceState: PieceState.alive,
            gridPosition: gridPosition,
            pieceName: pieceName
        }

        player.pieces[pieceName] = playerPiece;
    }

    return player;
}

function createNewPlayerMesh(player: Player): FrontendPlayer {

    var meshes: { [name: string]: AbstractMesh } = {};

    for (const pieceName in player.pieces) {
        var piece = player.pieces[pieceName]
        const worldPosition = gridToWorld(piece.gridPosition)
        meshes[pieceName] = configureMesh(chessPieces.rootNodes[0].getChildMeshes()[pieceMapping[pieceName]].clone("", null, false)!!, Color3.Blue(), worldPosition)
    }

    return <FrontendPlayer>{
        meshes: meshes,
        selectedPiece: undefined,
        pieces: player.pieces,
        playerSide: player.playerSide
    }
}


function onSelection(myPlayer: FrontendPlayer, gridPosition: number) {
    if (myPlayer.selectedPiece != undefined && myPlayer.selectedPiece.gridPosition != gridPosition) {
        var newWorldPosition = gridToWorld(gridPosition);
        var oldPosition = myPlayer.selectedPiece.gridPosition;
        myPlayer.selectedPiece.gridPosition = gridPosition;
        //myPlayer.meshes[myPlayer.selectedPiece.pieceName].position = newWorldPosition;

        scene.beginDirectAnimation(myPlayer.meshes[myPlayer.selectedPiece.pieceName], [getPositionAnim(myPlayer.meshes[myPlayer.selectedPiece.pieceName].position, newWorldPosition)], 0, 25, false, 10);

        grid[oldPosition].material.diffuseColor = new Color3(1, 1, 1);
        grid[gridPosition].material.diffuseColor = new Color3(1, 1, 1);
        myPlayer.selectedPiece = undefined;
        return
    }

    for (const pieceName in myPlayer.pieces) {
        const piece = myPlayer.pieces[pieceName]!!;

        if (piece.gridPosition == gridPosition && piece.pieceState == PieceState.alive) {
            grid[gridPosition].material.diffuseColor = new Color3(1, 1, 0);

            if (!myPlayer.selectedPiece) {
                myPlayer.selectedPiece = piece;
                return;
            }
            if (myPlayer.selectedPiece.gridPosition == gridPosition) {
                myPlayer.selectedPiece = undefined;
                grid[gridPosition].material.diffuseColor = new Color3(1, 1, 1);
                return;
            }
        }
    }
}

function setGridColor(myPlayer: FrontendPlayer) {

    if (myPlayer.selectedPiece == undefined) {
        for (const gridPos in grid) {
            const gridEl = grid[gridPos];
            scene.beginDirectAnimation(gridEl, [getDiffuseColorAnim(gridEl.material.diffuseColor, Color3.FromInts(255,255,255))], 0, 25, false, 3);  
        }
    } else {
        for (const gridPos in grid) {
            if (myPlayer.selectedPiece.gridPosition == +gridPos) continue;
            const gridEl = grid[gridPos];
            var isUserGridEl = false;

            for (const pieceName in myPlayer.pieces) {
                var piece = myPlayer.pieces[pieceName];
                if (piece.gridPosition == +gridPos) isUserGridEl = true;
            }

            var color = Color3.FromInts(255,255,255);
            if (isUserGridEl) {
                color = Color3.FromInts(255,50,50);
            } 
            scene.beginDirectAnimation(gridEl, [getDiffuseColorAnim(gridEl.material.diffuseColor, color)], 0, 25, false, 3);
        }
    }
}



// Babylonjs render loop
engine.runRenderLoop(() => {
    renderLoop.next({})
    scene?.render();
});
