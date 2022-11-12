## What is this article all about 🔎

Writing you're own games that you can play and share with friends is a uniquely challenging and rewarding endevour. The downside to web games is that the final game miht generally not look or play as well as a naitively running game, and this might be due to inefficiencies in how the browser utilizes device resources, although this picture is improving all the time.

Just my oppinion but web games are great for casual games, they have a low barrier to entry, and coding in Typescript is just a great way to get into software development.

In this turorial, I'd like to build on the work that we did in my first tutorial on laying out a basic game scene using Babylonjs.  Please check it out here.

Today I'll build on this by adding a basic single player mode.

Play the Final game Here

At the end of this tutorial we'll have created the following

## 1. House keeping

Lets start with a bit of tidy up, we don't live in a barn, we'll move stuff around to give ourselfs more space. 

![cleaning](https://media.giphy.com/media/3zwx8yctzAxuzmUWJ1/giphy.gif)

Delete the contents of `shared.ts`, and `backend.ts`, we don't need this code. 

Move the following `enum` and `interface` declarations from `frontend.ts` into `shared.ts`: `PlayerSide`, `PieceType`, `AliveState`, `PlayerPiece`, `Player`. Update these declaration to include the 'export' keyword so that these declarations can be referrenced externally. 

Next lets move code from `frontend.ts` into to a new file called `babylonGameScene.ts`, the simplest way to do this is to rename `frontend.ts` to `babylonGameScene.ts`, and create a new `frontend.ts` file.


## 2. Adding Movement

![Adding Movement](https://media.giphy.com/media/RLcQGYmQU36d3FceiP/giphy.gif)

Ok so now we need a way to keep track of which chess piece or grid block the player has selected and where they want to move. A player move consists of an action and a chess piece. An action consists of a grid number, an action type and optionally details about the opponents piece (we'll use this later). Add the following declarations to `shared.ts`

``` ts
export enum ActionType {
  move,
  attack,
  defend,
}

export interface PlayerAction {
  gridPosition: number;
  actionType: ActionType;
  opponentPiece: { playerSide: PlayerSide; playerPiece: PlayerPiece } | undefined;
}

export interface RequestMove {
  playerPiece: PlayerPiece;
  playerAction: PlayerAction | undefined;
}
```

Next update the `Player` interface declaration to include a new property `requestMove: RequestMove | undefined`, is should now look as follows:

``` ts
export interface Player {
  aliveState: AliveState;
  playerSide: PlayerSide;
  playerName: string;
  pieces: { [name: string]: PlayerPiece };
  requestMove: RequestMove | undefined,
}
```

Next we'll add the following interfaces, the first that extends `Player` and will house our chess mesh objects, and the second that will ecapsulate a collection of players. 

``` ts
export interface FrontendPlayer extends Player {
    meshes: { [name: string]: AbstractMesh },
}

export interface FrontendGame {
  players: { [playerSide: number]: FrontendPlayer }
}
```

Back inside `babylonGameScene.ts`, somewhere towards the top of the file where we create variables, add the following:

``` ts
export const frontendGame: FrontendGame = { players: {} };
```

Find where we create the `scene` and `camera` objects and add the `export` keyword

``` ts
// This creates a basic Babylon Scene object (non-mesh)
export const scene = new Scene(engine);

// ....
export const camera = new ArcRotateCamera( ... );
```

Find the `createNewPlayerMesh` function, and just after the foreach, add the following

``` ts 
  return <FrontendPlayer>{
    meshes: meshes,
    requestMove: undefined,
    pieces: player.pieces,
    playerSide: player.playerSide,
    aliveState: AliveState.alive,
  };
```

Find the foreach loop where we call `createNewPlayerMesh` and replace with the following:

```ts
  frontendGame.players[+playerSide] = createNewPlayerMesh(player, chessPieces);
```

So much code and still no movement, I hear you cry. Well hold one, we've done a lot, we've defined our main game objects and now we're ready to add behaviour.

![Smart](https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif)


Turn to `frontend.ts`, this file should be empty at this point, lets add the following:

``` ts
import './babylonGameScene';
```

Your code shold look as follows:
### Stackblitz
{% stackblitz https://stackblitz.com/edit/frakas-chess-royale-11-9mm6h5?file=src/frontend.ts %}

Lets capture a pointer event in order to move our chess pieces

``` ts
scene.onPointerUp = function castRay() {

    var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
    var hit = scene.pickWithRay(ray, mesh => { return mesh && mesh.name == "block" });

    console.log(hit?.pickedMesh?.id);

    if (hit?.pickedMesh != undefined && hit?.pickedPoint != undefined) {

        onSelection(myPlayer, +hit.pickedMesh.id);

    }
}
```

We use a ray to indicate where on the chess board the player has touched or clicked, and we call `onSelection` with this information

``` ts
function onSelection(myPlayer: FrontendPlayer, gridPosition: number) {

    if (myPlayer.requestMove != undefined &&
        myPlayer.requestMove.playerPiece.gridPosition != gridPosition) {

        var playerAction = <PlayerAction>{
            actionType: ActionType.move,
            gridPosition: gridPosition,
            opponentPiece: undefined
        }

        if (playerAction != undefined) {

            var requestMove = <RequestMove>{
                playerAction: playerAction,
                playerPiece: myPlayer.requestMove.playerPiece
            };

            playerMove(myPlayer.playerSide, requestMove);
        }

        myPlayer.requestMove = undefined;

    } else {
        selectPiece(myPlayer, gridPosition);
    }
}
```

In our on selection function, we use the `requestMove` property of our `FrontendPlayer` object to identify if we've already selected a chess piece, in which case the action is to move this piece. Or else we're just selecting the piece. Our `selectPiece` looks like this:

``` ts
function selectPiece(myPlayer: FrontendPlayer, gridPosition: number) {

    for (const pieceName in myPlayer.pieces) {
        const piece = myPlayer.pieces[pieceName]!!;

        if (piece.gridPosition == gridPosition && piece.aliveState == AliveState.alive) {

            if (!myPlayer.requestMove) {
                myPlayer.requestMove = {
                    playerPiece: piece,
                    playerAction: undefined
                };

                return;
            }
            if (myPlayer.requestMove.playerPiece.gridPosition == gridPosition) {
                myPlayer.requestMove = undefined;

                return;
            }
        }
    }
}
```

We loop though our chess pieces to see if the gird positions match, if so, we select this piece. Our player move looks like this:

``` ts
function playerMove(playerSide: PlayerSide, confirmedMove: RequestMove) {

    const player = frontendGame.players[playerSide]!!;
    const piece = player.pieces[confirmedMove.playerPiece.pieceName]!!
    const pieceMesh = player.meshes[confirmedMove.playerPiece.pieceName]!!
    const newWorldPosition = gridToWorld(confirmedMove.playerAction!!.gridPosition);

    pieceMesh.position = newWorldPosition;
    piece.gridPosition = confirmedMove.playerAction!!.gridPosition;
    piece.isFirstMove = false;
}

```

We pass in our player object ad details of the confirmed move, and use this to update our mesh position. At this point we should have movement, a bit jumpy and hard to follow at this point but a good start. Lets add some animation to make things clearer to see.

{% stackblitz https://stackblitz.com/edit/frakas-chess-royale-11-cgu2oo?file=src/shared.ts %}

## 2. Adding Animation

![Animation](https://media.giphy.com/media/l2JhL0Gpfbvs4Y07K/giphy.gif)

Lets improve our chess piece movement by adding in some animation so that we can more easily track grid transitions.

We'll put all of our animation code into a file called `animations.ts`

Add the following helper functions `getRotateAnim`, `getRotateAlphaAnim`, `getRotateBetaAnim`, `getDiffuseColorAnim`, `getPositionAnim`, `getVisibilityAnim`:

``` ts
import { Animation, Color3, Vector3 } from "babylonjs"

var frameRate = 25;


export function getRotateAnim(name: string, rotationFrom: Vector3, rotationTo: Vector3, repeatType: number): Animation {
    var movein = new Animation(
        name,
        "rotation",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        repeatType
    );
    var movein_keys = [];
    movein_keys.push({
        frame: 0,
        value: rotationFrom
    });
    movein_keys.push({
        frame: frameRate / 2,
        value: rotationTo
    });
    movein_keys.push({
        frame: frameRate,
        value: rotationFrom
    });
    movein.setKeys(movein_keys);
    return movein;
}

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
        "position",
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

export function getVisibilityAnim(visibilityFrom: number, visibilityTo: number): Animation {
    var movein = new Animation(
        "visibility",
        "visibility",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var movein_keys = [];
    movein_keys.push({
        frame: 0,
        value: visibilityFrom
    });
    movein_keys.push({
        frame: frameRate,
        value: visibilityTo
    });
    movein.setKeys(movein_keys);
    return movein;
}
```

For each of these helper functions, we build an animation that we can apply to a gamescene object based on some parameters.

Open up `shared.ts` and add the following

``` ts
export const rotations: { [playerSide in PlayerSide]: number } = {
    0: 180,
    1: 90,
    2: 0,
    3: 270
}
```

We'll find our `playerMove` function inside `frontend.ts` and replace:

```ts
// replace this line
pieceMesh.position = newWorldPosition;
```

with:
``` ts
scene.beginDirectAnimation(
    player.meshes[piece.pieceName],
    [
      getPositionAnim(
        player.meshes[piece.pieceName].position,
        newWorldPosition
      ),
    ],
    0,
    25,
    false,
    10
  );
```

At the bottom of our file, we'll add the following animation to transition to our start position

``` ts
scene.beginDirectAnimation(
  camera,
  [getRotateAlphaAnim(0, rotations[PlayerSide.bottom]), getRotateBetaAnim(10, 40)],
  0, 25, false, 0.5);
```

We should how have the following:

{% stackblitz https://stackblitz.com/edit/frakas-chess-royale-11-51c3e2?file=src/frontend.ts %}

## 3. Adding movement rules
![Player](https://media.giphy.com/media/xT5LMTu9hcv3ZxN5UQ/giphy.gif)

Now that we have movement and animation, lets add in our chess movement rules, for instance our pawns will be able to move one grid at a time, except for the first move in which they can move 3 (it's chess royale so we're allowed to bend the rules a bit :). 

Lets open up `shared.ts` and add the following definitions that we'll use to define how our chess pieces will move

``` ts
export enum MovementType {
  fixed,
  continuous
}

export enum GridBlockStatus {
  unselected,
  primary,
  secondary,
  path,
  blocked,
  hit
}

export interface Movement {
  movementType: MovementType,
  moveDirection: { x: number, y: number }[],
  attackDirection: { x: number, y: number }[]
}

export interface GridBlock {
  mesh: Mesh,
  material: StandardMaterial,
  defaultPosition: Vector3,
  status: GridBlockStatus
}
```

Now we'll use these difinitions to construct a list of valid moves for each chess piece type

``` ts
export const validMoves: { [pieceTypeName: string]: Movement } = {
  "pawn-first-move": {
      movementType: MovementType.fixed,
      moveDirection: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 0 }, { x: -1, y: 0 }],
      attackDirection: [{ x: 1, y: 1 }, { x: -1, y: 1 }]
  },
  "pawn": {
      movementType: MovementType.fixed,
      moveDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }],
      attackDirection: [{ x: 1, y: 1 }, { x: -1, y: 1 }]
  },
  "tower": <Movement>{
      movementType: MovementType.continuous,
      moveDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }],
      attackDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }]
  },
  "knight": <Movement>{
      movementType: MovementType.fixed,
      moveDirection: [{ x: 1, y: 2 }, { x: -1, y: 2 }, { x: 2, y: -1 }, { x: 2, y: 1 }, { x: -1, y: -2 }, { x: 1, y: -2 }, { x: -2, y: 1 }, { x: -2, y: -1 }],
      attackDirection: [{ x: 1, y: 2 }, { x: 2, y: -1 }, { x: -1, y: -2 }, { x: -2, y: 1 }]
  },
  "bishop": <Movement>{
      movementType: MovementType.continuous,
      moveDirection: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }],
      attackDirection: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }]
  },
  "queen": <Movement>{
      movementType: MovementType.continuous,
      moveDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }],
      attackDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }]
  },
  "king": <Movement>{
      movementType: MovementType.fixed,
      moveDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }],
      attackDirection: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }]
  }
}
```

We'll now turn to `frontend.ts` and add a few functions that will allow us to visualize these movements. The first is a large function (which can definately be simplified), the prupose of this function is to return a list of allowed moves for a selected chess piece

``` ts
function getValidMoves(playerPiece: PlayerPiece, playerSide: PlayerSide, players: { [playerSide: number]: Player | FrontendPlayer }): PlayerAction[] {

    var actualMoveList: PlayerAction[] = [];

    var myplayer = players[playerSide]

    if (myplayer.aliveState == AliveState.alive && playerPiece.aliveState == AliveState.alive) {

        var pieceTypeName: string = PieceType[playerPiece.pieceType]

        var moves = playerPiece.pieceType == PieceType.pawn &&
            playerPiece.isFirstMove == true ? validMoves["pawn-first-move"] : validMoves[pieceTypeName];

        moves.moveDirection.forEach(m => {
            var myRelativeGridPos = roatate(playerPiece.gridPosition, playerSide, false);

            var nextPosition = myRelativeGridPos + m.x + m.y * gridWidth;
            var rawMoveList: number[] = [];

            // first work out player moves without cosidering collisions
            if (moves.movementType == MovementType.continuous) {

                while (
                    nextPosition >= 0 &&
                    nextPosition < gridWidth * gridWidth &&
                    Math.floor((myRelativeGridPos + m.y * gridWidth) / gridWidth) == Math.floor((nextPosition) / gridWidth)) {

                    rawMoveList.push(nextPosition);

                    myRelativeGridPos = nextPosition;
                    nextPosition += m.x + m.y * gridWidth;
                }
            } else {
                if (nextPosition >= 0 &&
                    nextPosition < gridWidth * gridWidth &&
                    Math.floor((myRelativeGridPos + m.y * gridWidth) / gridWidth) == Math.floor((nextPosition) / gridWidth)) {

                    rawMoveList.push(nextPosition)
                }
            }

            // now itterate throgh moves and exclude collisions, for valid moves, work out if the movement will
            // hit an apponents piece
            for (const move of rawMoveList) {
                for (const pieceName in myplayer.pieces) {
                    const piece = myplayer.pieces[pieceName];

                    var playerGridPos = roatate(piece.gridPosition, playerSide, false);

                    if (playerGridPos == move && piece.aliveState == AliveState.alive) {
                        return;
                    }
                }

                for (const opponentSide in players) {
                    const opponent = players[+opponentSide];

                    if (+opponentSide == playerSide) continue;
                    if (opponent.aliveState == AliveState.dead) continue;

                    for (const opponentPieceName in opponent.pieces) {
                        var opponentPiece = opponent.pieces[opponentPieceName];
                        var relativePosition = roatate(opponentPiece.gridPosition, playerSide, false);

                        if (relativePosition == +move && opponentPiece.aliveState == AliveState.alive) {
                            actualMoveList.push({
                                actionType: ActionType.attack,
                                gridPosition: roatate(move, playerSide, true),
                                opponentPiece: { playerSide: +opponentSide, playerPiece: opponentPiece }
                            });
                            return;
                        }
                    }
                }

                actualMoveList.push({ actionType: ActionType.move, gridPosition: roatate(move, myplayer.playerSide, true), opponentPiece: undefined });
            }
        });
    }

    console.log(`${playerPiece.pieceName}: ${AliveState[playerPiece.aliveState]}, player: ${AliveState[myplayer.aliveState]} moves`, actualMoveList)

    return actualMoveList;
}
```

We first build a list of potential moves based on the correct piece position, and the list of allowed movements. We then exclude from this list any collisions with our own chess pieces. We then return this list along with whether this move will result in an attack on our opponents piece.

Next we'll add the following helper function
``` ts
function roatate(gridPosition: number, count: number, isClockwise: boolean): number {

    var gridSize = gridWidth * gridWidth;

    for (let index = 0; index < count; index++) {
        var y = Math.floor(gridPosition / gridWidth);
        var x = (gridPosition % gridWidth);

        if (isClockwise) {
            gridPosition = (x * gridWidth) + ((gridWidth - 1) - y);
        } else {
            gridPosition = (((gridWidth - 1) - x) * gridWidth) + y;
        }

    }

    return ((gridPosition % gridSize) + gridSize) % gridSize;
}
```

We'll now add functions to update our grid colors based on this information

``` ts
function updateGridColor(myPlayer: FrontendPlayer) {

    var validMoveList:PlayerAction[] = []

    if (myPlayer.requestMove != undefined) {
        validMoveList = getValidMoves(myPlayer.requestMove.playerPiece, myPlayer.playerSide, frontendGame.players);
    }

    setGridColor(validMoveList);

}

function setGridColor(validMoveList: PlayerAction[]) {

    if (myPlayer?.requestMove == undefined) {
        for (const gridPos in grid) {
            const gridEl = grid[gridPos];
            scene.beginDirectAnimation(gridEl, [getDiffuseColorAnim(gridEl.material.diffuseColor, Color3.FromInts(255, 255, 255))], 0, 25, false, 3);
        }
    } else {
        for (const gridPos in grid) {
            if (myPlayer.requestMove.playerPiece.gridPosition == +gridPos) continue;
            const gridEl = grid[gridPos];
            var blocked = false;

            for (const pieceName in myPlayer.pieces) {
                var piece = myPlayer.pieces[pieceName];
                if (piece.gridPosition == +gridPos && piece.aliveState == AliveState.alive) blocked = true;
            }

            var color = Color3.FromInts(90, 90, 90);
            if (blocked) {
                color = Color3.FromInts(255, 50, 50);
            } else if (validMoveList.some(m => m.gridPosition == +gridPos && m.actionType == ActionType.attack)) {
                color = Color3.FromInts(0, 100, 255);
            } else if (validMoveList.some(m => m.gridPosition == +gridPos && m.actionType == ActionType.move)) {
                color = Color3.FromInts(255, 255, 255);
            }
            scene.beginDirectAnimation(gridEl, [getDiffuseColorAnim(gridEl.material.diffuseColor, color)], 0, 25, false, 3);
        }
    }
}
```

{% stackblitz https://stackblitz.com/edit/frakas-chess-royale-11-zanxnd?file=src/shared.ts %}

## 4. Adding Game Logic


## 5. Adding AI
![AI](https://media.giphy.com/media/C3DJ5zE2l2VUc/giphy.gif)

### Stackblitz
{% stackblitz https://stackblitz.com/edit/frakas-chess-royale-11-51c3e2?file=src/frontend.ts %}

This completes the initial game setup, and everything I wanted to get to in this tutorial. I really hope you enjoyed, and thank for reading to the end 👏 Please stay tunes for the next article where I will run through adding movement and setting up the backend so that multiple players can complete. Any feedback, would be great to hear from you in the comments!

Have a nice day 🌞 
