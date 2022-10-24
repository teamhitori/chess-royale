import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    ShadowGenerator,
    PointLight,
    MeshBuilder,
    StandardMaterial,
    ArcRotateCamera,
    Matrix,
    Color3,
    AssetContainer,
    SceneLoader,
    Texture,
    AbstractMesh,
    InstantiatedEntries,
    TransformNode,
  } from 'babylonjs';
  import 'babylonjs-loaders';
  
  const squareSize = 1;
  const gridWidth = 12;
  const halfGridWidth = gridWidth / 2;
  
  enum PlayerSide {
    top = 0,
    left = 1,
    bottom = 2,
    right = 3,
  }
  
  enum PieceType {
    pawn,
    knight,
    bishop,
    tower,
    queen,
    king,
  }
  
  enum AliveState {
    alive,
    dead,
  }
  
  interface PlayerPiece {
    pieceName: string;
    pieceType: PieceType;
    gridPosition: number;
    aliveState: AliveState;
    isFirstMove: boolean;
  }
  
  interface Player {
    aliveState: AliveState;
    playerSide: PlayerSide;
    playerName: string;
    pieces: { [name: string]: PlayerPiece };
  }
  
  // HTML Canvas used by Babylonjs to project game scene
  var canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  
  // Load the 3D engine
  var engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });
  
  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new Scene(engine);
  
  // This creates an arcRotate camera
  var camera = new ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(0),
    BABYLON.Tools.ToRadians(10),
    16,
    new Vector3(halfGridWidth, 0, halfGridWidth - 0.5),
    scene
  );
  camera.minZ = 0.1;
  camera.wheelPrecision = 80;
  camera.pinchPrecision = 30;
  camera.angularSensibilityX = 6000;
  camera.angularSensibilityY = 6000;
  camera.upperBetaLimit = BABYLON.Tools.ToRadians(80);
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 30;
  
  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);
  
  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);
  
  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var lightH = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
  
  // Default intensity is 1. Let's dim the light a small amount
  lightH.intensity = 0.7;
  
  var light = new PointLight('point-light', new Vector3(3, 3, -3), scene);
  light.position = new Vector3(3, 10, 3);
  light.intensity = 0.5;
  
  // Babylonjs render loop
  engine.runRenderLoop(() => {
    scene?.render();
  });
  
  // the canvas/window resize event handler
  window.addEventListener('resize', () => {
    engine.resize();
  });
  
  // Babylonjs built-in 'ground' shape. Params: name, options, scene
  var ground = MeshBuilder.CreateBox('table', {
    width: gridWidth + 1,
    depth: gridWidth + 1,
    height: 1,
  }); //MeshBuilder.CreateGround("ground", { width: gridWidth, height: gridWidth }, scene);
  var groundMaterial = new StandardMaterial('groundMaterial', scene);
  groundMaterial.diffuseTexture = new Texture(
    `https://images.pexels.com/photos/172276/pexels-photo-172276.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`
  );
  ground.material = groundMaterial;
  ground.receiveShadows = true;
  ground.position = new Vector3(
    halfGridWidth - squareSize / 2,
    0,
    halfGridWidth - squareSize / 2
  );
  
  var shadowGenerator = new ShadowGenerator(1024, light);
  shadowGenerator.useExponentialShadowMap = true;
  
  for (let index = 0; index < gridWidth * gridWidth; index++) {
    var block = MeshBuilder.CreateBox(`block`, {
      width: 0.85,
      height: 0.1,
      depth: 0.85,
    });
    block.id = `${index}`;
  
    var blockMaterial = new StandardMaterial('groundMaterial', scene);
    var blockTexture = new Texture(
      `https://images.pexels.com/photos/2824173/pexels-photo-2824173.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`
    );
    blockTexture.vScale = 1 / 10;
    blockTexture.uScale = 1 / 10;
    blockTexture.uOffset = Math.random();
    blockTexture.vOffset = Math.random();
    var defaultPosition = new Vector3(
      Math.floor(index / gridWidth),
      0.55,
      index % gridWidth
    );
    blockMaterial.diffuseTexture = blockTexture;
    block.material = blockMaterial;
    block.receiveShadows = true;
    block.position = defaultPosition;
  }
  
  var assetContainer = await new Promise<AssetContainer>((resolve) => {
    SceneLoader.LoadAssetContainer(
      'https://chess-royale.frakas.net/assets/',
      'chess.glb',
      scene,
      (container) => {
        container.addAllToScene();
        for (const g of container.geometries) {
          g.meshes[0].isVisible = false;
        }
        resolve(container);
      }
    );
  });
  
  var chessPieces = assetContainer.instantiateModelsToScene(
    (name) => `chess-pieces`,
    true,
    { doNotInstantiate: true }
  );
  
  function roatate(
    gridPosition: number,
    count: number,
    isClockwise: boolean
  ): number {
    var gridSize = gridWidth * gridWidth;
  
    for (let index = 0; index < count; index++) {
      var y = Math.floor(gridPosition / gridWidth);
      var x = gridPosition % gridWidth;
  
      if (isClockwise) {
        gridPosition = x * gridWidth + (gridWidth - 1 - y);
      } else {
        gridPosition = (gridWidth - 1 - x) * gridWidth + y;
      }
    }
  
    return ((gridPosition % gridSize) + gridSize) % gridSize;
  }
  
  function getStartPosition(side: PlayerSide): Player {
    var pieces: { [piece: string]: { type: PieceType; pos: number } } = {
      pawn1: { type: PieceType.pawn, pos: 29 },
      pawn2: { type: PieceType.pawn, pos: 15 },
      pawn3: { type: PieceType.pawn, pos: 16 },
      pawn4: { type: PieceType.pawn, pos: 2 },
      pawn5: { type: PieceType.pawn, pos: 9 },
      pawn6: { type: PieceType.pawn, pos: 19 },
      pawn7: { type: PieceType.pawn, pos: 20 },
      pawn8: { type: PieceType.pawn, pos: 30 },
      tower1: { type: PieceType.tower, pos: 3 },
      tower2: { type: PieceType.tower, pos: 8 },
      knight1: { type: PieceType.knight, pos: 17 },
      knight2: { type: PieceType.knight, pos: 18 },
      bishop1: { type: PieceType.bishop, pos: 4 },
      bishop2: { type: PieceType.bishop, pos: 7 },
      queen: { type: PieceType.queen, pos: 5 },
      king: { type: PieceType.king, pos: 6 },
    };
  
    var player = <Player>{
      pieces: {},
      playerSide: side,
    };
  
    for (const pieceName in pieces) {
      var config = pieces[pieceName];
  
      switch (side) {
        case PlayerSide.top:
          break;
        case PlayerSide.left:
          config.pos = roatate(pieces[pieceName].pos, 1, true);
          break;
        case PlayerSide.bottom:
          config.pos = roatate(pieces[pieceName].pos, 2, true);
          break;
        case PlayerSide.right:
          config.pos = roatate(pieces[pieceName].pos, 3, true);
          break;
      }
  
      var playerPiece = <PlayerPiece>{
        aliveState: AliveState.alive,
        pieceType: config.type,
        gridPosition: config.pos,
        pieceName: pieceName,
        isFirstMove: true,
      };
  
      player.pieces[pieceName] = playerPiece;
    }
  
    return player;
  }
  
  
  function gridToWorld(gridPosition: number): Vector3 {
    return new Vector3(
      -Math.floor(gridPosition / gridWidth),
      0.6,
      gridPosition % gridWidth
    );
  }
  
  const colorMapping: { [playerSide in PlayerSide]: string } = {
    0: '#590696',
    1: '#FBCB0A',
    2: '#37E2D5',
    3: '#C70A80',
  };
  
  const pieceTypeMapping: { [piece: string]: PieceType } = {
    pawn1: PieceType.pawn,
    pawn2: PieceType.pawn,
    pawn3: PieceType.pawn,
    pawn4: PieceType.pawn,
    pawn5: PieceType.pawn,
    pawn6: PieceType.pawn,
    pawn7: PieceType.pawn,
    pawn8: PieceType.pawn,
    tower1: PieceType.tower,
    tower2: PieceType.tower,
    knight1: PieceType.knight,
    knight2: PieceType.knight,
    bishop1: PieceType.bishop,
    bishop2: PieceType.bishop,
    queen: PieceType.queen,
    king: PieceType.king,
  };
  
  
  for (var playerSide = 0; playerSide < 4; playerSide++) {
    var player = getStartPosition(+playerSide);
    createNewPlayerMesh(player, chessPieces);
  }
  
  function createNewPlayerMesh (player: Player, assets: InstantiatedEntries) {
    var meshes: { [name: string]: TransformNode } = {};
    for (const pieceName in player.pieces) {
      var piece = player.pieces[pieceName];
      const worldPosition = gridToWorld(piece.gridPosition);
      meshes[pieceName] = configureMesh(
        assets.rootNodes[0]
          .getChildMeshes()
          [pieceTypeMapping[pieceName]].clone('', null, false)!!,
        Color3.FromHexString(colorMapping[player.playerSide]),
        worldPosition
      );
    }
  };
  
  function configureMesh(mesh: AbstractMesh, color: Color3, position: Vector3){
    var meshMaterial = new StandardMaterial('groundMaterial', scene);
    meshMaterial.diffuseTexture = new Texture(
      `https://images.pexels.com/photos/172276/pexels-photo-172276.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`
    );
    meshMaterial.diffuseColor = color;
    mesh.material = meshMaterial;
    mesh.position = position;
    mesh.isVisible = true;
    mesh.isPickable = false;
    shadowGenerator.addShadowCaster(mesh);
    return mesh;
  };
  
  