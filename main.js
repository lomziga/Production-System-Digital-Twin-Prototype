import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
(function () { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = './node_modules/three/examples/jsm/libs/stats.module.js'; document.head.appendChild(script); })()

let camera, scene, renderer, plane, panelSettings;
const objects = [];

var speedScale = 1;

init();
render();

//GUI - Grafični uporabniški vmesnik
const panel = new GUI({width: 310});
const folder1 = panel.addFolder('Pausing/Stepping');
panelSettings = {
    'modify time scale': 1.0,
    'pause/continue': pauseContinue,
    'make single step': toSingleStepMode,
};
panel.add(panelSettings, 'modify time scale', -2, 2, 0.1).onFinishChange(modifyTimeScale);
folder1.add(panelSettings, 'pause/continue');
folder1.add(panelSettings, 'make single step');

//Inicilizacija
function init() {
    //Renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
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
    const ambientLight = new THREE.AmbientLight(0x404040);
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

//Dodajanje poti
const path = new THREE.LineCurve3(
	new THREE.Vector3( -5, 0, 0 ),
	new THREE.Vector3( 5, 0, 0 )
);
const points = path.getPoints(50);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({color: "red", opacity: "0.5", transparent: true});
const pathObject = new THREE.Line(geometry, material);
scene.add(pathObject);

//Dodajanje strežne točke
const pointGeometry = new THREE.SphereGeometry(0.05, 15, 15);
const pointMaterial = new THREE.MeshStandardMaterial({color: "red", opacity: "0.5", transparent: true});
const servingPoint = new THREE.Mesh(pointGeometry, pointMaterial);
scene.add(servingPoint);
servingPoint.position.set(2.5, 0, 0);

//Dodajanje polja pod strežno točko
const fieldGeometry = new THREE.BoxGeometry(1.1, 1.1, 0.01)
const fieldMaterial = new THREE.MeshStandardMaterial({color: "red", opacity: "0.5", transparent: true});
const servingField = new THREE.Mesh(fieldGeometry, fieldMaterial);
scene.add(servingField);
servingField.position.set(2.5, 0, -0.49);

//Razred "Product", kateri deduje od razreda "Mesh"
class Product extends THREE.Mesh{
    constructor(serial, x, y, productColor, weight, sizeX, sizeY, sizeZ, serviceTimeRequired){
        super();
        this.serial = serial;
        this.x = x;
        this.y = y;
        this.productColor = productColor
        this.weight = weight;
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.sizeZ = sizeZ;
        this.serviceTimeRequired = serviceTimeRequired;
        this.positionTime = 0;
        this.moveAmount = 0;
        this.inService = false;
        this.inServiceTime = 0;
        this.inLine = false;
        this.geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
        this.material = new THREE.MeshStandardMaterial({color: productColor, wireframe: true});
    }
    //Izračun položaja na poti v času
    //Nevem zakaj je odstopanje pri "positionTime", zato zaokrožim
    calculatePosition(){
        this.moveAmount = (speed * speedScale) / path.getLength();
        this.positionTime = (Math.round(this.positionTime * 1e5) / 1e5) + (Math.round(this.moveAmount * 1e5 ) / 1e5);
        return this.positionTime;
    }
}

render();

function getRandomInt(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
  
let productArray = [];
let paused = true;
let speed = 0.01; //Premik na časovno enoto 0.01m/s
let counter = 0;
let spawnTimer = 0;
let spawnTime = 0;
let spawnTimeRecorded = false;
let serialSetter = 0;
let serviceOccupied = false;
let objectsMove = true;

//Funkcija za animiranje
function animate() {
    //V primeru pavze se koda pod spodnjo vrstico ne izvaja
    if (paused) return;
    requestAnimationFrame(animate);

    //Dobimo naključen čas od min do max ob katerem se doda nov produkt
    if(spawnTimeRecorded == false){
        spawnTime = getRandomInt(150, 150);
        spawnTimeRecorded = true;
    }
    
    //Dodajanje produktov
    if(spawnTimer == spawnTime){
        const product = new Product(serialSetter, -4.5, -4.5, "green", 40, 1, 1, 1, getRandomInt(150, 150));
        scene.add(product);
        productArray.push(product);
        serialSetter += 1;
        spawnTimeRecorded = false;
        spawnTimer = 0;
    }
    
    for(var i = 0; i < productArray.length; i++){
        //Zaznavanje prihoda na strežno mesto
        if(productArray[i].position.x  == servingPoint.position.x && productArray[i].position.y == servingPoint.position.y && productArray[i].position.z == servingPoint.position.z){
            //Beleženje časa objekta v strežbi
            productArray[i].inServiceTime += (counter/counter) * speedScale;
            //Zato, da se ta koda izvede samo enkrat
            if(serviceOccupied == false){
                productArray[i].inLine = true;
                productArray[i].inService = true;
                serviceOccupied = true;
            }
        }
        
        //Zaznavanje čakanja v vrsti
        if(productArray[i].inLine == true){
            try{
                if(productArray[i+1].position.x >= (productArray[i].position.x - productArray[i].sizeX)){
                    productArray[i+1].inLine = true;
                }
            }
            catch{
                console.log("Spawn full!")
            }
        }
        
        //Konec strežbe oz. objekt ni v strežbi
        if(speedScale > 0 && productArray[i].inServiceTime == productArray[i].serviceTimeRequired){
            serviceOccupied = false;
            //Vsem objektom nastavimo vrednost ".inLine = false". Torej, vsi objekti, ki so bili v vrsti se pomaknejo naprej, dokler eden ne prispe na strežno mesto.
            productArray.forEach((element) => {
                element.inLine = false;
                element.inService = false;
            });
        }

        if(speedScale < 0 && productArray[i].inServiceTime == 0){
            serviceOccupied = false;
            //Vsem objektom nastavimo vrednost ".inLine = false". Torej, vsi objekti, ki so bili v vrsti se pomaknejo naprej, dokler eden ne prispe na strežno mesto.
            productArray.forEach((element) => {
                element.inLine = false;
                element.inService = false;
            });
        }
        
        //Premiki produktov
        if(productArray[i].inLine == false){
            var cubePosition = productArray[i].calculatePosition();
            productArray[i].position.x = path.getPoint(cubePosition).x;
            productArray[i].position.y = path.getPoint(cubePosition).y;
            productArray[i].position.z = path.getPoint(cubePosition).z;
        }
        
        /*
        //Predmet je odstranjen iz table, ko prečka mejo
        if(productArray[i].position.x > 5){
            scene.remove(productArray[i]);
            productArray.shift();
        }
        */

        console.log(productArray[i].serial + ": inLine: " + productArray[i].inLine + ", inService: " + productArray[i].inService + ", inServiceTime: " + productArray[i].inServiceTime + ", serviceTimeRequired: " + productArray[i].serviceTimeRequired)
    }
    
    //Posodabljanje števca časa
    counter = counter + (1 * speedScale);
    spawnTimer += (counter/counter) * speedScale;

    //Izpis časa
    document.getElementById("counter").innerHTML = counter.toFixed(2);
    /*
    document.getElementById("coords").innerHTML = "x: " + (productArray[0].position.x).toFixed(2) + ", y: " + (productArray[0].position.y).toFixed(2) + ", z: " + (productArray[0].position.z).toFixed(2);
    */
    render();
}