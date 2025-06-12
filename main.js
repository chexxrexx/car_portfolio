import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const cameraOffset = new THREE.Vector3(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

// --- Lighting ---
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

const destinations = {
  "about me": { x: 50, z: 0 },
  "projects": { x: 150, z: 0 },
  "contact": { x: 250, z: 0 }
};

function navigate() {
  const input = document.getElementById("destinationInput").value.toLowerCase();
  const dest = destinations[input];
  if (dest) {
    showMarker(dest);
    setTargetDestination(dest);
  } else {
    alert("Destination not found.");
  }
}

// --- Road parameters ---
const roadWidth = 25;
const roadSegmentLength = 50;
const horizontalRoadWidth = 10;
const twoLaneRoadGeometry = new THREE.PlaneGeometry(horizontalRoadWidth, roadSegmentLength);


// Road materials/geometries
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadSegmentLength);

// Group to hold all roads
const roadNetwork = new THREE.Group();
scene.add(roadNetwork);

// Function to add a road segment
function addRoadSegment(x, z, rotation = 0) {
  const road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0, z);
  road.rotation.z = rotation;
  roadNetwork.add(road);
  return road;
}

// --- Build the highway system ---

// Vertical highway: from z = -200 to 200, segments every 50 units
for (let z = -200; z <= 200; z += roadSegmentLength) {
  addRoadSegment(0, z, 0);
}

function addTwoLaneCenterLine(startX, endX, zPos = 0) {
  const lineGeometry = new THREE.BoxGeometry(0.2, 0.01, 2);
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  for (let x = startX; x < endX; x += 10) {
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(x, 0.01, zPos);
    line.rotation.y = Math.PI / 2;
    roadNetwork.add(line);
  }
}
addTwoLaneCenterLine(20, 100, -50); 

// --- Add lane markings ---
function addLaneLines() {
  const lineGeometry = new THREE.BoxGeometry(0.2, 0.01, 2);
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const laneWidth = roadWidth / 5; // 5 lanes

  // Add vertical dashed lane lines (4 lines between 5 lanes)
  for (let i = -2; i <= 2; i++) {
    const xPos = i * laneWidth;
    for (let z = -200; z < 200; z += 10) {
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(xPos, 0.01, z);
      roadNetwork.add(line);
    }
  }
}
addLaneLines();

function addPedestrianCrossing(zPos) {
  const crossingGroup = new THREE.Group();

  const stripeWidth = roadWidth / 10; // width of each stripe
  const stripeLength = 1.5; // length along road direction (Z)
  const stripeGap = 1.5; // gap between stripes

  const stripeGeometry = new THREE.BoxGeometry(stripeWidth, 0.02, stripeLength);
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  // Number of stripes to cover the road width (about 10 stripes)
  const numStripes = Math.floor(roadWidth / (stripeWidth + stripeGap));

  for (let i = 0; i < numStripes; i++) {
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    // Place stripes across the road width (X axis), spaced by stripeWidth + gap
    const x = -roadWidth / 2 + i * (stripeWidth + stripeGap) + stripeWidth / 2;
    stripe.position.set(x, 0.02, zPos);
    crossingGroup.add(stripe);
  }

  roadNetwork.add(crossingGroup);
}

addPedestrianCrossing(-70);

function addSidewalks() {
  const sidewalkWidth = 4;    // width of sidewalk
  const sidewalkLength = roadSegmentLength * 9; // length of sidewalk (adjust to cover road length)
  const sidewalkHeight = 0.2;  // give some thickness to the sidewalk

  const sidewalkGeometry = new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, sidewalkLength);
  const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

  // Left sidewalk
  const leftSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
  // Position on ground + half thickness height so bottom touches the ground
  leftSidewalk.position.set(-roadWidth / 2 - sidewalkWidth / 2, sidewalkHeight / 2, 0);
  roadNetwork.add(leftSidewalk);

  // Right sidewalk
  const rightSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
  rightSidewalk.position.set(roadWidth / 2 + sidewalkWidth / 2, sidewalkHeight / 2, 0);
  roadNetwork.add(rightSidewalk);
}


addSidewalks();


function createTrafficLight() {
  const group = new THREE.Group();

  // Pole
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 16);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 1.5;
  group.add(pole);

  // Light housing (box)
  const housingGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.3);
  const housingMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const housing = new THREE.Mesh(housingGeometry, housingMaterial);
  housing.position.set(0, 3, 0);
  group.add(housing);

  // Create light circles (red, yellow, green)
  const lightRadius = 0.15;
  const lightGeometry = new THREE.CircleGeometry(lightRadius, 32);

  // Red light
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000 });
  const redLight = new THREE.Mesh(lightGeometry, redMaterial);
  redLight.position.set(0, 3.5, 0.16);
  group.add(redLight);

  // Yellow light
  const yellowMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x555500 });
  const yellowLight = new THREE.Mesh(lightGeometry, yellowMaterial);
  yellowLight.position.set(0, 3.15, 0.16);
  group.add(yellowLight);

  // Green light
  const greenMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x005500 });
  const greenLight = new THREE.Mesh(lightGeometry, greenMaterial);
  greenLight.position.set(0, 2.8, 0.16);
  group.add(greenLight);

  return group;
}

const trafficLight = createTrafficLight();
trafficLight.position.set(-10, 0, -70); 
scene.add(trafficLight);

// --- Load taxi model ---
const loader = new GLTFLoader();
let taxi = null;

loader.load('/models/taxi.glb', (gltf) => {
  taxi = gltf.scene;
  taxi.scale.set(0.5, 0.5, 0.5);
  taxi.position.set(0, 0, 230);
  scene.add(taxi);
}, undefined, console.error);

let house = null; 
loader.load('/models/House_Building_Blend.glb', (gltf) => {
  house = gltf.scene;
  for (let z = -215; z <= 220; z += 30) {
    const houseClone = house.clone();     // Left side
    const houseClone2 = house.clone();    // Right side
    houseClone.scale.set(2,2,2);
    houseClone.position.set(-20, -1.5, z);   // Left side
    houseClone.rotation.y = -3 * Math.PI / 2;
    houseClone2.scale.set(2,2,2);
    houseClone2.position.set(20, -1.5, z);   // Right side
    houseClone2.rotation.y = -Math.PI / 2;

    scene.add(houseClone);
    scene.add(houseClone2); // 🔧 This line was missing
  }
}, undefined, console.error);

let apartment = null; 
loader.load('/models/Apartment.glb', (gltf) => {
  apartment = gltf.scene;
  for (let z = -230; z <= 230; z += 30) {
    const apartClone = apartment.clone();     // Left side
    const aptClone = apartment.clone(); 
    apartClone.scale.set(0.03,0.03,0.03);   // Right side
    apartClone.position.set(-26, -0.7, z);   // Left side
    apartClone.rotation.y = -3 * Math.PI / 2;
    aptClone.scale.set(0.03,0.03,0.03);
    aptClone.position.set(26, -0.7, z);   // Right side
    aptClone.rotation.y = -Math.PI / 2;

    scene.add(apartClone);
    scene.add(aptClone); // 🔧 This line was missing
  }
}, undefined, console.error);

// --- Minimap camera setup ---
const minimapSize = 200; // size in pixels
const minimapCamera = new THREE.OrthographicCamera(
  window.innerWidth / -30, window.innerWidth / 30,
  window.innerHeight / 30, window.innerHeight / -30,
  0.1, 500
);
minimapCamera.position.set(0, 100, 0);
minimapCamera.lookAt(0, 0, 0);
minimapCamera.up.set(0, 0, -1); // so that "up" on minimap aligns with world +z axis

// --- Resize handler to update minimap camera ---
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  minimapCamera.left = window.innerWidth / -20;
  minimapCamera.right = window.innerWidth / 20;
  minimapCamera.top = window.innerHeight / 20;
  minimapCamera.bottom = window.innerHeight / -20;
  minimapCamera.updateProjectionMatrix();
});


// --- User controls ---
const keysPressed = {};

window.addEventListener('keydown', (e) => { keysPressed[e.key] = true; });
window.addEventListener('keyup', (e) => { keysPressed[e.key] = false; });

const speed = 0.2;
const turnSpeed = 0.03;

// --- Minimap border rectangle ---
const minimapBorderScene = new THREE.Scene();

const borderSize = 1.05; // slightly larger than minimap camera's view
const borderGeometry = new THREE.PlaneGeometry(minimapSize * borderSize, minimapSize * borderSize);
const borderMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const borderPlane = new THREE.Mesh(borderGeometry, borderMaterial);
borderPlane.position.z = -1; // move it slightly back
minimapBorderScene.add(borderPlane);

const borderCamera = new THREE.OrthographicCamera(-minimapSize/2, minimapSize/2, minimapSize/2, -minimapSize/2, 1, 10);
borderCamera.position.z = 5;

// --- Animate ---
function animate() {
  requestAnimationFrame(animate);

  // Update taxi controls before rendering
  if (taxi) {
    if (keysPressed['ArrowUp']) {
      taxi.position.x -= Math.sin(taxi.rotation.y) * speed;
      taxi.position.z -= Math.cos(taxi.rotation.y) * speed;
    }
    if (keysPressed['ArrowDown']) {
      taxi.position.x += Math.sin(taxi.rotation.y) * speed;
      taxi.position.z += Math.cos(taxi.rotation.y) * speed;
    }
    if (keysPressed['ArrowLeft']) {
      taxi.rotation.y += turnSpeed;
    }
    if (keysPressed['ArrowRight']) {
      taxi.rotation.y -= turnSpeed;
    }

    minimapCamera.position.set(taxi.position.x, 100, taxi.position.z);
  
  // Look straight down at the taxi's position
    minimapCamera.lookAt(taxi.position.x, 0, taxi.position.z);
  
  // Optional: maintain the up vector if needed (your current setting is okay)
    minimapCamera.up.set(0, 0, -1);

    // Update camera behind taxi
    const offset = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), taxi.rotation.y);
    const desiredPos = taxi.position.clone().add(offset);
    camera.position.lerp(desiredPos, 0.1);
    camera.lookAt(taxi.position);
  }

  // --- Render main scene ---
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissorTest(false);
  renderer.clear();
  renderer.render(scene, camera);


  const padding = 10;
  renderer.setViewport(
    window.innerWidth - minimapSize - padding,
    window.innerHeight - minimapSize - padding,
    minimapSize,
    minimapSize
  );
  renderer.setScissor(
    window.innerWidth - minimapSize - padding,
    window.innerHeight - minimapSize - padding,
    minimapSize,
    minimapSize
  );
  renderer.setScissorTest(true);

// Draw border background
renderer.render(minimapBorderScene, borderCamera);

// Draw actual minimap content
renderer.render(scene, minimapCamera);

  renderer.setScissorTest(false);
}


animate();

// --- Optional: House and Tree functions for future ---
/*
function createHouse(x, z) {
  const houseGeometry = new THREE.BoxGeometry(2, 2, 2);
  const houseMaterial = new THREE.MeshStandardMaterial({ color: 0xa0522d });
  const house = new THREE.Mesh(houseGeometry, houseMaterial);
  house.position.set(x, 1, z);
  scene.add(house);
  return house;
}

function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 1),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  );
  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.8),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
  );
  const tree = new THREE.Group();
  trunk.position.y = 0.5;
  leaves.position.y = 1.5;
  tree.add(trunk);
  tree.add(leaves);
  tree.position.set(x, 0, z);
  scene.add(tree);
  return tree;
}
*/
