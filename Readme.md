# Chess royal

6 part series on how to build multiplayer game using Frakas.

## Part 1 - Setting things up
### Part 2 - Adding movement
### Part 3 - Adding game logic
### Part 4 - Adding multiplayer logic
### Part 5 - Putting game into the cloud
### Part 6 - Wrapping things up

Final game can be played here: `<placehoder>`

## Setting things up

### 1. Project setup
To get started with Frakas, you'll first need to install [NodeJs](https://nodejs.org)

I'll be using [VSCode](https://code.visualstudio.com/) for my text editor and development environment, but use whatever editor you are comfortable with.

Let's create a folder to save our project files to, lets call it `chess-royale`.

Open up a terminal and navigate to `chess-royale` folder and run the following command to install the Frakas CLI.

```bash
npm i @frakas/cli
```

Now run the following command to initalize Frakas.

```
frakas init
```
You should now see the following folder structure

![Folder structure](https://raw.githubusercontent.com/teamhitori/chess-royale/main/raw/init.jpg)


Run the following command

```
frakas serve
```

Now when you upen up your browser at the following location http://localhost:8080 you should see the folowing

![Frakas in browser](https://raw.githubusercontent.com/teamhitori/chess-royale/main/raw/frakas-init.gif)


### 2. Add game resources

For the game board, lets use this royaly fee texure https://www.pexels.com/photo/brown-parquet-172276

Create a new `assets` folder in project root and copy downloaded image `pexels-fwstudio-172276.jpg`

Next we'll find some 3d chess pieces. This collection from Turbosquid should be fine: https://www.turbosquid.com/3d-models/chess-pieces-3d-model-1502330.

The file format of this file is .fbx, in order to make this work better with Babylonjs which should convert the format to .glb. This can be done using Blender. However since blender is out of scope for this tutorial, you can obtain a copy of this resource from my repo: https://raw.githubusercontent.com/teamhitori/chess-royale/main/raw/chess.glb

Copy this file to your assets folder, and next we'll see how these look in our game.

Open `src/frontend.ts` find where we create the `groundMaterial` variable.

Replace the line
``` ts
groundMaterial.diffuseColor = myColor;
```
with
``` ts
groundMaterial.diffuseTexture = new Texture(`${api.assetsRoot}/pexels-fwstudio-172276.jpg`);
```

Change the ground mesh width and height from 6 to 1.
Remove the sphere shape by removing these lines
``` ts
// Babylonjs built-in 'sphere' shape. Params: name, options, scene
var sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
var sphereMaterial = new StandardMaterial("sphereMaterial", scene);
sphereMaterial.diffuseColor = sphereDefaultColor;
sphere.material = sphereMaterial;
```
Also remove these lines
``` ts
shadowGenerator.addShadowCaster(sphere);

// set sphere color
 sphereMaterial.diffuseColor = event.color;
```

Now lets add a chess piece to our game.

add the following code after shadowGenerator variable

``` ts
var assetContainer = await new Promise<AssetContainer>(resolve => {
        SceneLoader.LoadAssetContainer(`${api.assetsRoot}/`, "chess.glb", scene, (container) => {
            container.addAllToScene();
            for (const g of container.geometries) {
                g.meshes[0].isVisible = false
            }
            resolve(container);
        });
    });
```

And update missing imports by adding `AssetContainer, SceneLoader` to babylonjs import

Make sure you're not seeing any errors and continue by adding the following

``` ts
var chessPieces = assetContainer.instantiateModelsToScene(name => `chess-pieces`, true, { doNotInstantiate: true });
var piece = chessPieces.rootNodes[0].getChildMeshes()[0]
var meshMaterial = new StandardMaterial("groundMaterial", scene);
meshMaterial.diffuseTexture = new Texture(`${api.assetsRoot}/pexels-fwstudio-172276.jpg`);
piece.material = meshMaterial;
piece.isVisible = true;
shadowGenerator.addShadowCaster(piece);
```

Now when you upen up your browser at the following location http://localhost:8080 you should see the folowing

![Frakas Chess piece](https://raw.githubusercontent.com/teamhitori/chess-royale/main/raw/chess-piece.gif)

### 3. Create Chess board

Lets add another texture. Download the following royalty free image to `assets` folder https://www.pexels.com/photo/white-and-grey-surface-2824173/

We'll now modify our existing code to create a chess board structure. The Chess board size will be a 12 by 12 grid, bigger than a normal chess board to allow up to 4 simultaneous players.

Add the following to the to of `frontend.ts` just below the import statements

```ts
var squareSize = 1;
var gridWidth = 12;
var halfGridWidth = gridWidth / 2;
```

Add the following extra properties to camera

```ts
var camera = new ArcRotateCamera("camera", BABYLON.Tools.ToRadians(0), BABYLON.Tools.ToRadians(55), 14, new Vector3(halfGridWidth, 0, halfGridWidth), scene);

camera.setTarget(new Vector3(halfGridWidth, 0, halfGridWidth));
camera.minZ = 0.1;
camera.wheelPrecision = 100;
```

Update the ground varable to the following

``` ts
var ground = MeshBuilder.CreateGround("ground", { width: gridWidth, height: gridWidth }, scene);
    
```
``` ts
ground.position = new Vector3(halfGridWidth - (squareSize / 2), 0, halfGridWidth - (squareSize / 2));
```

Next under shadowGenerator variable add the following code to create chess board grid structure

``` ts
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

```

Under the assetContainer variable, remove the chessPieces code added earlier and replace with the following

``` ts
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

```

Lets walk through this code quickly, we create an inline function `configureMesh` tht accepts 3 vaiables, mesh, color and position. Using this function with different parameters allows us to re-use the logic to set the chess piece mesh color and position. Next we instantiate assets to scene, and create a dictionary of peices, with the name and mesh configuration.

You should now see the following

![Frakas Chess board](https://raw.githubusercontent.com/teamhitori/chess-royale/main/raw/chess-board.gif)
