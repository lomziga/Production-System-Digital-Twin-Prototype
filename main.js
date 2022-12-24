import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
(function () { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = './node_modules/three/examples/jsm/libs/stats.module.js'; document.head.appendChild(script); })()

let timeBetweenArrivals = [0.4, 1.2, 0.5, 1.7, 0.2, 1.6, 0.2, 1.4, 1.9];
let serviceTimes = [2, 0.7, 0.2, 1.1, 3.7, 0.6];

let camera, scene, renderer, plane, guiSettings;
const objects = [];

var speedScale = 1;

init();
render();

//GUI - Grafični uporabniški vmesnik
const gui = new GUI({width: 310});

guiSettings = {
    'simulationTime': 0,
    'timeScale': 1,
    'pause/continue': pauseContinue,
    'singleStep': toSingleStepMode,
    'serviceOcuppied': false,
    'serverBusy': 0.0,
    'serverBusyPercent': 0.0,
    'averageServingTime': 0,
    'averageWaitingTime': 0,
    'averageLineLength': 0,
};

gui.add(guiSettings, 'simulationTime').listen().disable();
gui.add(guiSettings, 'timeScale', -2, 2, 0.1).onFinishChange(modifyTimeScale);

const folder1 = gui.addFolder('pausing/stepping');
folder1.add(guiSettings, 'pause/continue');
folder1.add(guiSettings, 'singleStep');

const folder2 = gui.addFolder('statistics');
folder2.add(guiSettings, 'serviceOcuppied').listen().disable();
folder2.add(guiSettings, 'serverBusy').listen().disable();
folder2.add(guiSettings, 'serverBusyPercent', 0, 1, 0.1).listen().disable();
folder2.add(guiSettings, 'averageServingTime').listen().disable();
folder2.add(guiSettings, 'averageWaitingTime').listen().disable();
folder2.add(guiSettings, 'averageLineLength').listen().disable();

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
	new THREE.Vector3(-5, 0, 0),
	new THREE.Vector3(5, 0, 0)
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

//Položaj strežnega mesta
servingPoint.position.set(2, 0, 0);

//Dodajanje označitvenega polja pod strežno točko
const fieldGeometry = new THREE.BoxGeometry(1.1, 1.1, 0.001)
const fieldMaterial = new THREE.MeshStandardMaterial({color: "red", opacity: "0.5", transparent: true});
const servingField = new THREE.Mesh(fieldGeometry, fieldMaterial);
scene.add(servingField);
servingField.position.set(2, 0, -0.499);

//Razred "Product", kateri deduje od razreda "Mesh"
class Product extends THREE.Mesh{
    constructor(x, y, productColor, weight, speed, sizeX, sizeY, sizeZ, serviceTimeRequired){
        super();
        this.x = x;
        this.y = y;
        this.productColor = productColor
        this.weight = weight;
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.sizeZ = sizeZ;
        this.serviceTimeRequired = serviceTimeRequired;
        this.speed = speed;
        this.positionTime = 0;
        this.moveAmount = 0;
        this.inService = false;
        this.inServiceTime = 0;
        this.inServiceArea = false;
        this.inLine = false;
        this.geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
        this.material = new THREE.MeshStandardMaterial({color: productColor, wireframe: true});
    }
    //Izračun položaja na poti v času
    //Nevem zakaj je odstopanje pri "positionTime", zato zaokrožim
    calculatePosition(){
        this.moveAmount = (this.speed * speedScale) / path.getLength();
        this.positionTime = Math.round(((this.positionTime + this.moveAmount) + Number.EPSILON) * 1e5) / 1e5;
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
//let speed = 0.01;
let counter = 0;
let spawnTimer = 0;
let spawnTime = 0;
let spawnTimeRecorded = false;
let serviceOcuppiedValue = false;
let serverBusyValue = 0;

//Funkcija za animiranje
function animate() {
    //V primeru pavze se koda pod spodnjo vrstico ne izvaja
    if (paused) return;
    requestAnimationFrame(animate);
    
    //Posodabljanje števca časa
    counter = Math.round((counter + speedScale + Number.EPSILON) * 1e2) / 1e2;
    
    //Dobimo naključen čas od min do max ob katerem se doda nov produkt
    if(spawnTimeRecorded == false){
        spawnTime = getRandomInt(0, 0);
        spawnTimeRecorded = true;
    }
    
    //Dodajanje produktov
    if(spawnTimer == spawnTime){
        const product = new Product(-4.5, 0, "green", 40, 0.175, 1, 1, 1, 200);
        scene.add(product);
        productArray.push(product);
        spawnTimeRecorded = false;
        //spawnTimer = 0;
    }
    
    spawnTimer += speedScale;
    
    for(var i = 0; i < productArray.length; i++){
        //Konec strežbe oz. objekt ni v strežbi
        //Ko je speedScale pozitiven oz. teče čas naprej
        if(speedScale > 0 && productArray[i].inServiceTime == productArray[i].serviceTimeRequired){
            productArray[i].inService = false;
            //Vsem objektom nastavimo vrednost ".inLine = false". Torej, vsi objekti, ki so bili v vrsti se pomaknejo naprej, dokler eden ne prispe na strežno mesto.
            productArray.forEach((element) => {
                element.inLine = false;
            });
        }
        
        //Ko je speedScale negativen oz. teče čas nazaj
        if(speedScale < 0 && productArray[i].inServiceTime == 0){
            productArray[i].inService = false;
            //Vsem objektom nastavimo vrednost ".inLine = false". Torej, vsi objekti, ki so bili v vrsti se pomaknejo naprej, dokler eden ne prispe na strežno mesto.
            productArray.forEach((element) => {
                element.inLine = false;
            });
        }
        
        /*
        //Zaznavanje odhoda iz strežnega območja
        if((servingPoint.position.x >= productArray[i].position.x - (productArray[i].sizeX/2)) || (servingPoint.position.x <= productArray[i].position.x + (productArray[i].sizeX/2))){
            productArray[i].inServiceArea = false;
        }
        */
        
        //Zaznavanje čakanja v vrsti
        if(productArray[i].inService == true){
            productArray[i].inLine = true;
        }
        if(productArray[i].inLine == true){
            try{
                //Zaznavanje čakanja v vrsti po x in y osi
                if((productArray[i+1].position.x >= (productArray[i].position.x - productArray[i].sizeX)) && (productArray[i+1].position.x <= (productArray[i].position.x + productArray[i].sizeX)) && (productArray[i+1].position.y >= (productArray[i].position.y - productArray[i].sizeY)) && (productArray[i+1].position.y <= (productArray[i].position.y + productArray[i].sizeY))){
                    productArray[i+1].inLine = true;
                }
            }
            catch{
                
            }
            
        }
        
        //Premiki produktov
        if(productArray[i].inLine == false){
            var cubePosition = productArray[i].calculatePosition();
            productArray[i].position.x = Math.round(((path.getPoint(cubePosition).x) + Number.EPSILON) * 1e3) / 1e3;
            productArray[i].position.y = Math.round(((path.getPoint(cubePosition).y) + Number.EPSILON) * 1e3) / 1e3;
            productArray[i].position.z = Math.round(((path.getPoint(cubePosition).z) + Number.EPSILON) * 1e3) / 1e3;
        }
        
        //Beleženje časa objekta v strežbi
        if(productArray[i].inService == true){
            productArray[i].inServiceTime = Math.round((productArray[i].inServiceTime + speedScale + Number.EPSILON) * 1e2) / 1e2;
        }
        
        //Zaznavanje prihoda na strežno območje (rob objekta prečka sredino točke)
        if((servingPoint.position.x <= productArray[i].position.x + (productArray[i].sizeX/2)) && (servingPoint.position.x >= productArray[i].position.x - (productArray[i].sizeX/2))){
            productArray[i].inServiceArea = true;
        }
        else{
            productArray[i].inServiceArea = false;
        }
       
       //Zaznavanje prihoda na strežno točko (sredini objekta in točke se poravnata)
       if(productArray[i].position.x  == servingPoint.position.x && productArray[i].position.y == servingPoint.position.y && productArray[i].position.z == servingPoint.position.z){
           productArray[i].inService = true;
        }
    }
    
    //Beleženja časa zasedenosti strežnega mesta
    //V primeru, da ima katerikoli objekt v tabeli productArray vrednost inServiceArea = true, bo tudi serviceOcuppiedValue = true
    if(productArray.some(e => e.inServiceArea === true)){
        serviceOcuppiedValue = true;
        serverBusyValue += speedScale;
    }
    else{
        serviceOcuppiedValue = false;
    }

    //Seštevek časov strežbe
    const sumServiceTime = productArray.reduce(
        (accumulator, currentValue) => accumulator + currentValue.serviceTimeRequired,
        0,
    );
    
    //Izpis vrednosti na GUI
    guiSettings.simulationTime = counter;
    guiSettings.serviceOcuppied = serviceOcuppiedValue;
    guiSettings.serverBusy = serverBusyValue;
    guiSettings.serverBusyPercent = Math.round((serverBusyValue/counter + Number.EPSILON) * 1e2) / 1e2;
    guiSettings.averageServingTime = sumServiceTime/productArray.length;
    /*
    document.getElementById("coords").innerHTML = "x: " + (productArray[0].position.x).toFixed(2) + ", y: " + (productArray[0].position.y).toFixed(2) + ", z: " + (productArray[0].position.z).toFixed(2);
    */
   render();
}