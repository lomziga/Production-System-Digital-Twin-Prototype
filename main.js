import './style.css'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

import Stats from 'three/examples/jsm/libs/stats.module.js';

(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='./node_modules/three/examples/jsm/libs/stats.module.js';document.head.appendChild(script);})()

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EqualStencilFunc } from 'three';

let camera, scene, renderer;
let plane;
let pointer, raycaster;
let rollOverMesh, rollOverMaterial;

const objects = [];

init();
render();

function init() {
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(5, 8, 13);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // roll-over helpers
  /*const rollOverGeo = new THREE.BoxGeometry(10, 10, 10);
  rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
  rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
  scene.add(rollOverMesh);*/
  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper);
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  const geometry = new THREE.PlaneGeometry(10, 10);
  geometry.rotateX(- Math.PI / 2);
  plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ visible: false }));
  scene.add(plane);
  objects.push(plane);

  // lights
  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 0.75, 0.5).normalize();
  scene.add(directionalLight);
  //document.addEventListener('pointermove', onPointerMove);
  //document.addEventListener('pointerdown', onPointerDown);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();
  controls.addEventListener('change', render);
  window.addEventListener('resize', onWindowResize);

  //Text
  const loader = new FontLoader();

  //1m text
  loader.load('./node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const color = 0x002244;
    const matLite = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const message = '1m';
    const shapes = font.generateShapes(message, 0.45);
    const geometry = new THREE.ShapeGeometry(shapes);
    geometry.computeBoundingBox();
    const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    geometry.translate(xMid, 0, 0);

    // make shape ( N.B. edge view not visible )
    const text = new THREE.Mesh(geometry, matLite);
    text.position.z = 5;
    text.position.x = 4.35;
    text.rotation.x = 3 * Math.PI / 2;
    scene.add(text);
    //render();
  });

//MODELS 
//LOADING MODELS GIVES US SOME LAG ON START

  function loadModel(url) {
    return new Promise(resolve => {
      new GLTFLoader().load(url, resolve);
    });
  }

  let model1, model2, model3;
  let p1 = loadModel('./models/OldMetalDesk.glb').then(result => { model1 = result.scene.children[0]; });
  let p2 = loadModel('./models/OldMetalDesk.glb').then(result => { model2 = result.scene.children[0]; });
  let p3 = loadModel('./models/OldMetalDesk.glb').then(result => { model3 = result.scene.children[0]; });

  //if all Promises resolved 
  Promise.all([p1, p2, p3]).then(() => {
    //do something to the model
    model1.position.set(0, 0.45, -1.5);
    model1.scale.set(1, 1, 1);
    model1.rotation.z = 3 * Math.PI / 2;

    model2.position.set(-1.5, 0.45, 0);
    model2.scale.set(1, 1, 1);

    model3.position.set(-1.5, 0.45, 2);
    model3.scale.set(1, 1, 1);

    //add model to the scene
    scene.add(model1);
    scene.add(model2);
    scene.add(model3);

    //continue the process
    //render();
  });

}
let paused = false;
let timeAdd;

function play(){
  paused = !paused;
  console.log(paused);
}

function step(){
  timeAdd = timeAdd + 10;
}

var btnPause = document.getElementById("btnPause");
btnPause.addEventListener("click", play);

var btnStep = document.getElementById("btnStep");
btnStep.addEventListener("click", step);

//animate movement
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshNormalMaterial();
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(boxMesh);

//keep track of time
var timeSinceTimePaused = 0;
var timePaused = 0;
var recordedTime = 0;
var recorded = false;

const animate = (time) => {
    if(paused == true){
      if(!recorded) {
        timePaused = time;
        recorded = true;
      }
    } 
    else {
      if(recorded){
        timeSinceTimePaused += time - timePaused;
        recorded = false;
      }
      recordedTime = (time - timeSinceTimePaused);
      TWEEN.update(recordedTime);
   }
  window.requestAnimationFrame(animate);
  
  document.getElementById("coords").innerHTML = "x: " + (boxMesh.position.x - 0.5).toFixed(2) + ", y: " + (boxMesh.position.y - 0.5).toFixed(2) + ", z: " + (boxMesh.position.z - 0.5).toFixed(2);
  document.getElementById("time").innerHTML = "Time: " + (recordedTime / 1000).toFixed(2) + " Universal time: " + (time / 1000).toFixed(2);
  render();
};

/*//keep track of time
const animate = (t) => {

  TWEEN.update(t);
  window.requestAnimationFrame(animate);
  
  document.getElementById("coords").innerHTML = "x: " + (boxMesh.position.x - 0.5).toFixed(2) + ", y: " + (boxMesh.position.y - 0.5).toFixed(2) + ", z: " + (boxMesh.position.z - 0.5).toFixed(2);
  document.getElementById("time").innerHTML = "Time: " + (t / 1000).toFixed(2);
  render();
};*/

animate();

//starting point x: 0.5 to x: 4.5 in 4000 ms
const moveForward = new TWEEN.Tween({ x: 0.5, y: 0.5, z: -2.5 })
  .to({ x: 4.5, y: 0.5, z: -2.5 }, 2000)
  
  .onUpdate((coords) => {
    boxMesh.position.x = coords.x;
    boxMesh.position.y = coords.y;
    boxMesh.position.z = coords.z;
  })
  .delay(1000)
  .repeat(Infinity)
  .yoyo(true);

/*const moveBackward = new TWEEN.Tween({x: 4.5, y: 0.5, z: -2.5})
  .to({ x: 0.5, y: 0.5, z: -2.5 }, 2000)
  .onUpdate((coords) => {
    boxMesh.position.x = coords.x;
    boxMesh.position.y = coords.y;
    boxMesh.position.z = coords.z;
  });
moveForward.chain(moveBackward);
moveBackward.chain(moveForward);*/

moveForward.start();

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}
/*function onPointerMove(event) {
  pointer.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(objects, false);
  if (intersects.length > 0) {
    const intersect = intersects[0];
    rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
    rollOverMesh.position.divideScalar(100).floor().multiplyScalar(100).addScalar(50);
    render();
  }
}*/

/*function onPointerDown(event) {
  pointer.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(objects, false);
}*/

function render() {
  renderer.render(scene, camera);
}