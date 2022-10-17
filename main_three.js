import './style.css'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
(function () { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = './node_modules/three/examples/jsm/libs/stats.module.js'; document.head.appendChild(script); })()

//Dekleracije globalnih spremenljivk
let renderer, scene, camera, mixer, clock, plane, panelSettings, clipAction, mixerPause;
const objects = [];
let singleStepMode = false;
let sizeOfNextStep = 0;
let currentSpeed = 1;

//GUI - Grafični uporabniški vmesnik
const panel = new GUI({ width: 310 });
const folder1 = panel.addFolder('Pausing/Stepping');
panelSettings = {
    'modify time scale': 1.0,
    'pause/continue': pauseContinue,
    'make single step': toSingleStepMode,
    'modify step size': 0.001
};
const timeScaleController = panel.add(panelSettings, 'modify time scale', -2.0, 2.0, 0.01).onChange(modifyTimeScale);
folder1.add(panelSettings, 'pause/continue');
folder1.add(panelSettings, 'make single step');
folder1.add(panelSettings, 'modify step size', -0.1, 0.1, 0.0001);

init();
render();
animate();
pauseAllActions();

//Inicilizacija
function init() {
    //Clock
    //Object for keeping track of time. This uses performance.now if it is available, otherwise it reverts to the less accurate Date.now. 
    clock = new THREE.Clock();

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

    //Dodajanje kocke
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(boxGeometry, boxMaterial);
    const cube2 = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(cube);
    scene.add(cube2);

    // all objects of this animation group share a common animation state
    const animationGroup = new THREE.AnimationObjectGroup();
    animationGroup.add(cube);
    animationGroup.add(cube2);
    /*
    */

    //Mixer za animacije, keyframeTrack-i in clip-i
    mixer = new THREE.AnimationMixer(animationGroup);

    //VectorKeyframeTrack( name : String, times : Array, values : Array )
    //name - (required) identifier for the KeyframeTrack.
    //times - (required) array of keyframe times.
    //values - values for the keyframes at the times specified, a flat array of vector components.
    //interpolation - the type of interpolation to use. See Animation Constants for possible values. Default is InterpolateLinear.

    //[time1, time2], [x1, y1, z1, x2, y2, z2]
    //Objekt začne svoj premik iz x1, y1, z1 ob času time1
    //Do x2, y2, z2 prispe ob času time2
    const keyframeTrack = new THREE.VectorKeyframeTrack('.position',
    [0, 1, 3, 4],
    [-4.5, -4.5, 0,
    0, -4.5, 0,
    0, 4.5, 0,
    4.5, 4.5, 0]);
    
    const clip = new THREE.AnimationClip('default', - 1, [keyframeTrack]);
    clipAction = mixer.clipAction(clip);
    clipAction.setLoop(THREE.LoopPingPong);
    clipAction.play();
}
//Konec inicilizacije

//Funkcije za kontrolo časa
function pauseContinue() {
    //Če pritisnemo "pause/continue" in smo v koračnem načinu, se koračni način izklopi
    if (singleStepMode) {
        singleStepMode = false;
        unPauseAllActions();
        
    } else {
        //Ko pritisnemo "pause/continue" in nismo v koračnem načinu ter animacija ne teče, se ta vklopi, ter obratno
        if (mixerPause == true) {
            unPauseAllActions();
        } else {
            pauseAllActions();
        }
    }
}
//Nastavljanje časovnega razpona na 0 za ustavljanje animacije
function pauseAllActions() {
    mixerPause = true;
    mixer.timeScale = 0;
    timeScaleController.disable(true);
}
//Nastavljanje časovnega razpona na 1 za predvajanje animacije ali koračni način
function unPauseAllActions() {
    mixerPause = false;
    mixer.timeScale = currentSpeed;
    timeScaleController.disable(false);
}
//Preklop na koračni način
function toSingleStepMode() {
    unPauseAllActions();

    singleStepMode = true;
    sizeOfNextStep = panelSettings['modify step size'];

    timeScaleController.disable(true);
}
//Modifikacija časovnega razpona
function modifyTimeScale(speed) {
    currentSpeed = speed;
    mixer.timeScale = currentSpeed;
}

//za ohranjanje velikosti v primeru da spremenimo velikost okna brskalnika
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

//Izris
function render() {
    renderer.render(scene, camera);
}

//Funkcija za animiranje
function animate() {
    requestAnimationFrame(animate);

    //.oldTime : Float
    //Holds the time at which the clock's start, .getElapsedTime() or .getDelta() methods were last called.
    //.getDelta () : Float
    //Get the seconds passed since the time .oldTime was set and sets .oldTime to the current time.

    let mixerUpdateDelta = clock.getDelta();

    //Koračni način
    if (singleStepMode) {
        //Če smo v koračnem načinu se nastavi mixerUpdateDelta na uporabniško določeno velikost koraka
        mixerUpdateDelta = sizeOfNextStep;

        //Velikost koraka se ponastavi na 0, da se korakanje ustavi po enem koraku
        sizeOfNextStep = 0;
    }

    //.update (deltaTimeInSeconds : Number) : this
    //Advances the global mixer time and updates the animation.
    mixer.update(mixerUpdateDelta);

    //Izpis časa animacije. Čas je zaokrožen na 2 decimalki
    document.getElementById("counter").innerHTML = mixer.time.toFixed(16);
    render();
}