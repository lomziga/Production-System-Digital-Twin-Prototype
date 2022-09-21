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

const objects = [];

init();
render();

function init() {
  //Kamera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(0, -8, 11);
  camera.up = new THREE.Vector3(0,0,1);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  //Mreža
  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper);
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  const geometry = new THREE.PlaneGeometry(10, 10);
  gridHelper.rotation.x=Math.PI/2;
  //geometry.rotateX(- Math.PI / 2);
  plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ visible: false }));
  scene.add(plane);
  objects.push(plane);

  //Osvetljava
  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 0.75, 0.5).normalize();
  scene.add(directionalLight);

  //Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //Orbit controls za možnost obračanja okolja
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();
  controls.addEventListener('change', render);
  window.addEventListener('resize', onWindowResize);

  //Nalagalec fontov
  const loader = new FontLoader();

  //Napis "1m"
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
    text.position.y = -5;
    text.position.x = 4.35;
    //text.rotation.x = 3 * Math.PI / 2;
    scene.add(text);
  });

//Modeli 
//Modeli povzročijo nekaj lag-a na začetku
/*
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
*/
}

var stepAmount = 10; //čas koraka v milisekundah
let paused = false;
let stepMode = false;
var timeSinceTimePaused = 0;
var timePaused = 0;
var recordedTime = 0;
var recorded = false;

//Stikala in njima pripadajoče funkcije
var btnPause = document.getElementById("btnPause");
btnPause.addEventListener("click", play);

var btnStep = document.getElementById("btnStep");
btnStep.addEventListener("click", step);

function play(){
  stepMode = false;
  paused = !paused;
  console.log(paused);
}

function step(){
  stepMode = true;
  paused = true;
  recordedTime += stepAmount;
  timePaused += stepAmount;
}

//Ustvarjanje in dodajanje kocke
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshNormalMaterial();
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(boxMesh);

//Funkcija s katero se izvaja animacija
const animate = (time) => {
  if(stepMode == false){
    //v koračnem načinu se beleženja časa na izvaja (spodnja koda)
    if(paused == true){
      if(!recorded) {
        //zabeleži kdaj smo pritisnili pavzo
        timePaused = time;
        recorded = true;
      }
    }
    else {
      if(recorded){
        //če je čas pavze zabeležen
        //izračuna koliko je minilo od pavze
        timeSinceTimePaused += time - timePaused;
        recorded = false;
      }
      recordedTime = (time - timeSinceTimePaused);
      TWEEN.update(recordedTime);
    }
  }
  else{
    TWEEN.update(recordedTime);
  }
  window.requestAnimationFrame(animate);
  document.getElementById("coords").innerHTML = "x: " + (boxMesh.position.x - 0.5).toFixed(2) + ", y: " + (boxMesh.position.y - 0.5).toFixed(2) + ", z: " + (boxMesh.position.z - 0.5).toFixed(2);
  document.getElementById("time").innerHTML = "Time: " + (recordedTime / 1000).toFixed(2) + "s";
  render();
};

animate();

//Premikanje objekta s Tween-i
//Začetne koordinate
const move1 = new TWEEN.Tween({ x: 0.5, y: 0.5, z: 0.5 })
  //Končne koordinate in čas premika iz začetnih do končnih kooridant
  .to({ x: 1.5, y: 0.5, z: 0.5 }, 1000)
  .onUpdate((coords) => {
    boxMesh.position.x = coords.x;
    boxMesh.position.y = coords.y;
    boxMesh.position.z = coords.z;
  })
  //.repeat(Infinity)
  //.yoyo(true);

const move2 = new TWEEN.Tween({x: 1.5, y: 0.5, z: 0.5})
  .to({ x: 0.5, y: 0.5, z: 0.5 }, 1000)
  .onUpdate((coords) => {
    boxMesh.position.x = coords.x;
    boxMesh.position.y = coords.y;
    boxMesh.position.z = coords.z;
  })
  //.delay(1000);

move1.chain(move2);
move2.chain(move1);
move1.start();

//za ohranjanje velikosti v primeru da spremenimo velikost okna brskalnika
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

//izris
function render() {
  renderer.render(scene, camera);
}