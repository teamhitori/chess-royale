
import { Engine, Scene, Vector3, HemisphericLight, ShadowGenerator, PointLight, MeshBuilder, StandardMaterial, ArcRotateCamera, Matrix, Color3 } from "babylonjs";
import { createFrontend } from '@frakas/api/public';
import { PlayerEvent } from "./shared";
import { LogLevel } from "@frakas/api/utils/LogLevel";

// Create frontend and receive api for calling backend
var api = await createFrontend({loglevel: LogLevel.diagnosic});

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
var camera = new ArcRotateCamera("camera", BABYLON.Tools.ToRadians(128), BABYLON.Tools.ToRadians(40), 10, Vector3.Zero(), scene);

// This targets the camera to scene origin
camera.setTarget(Vector3.Zero());

// This attaches the camera to the canvas
camera.attachControl(canvas, true);

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
var lightH = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

// Default intensity is 1. Let's dim the light a small amount
lightH.intensity = 0.7;

var light = new PointLight("point-light", new Vector3(3, 3, -3), scene);
light.position = new Vector3(3, 10, 3);
light.intensity = 0.5;

// Babylonjs built-in 'sphere' shape. Params: name, options, scene
var sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
var sphereMaterial = new StandardMaterial("sphereMaterial", scene);
sphereMaterial.diffuseColor = sphereDefaultColor;
sphere.material = sphereMaterial;

// Move the sphere upward 1/2 its height
sphere.position.y = 1;

// Babylonjs built-in 'ground' shape. Params: name, options, scene
var ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
var groundMaterial = new StandardMaterial("groundMaterial", scene);
groundMaterial.diffuseColor = myColor;
ground.material = groundMaterial;
ground.receiveShadows = true;

// Create Shadows
var shadowGenerator = new ShadowGenerator(1024, light);
shadowGenerator.addShadowCaster(sphere);
shadowGenerator.useExponentialShadowMap = true;

// Babylonjs on pointerdown event
scene.onPointerDown = function castRay() {
    var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);

    var hit = scene.pickWithRay(ray);

    if (hit?.pickedMesh && hit.pickedMesh.name == "sphere") {

        // send enable player color event to backend
        api?.sendToBackend(<PlayerEvent>{
            enable: true,
            color: myColor
        });
    }
}

// Babylonjs on pointerup event
scene.onPointerUp = function castRay() {

    // send disable player color event to backend
    api?.sendToBackend(<PlayerEvent>{
        enable: false,
        color: myColor
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
api?.onPublicEvent<PlayerEvent>()
    .subscribe((event) => {

        // set sphere color
        sphereMaterial.diffuseColor = event.color;
    });

