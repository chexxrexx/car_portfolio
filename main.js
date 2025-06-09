import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Setup scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // light blue 
const cameraOffset = new THREE.Vector3(0, 5, 10); 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

// Light
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

const roadLength = 100;
const roadWidth = 10;

const roadGeometry = new THREE.PlaneGeometry(10, window.innerWidth); 
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

const road1 = new THREE.Mesh(roadGeometry, roadMaterial);
const road2 = new THREE.Mesh(roadGeometry, roadMaterial);

road1.rotation.x = -Math.PI / 2;
road2.rotation.x = -Math.PI / 2;

road1.position.z = 0;
road2.position.z = -roadLength;

scene.add(road1, road2);

// Load taxi model
const loader = new GLTFLoader();
let taxi;

loader.load('/models/taxi.glb', gltf => {
  taxi = gltf.scene;
  taxi.position.set(0, 0, 0);
  taxi.scale.set(0.5,0.5,0.5);
  scene.add(taxi);
}, undefined, console.error);

function createHouse(x, z) {
  const houseGeometry = new THREE.BoxGeometry(2, 2, 2);
  const houseMaterial = new THREE.MeshStandardMaterial({ color: 0xa0522d });
  const house = new THREE.Mesh(houseGeometry, houseMaterial);
  house.position.set(x, 1, z); // y = half height
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

const spacing = 10;
const sideOffset = 10;
const range = 100;

for (let z = 0; z > -range; z -= spacing) {
  createHouse(-sideOffset, z);
  createTree(-sideOffset - 3, z + 5);

  createHouse(sideOffset, z + spacing / 2);
  createTree(sideOffset + 3, z + spacing / 2 - 5);
}

function createRoadLine(x, y, z) {
  const geometry = new THREE.BoxGeometry(0.2, 0.01, 2);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const line = new THREE.Mesh(geometry, material);
  line.position.set(x, y, z);
  scene.add(line);
  return line;
}

const roadGroup = new THREE.Group();
scene.add(roadGroup);


const road = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 1000),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0;
roadGroup.add(road);

// Add white lines to roadGroup
for (let z = 0; z > -1000; z -= 4) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.01, 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  line.position.set(0, 0.01, z);
  roadGroup.add(line);
}



const keysPressed = {};


window.addEventListener('keydown', (e) => { keysPressed[e.key] = true; });
window.addEventListener('keyup', (e) => { keysPressed[e.key] = false; });


const speed = 0.1;
const turnSpeed = 0.03;

function animate() {
  requestAnimationFrame(animate);

  if (taxi) {

    if (keysPressed['ArrowUp']) {
      taxi.position.x -= Math.sin(taxi.rotation.y) * speed;
      taxi.position.z -= Math.cos(taxi.rotation.y) * speed;
    }
    if (keysPressed['ArrowDown']) {
      taxi.position.x += Math.sin(taxi.rotation.y) * speed;
      taxi.position.z += Math.cos(taxi.rotation.y) * speed;
    }
    // Left / right turn
    if (keysPressed['ArrowLeft']) {
      taxi.rotation.y += turnSpeed;
    }
    if (keysPressed['ArrowRight']) {
      taxi.rotation.y -= turnSpeed;
    }


      const offset = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0,1,0), taxi.rotation.y);
      const cameraPosition = taxi.position.clone().add(offset);
    
      camera.position.lerp(cameraPosition, 0.1); 
      camera.lookAt(taxi.position);
    

  }

  const taxiZ = taxi.position.z;


if (taxiZ - road1.position.z < -roadLength) {
  road1.position.z -= roadLength * 2;
}
if (taxiZ - road2.position.z < -roadLength) {
  road2.position.z -= roadLength * 2;
}


  renderer.render(scene, camera);
}

animate();
