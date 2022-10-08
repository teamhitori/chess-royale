# Chess royal

6 part series on how to build multiplayer game using Frakas.

### Part 1 - Setting things up
## Part 2 - Adding movement
### Part 3 - Adding game logic
### Part 4 - Adding multiplayer logic
### Part 5 - Putting game into the cloud
### Part 6 - Wrapping things up

Final game can be played here: `<placehoder>`

## Adding movement

### 1. Connect up the backend

Chess Royal players will all be connected to a backend server that will be responsible for running the game logic.

Open `src/shared.ts` and remove interfaces `PlayerColor` and `PlayerEvent` as these are not needed, and replace with the following:

``` ts
export enum EventType {
    GameState,
    GameSide
}

export interface GameEvent {
    type: EventType;
    data: any;
}

export interface EnterGame {
    myPlayerSide: PlayerSide
}
```
Open `src/backend.ts` and remove `sphereDefaultColor`, `playerColors` variables and the entire usage of the `api` variable. Update your `usings` so that they look as follows:

```ts
import { Color3, NullEngine, Scene } from "babylonjs";
import { BackendTopic, createBackend } from '@frakas/api/public';
import { EventType, GameEvent } from "./shared";
import { LogLevel } from "@frakas/api/utils/LogLevel";
import { filter, tap, map, bufferWhen, Subject } from "rxjs";
```

Add the following to create a Babylonjs NullEngine and Scene which will be used to run a headless version of the game engine on the server. [babylonjs docs](https://doc.babylonjs.com/typedoc/classes/BABYLON.NullEngine).

``` ts
var engine = new NullEngine();
var scene = new Scene(engine);
```
Add the following to create a render loop and execute the `renderLoop` subject once per game loop.
```ts
var renderLoop = new Subject<any>();
engine.runRenderLoop(() => {
    renderLoop.next({})
});
```
Add the following to start receiving game events. Filter by `BackendTopic.playerEnter` to recieve player enter events, buffer by renderLoop and for now, output the playerPosition. 
```ts
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
```
Now open up `frontend.ts` and remove the follow sections that reference `PlayerEvent`

```ts
// remove 
api?.sendToBackend(<PlayerEvent>{
    enable: true,
    color: myColor
});
```
```ts
// remove
api?.onPublicEvent<PlayerEvent>()
.subscribe((event) => {

});
```

now lets ad the following section toward the bottom of `frontend.ts`

```ts
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
```

Now when you refresh the page and check console output you should see the following:

```
My Player Side: top
```

### 2. Make Grid Selectable

Add the following types to `src/shared.ts`

```ts
export interface GridBlock {
    mesh: Mesh,
    material: StandardMaterial,
    defaultPosition: Vector3,
    status: GridBlockStatus
}

export enum GridBlockStatus {
    unselected,
    primary,
    secondary,
    path,
    blocked,
    hit
}
```

Your `import` statements in `src/shared.ts` should now look as follows:

```ts
import { Mesh, StandardMaterial, Vector3 } from "babylonjs"
```

Add the following variables to `src/frontend.ts` just below where we initialize the `shadowGenerator` variable

```ts
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
```

Update the foreach loop that we use to create the grid to look as follows:

```ts
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
```
Here, we've done a coiuple of things, switch the stone texture for a dynamic texture which will allow us to draw number on each grid element and will come in handy when trying to develop mevement and esure that chess pieces are moved to correct grid positions.

Your `import` statements inside of `frontend.ts` should now look as follows:

```ts
import { Engine, Scene, Vector3, HemisphericLight, ShadowGenerator, PointLight, MeshBuilder, StandardMaterial, ArcRotateCamera, Matrix, Color3, AssetContainer, SceneLoader, Texture, AbstractMesh, DynamicTexture } from "babylonjs";
import { createFrontend, FrontendTopic } from '@frakas/api/public';
import { LogLevel } from "@frakas/api/utils/LogLevel";
import { bufferWhen, filter, map, Subject, tap } from "rxjs";
import { EnterGame, EventType, GameEvent, GridBlock, GridBlockStatus, PlayerSide } from "./shared";
import 'babylonjs-loaders';
```

Run the game and you should now see somethink similar to this

I hope you enjoyed this chapter and found it useful, please leave a comment and join me in the next chapter where we'll start to add some movement and see how this looks running on a phone.

Thanks!