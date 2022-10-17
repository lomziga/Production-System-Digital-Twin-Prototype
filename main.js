import './style.css'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EqualStencilFunc } from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
(function () { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = './node_modules/three/examples/jsm/libs/stats.module.js'; document.head.appendChild(script); })()

let camera, scene, renderer, plane, pointer, raycaster, model, skeleton, mixer, clock, panelSettings;
const objects = [];

let singleStepMode = false;
let sizeOfNextStep = 0;
var speedScale = 1;

init();
render();

//GUI - Grafični uporabniški vmesnik
const panel = new GUI({ width: 310 });
const folder1 = panel.addFolder('Pausing/Stepping');
panelSettings = {
    'modify time scale': 1.0,
    'pause/continue': pauseContinue,
    'make single step': toSingleStepMode,
};
panel.add(panelSettings, 'modify time scale', -2.0, 2.0, 0.1).onChange(modifyTimeScale);
folder1.add(panelSettings, 'pause/continue');
folder1.add(panelSettings, 'make single step');

//Inicilizacija
function init() {
    //Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    //Kamera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, -8, 11);
    camera.up = new THREE.Vector3(0, 0, 1); //Nastavimo "up", da se Orbit Controls pravilno odzivajo glede na postavitev okolja
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    //Osvetljava
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 0.75, 0.5).normalize();
    scene.add(directionalLight);

    //Orbit controls za možnost obračanja okolja
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();
    controls.addEventListener('change', render);
    window.addEventListener('resize', onWindowResize);

    //Nalagalec fontov
    const loader = new FontLoader();

    //Napis na mreži
    loader.load('./node_modules/three/examples/fonts/gentilis_regular.typeface.json', function (font) {
        const color = 0x002244;
        const matLite = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        //Tekst
        const message = '1 square = 0.5m x 0.5m';
        const shapes = font.generateShapes(message, 0.45);
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();
        const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        geometry.translate(xMid, 0, 0);

        // make shape ( N.B. edge view not visible )
        const text = new THREE.Mesh(geometry, matLite);
        text.position.z = -0.5;
        text.position.y = -5.5;
        text.position.x = 0;
        scene.add(text);
        render();
    });

    //Mreža
    const gridHelper = new THREE.GridHelper(10, 20);
    scene.add(gridHelper);
    const geometryPlane = new THREE.PlaneGeometry(10, 10);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.5;
    plane = new THREE.Mesh(geometryPlane, new THREE.MeshBasicMaterial({ visible: false }));
    scene.add(plane);
    objects.push(plane);

    /*
    //Modeli 
    //Modeli povzročijo nekaj lag-a na začetku
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
//Konec inicilizacije

//Izris
function render() {
    renderer.render(scene, camera);
}

//Za ohranjanje velikosti v primeru da spremenimo velikost okna brskalnika
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

//Funkcije za kontrolo časa
//Funkcija za prekinitev in nadaljevanje animacije
function pauseContinue() {
    paused = !paused;
    animate();
}

//Funkcija za izvedbo enega koraka animaicje. Velikost koraka je odvisna od časovnega razpona
function toSingleStepMode() {
    paused = false;
    animate();
    paused = true;
}

//Modifikacija časovnega razpona
function modifyTimeScale(speed) {
    speedScale = speed;
}

//Dodajanje kocke
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(boxGeometry, boxMaterial);

scene.add(cube);
mixer = new THREE.AnimationMixer(cube);

document.getElementById("coords").innerHTML = "x: " + (cube.position.x).toFixed(2) + ", y: " + (cube.position.y).toFixed(2) + ", z: " + (cube.position.z).toFixed(2);
render();

let paused = true;
let speed = 0.01; //Premik na časovno enoto 0.01m/s
let positionX = 0;
let counter = 0;
let moveAmount;
let direction = 1;

//Funkcija za animiranje
function animate() {
    //V primeru pavze se koda pod spodnjo vrstico ne izvaja
    if (paused) return;
    requestAnimationFrame(animate);

    //Premiki kocke
    if (cube.position.x > 2) {
        direction = -direction;
    }
    if (cube.position.x < -2) {
        direction = -direction;
    }
    moveAmount = speed * direction * speedScale;
    positionX = positionX + moveAmount;
    cube.position.x = positionX;

    //Posodabljanje števca časa
    counter = counter + (1 * speedScale);

    document.getElementById("counter").innerHTML = counter.toFixed(2);
    document.getElementById("coords").innerHTML = "x: " + (cube.position.x).toFixed(2) + ", y: " + (cube.position.y).toFixed(2) + ", z: " + (cube.position.z).toFixed(2);
    
    render();
}