import './style.css'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

import Stats from 'three/examples/jsm/libs/stats.module.js';

(function () { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = './node_modules/three/examples/jsm/libs/stats.module.js'; document.head.appendChild(script); })()

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EqualStencilFunc } from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let camera, scene, renderer;
let plane;
let plane2;
let pointer, raycaster;

const objects = [];

let model, skeleton, mixer, clock;
let panelSettings;

init();
render();

//Inicilizacija
function init() {

    //Kamera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, -8, 11);
    camera.up = new THREE.Vector3(0, 0, 1); //Nastavimo "up", da se Orbit Controls pravilno odzivajo glede na postavitev okolja
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    //Mreža
    const gridHelper = new THREE.GridHelper(10, 20);
    scene.add(gridHelper);
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    const geometryPlane = new THREE.PlaneGeometry(10, 10);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.5;
    //geometry.rotateX(- Math.PI / 2);
    plane = new THREE.Mesh(geometryPlane, new THREE.MeshBasicMaterial({ visible: false }));
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
        const message = '0.5m';
        const shapes = font.generateShapes(message, 0.45);
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();
        const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        geometry.translate(xMid, 0, 0);

        // make shape ( N.B. edge view not visible )
        const text = new THREE.Mesh(geometry, matLite);
        text.position.z = -0.5;
        text.position.y = -5;
        text.position.x = 4.35;
        //text.rotation.x = 3 * Math.PI / 2;
        scene.add(text);
        render();
        createPanel();
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

//Izris
function render() {
    renderer.render(scene, camera);
}

//Stikala in njima pripadajoče funkcije
var btnPause = document.getElementById("btnPause");
btnPause.addEventListener("click", play);

var btnStep = document.getElementById("btnStep");
btnStep.addEventListener("click", step);

function play() {
    paused = !paused;
    console.log(paused);
    animate();
}

function step() {
    paused = false;
    animate();
    paused = true;
}

//Dodajanje kocke
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(boxGeometry, boxMaterial);

//Panelni meni

function createPanel() {
    const panel = new GUI({ width: 310 });
    const folder3 = panel.addFolder('General Speed');
    panelSettings = {
        'modify time scale': 1.0
    };
    folder3.add(panelSettings, 'modify time scale', 0.0, 1.5, 0.01).onChange(modifyTimeScale);
    folder3.open();
}

scene.add(cube);
mixer = new THREE.AnimationMixer(cube);

//Spreminjanje TimeScale

function modifyTimeScale(speed) {
    mixer.timeScale = speed;
}

document.getElementById("coords").innerHTML = "x: " + (cube.position.x).toFixed(2) + ", y: " + (cube.position.y).toFixed(2) + ", z: " + (cube.position.z).toFixed(2);
render();

var timeNow, timeThen, deltaTime;
function setDelta(){
    timeNow = Date.now();
    deltaTime = (timeNow - timeThen) / 1000; //seconds since last frame
    timeThen = timeNow;
    //console.log(deltaTime);
}

let paused = true;
var speed = 0.01; // premik na časovno enoto 0.01m/s
var speedScale = 2;
var positionX = 0;
var counter = 0;
var moveAmount;
var direction = 1;

//Funkcija za animiranje
function animate() {
    if (paused) return;
    requestAnimationFrame(animate);
    if (cube.position.x > 2) {
        direction = -direction;
    }
    if (cube.position.x < -2) {
        direction = -direction;
    }
    moveAmount = speed * direction * speedScale;
    positionX = positionX + moveAmount;
    cube.position.x = positionX;
    counter = counter + (1 * speedScale);
    document.getElementById("counter").innerHTML = counter;
    document.getElementById("coords").innerHTML = "x: " + (cube.position.x).toFixed(2) + ", y: " + (cube.position.y).toFixed(2) + ", z: " + (cube.position.z).toFixed(2);
    render();
    setDelta();
}

//za ohranjanje velikosti v primeru da spremenimo velikost okna brskalnika
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}