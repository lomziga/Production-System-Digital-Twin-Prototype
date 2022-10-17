import * as THREE from "https://threejs.org/build/three.module.js";

let renderer, scene, camera, mixer, clock;

init();
animate();

function init() {

		clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 10 );
    camera.position.set( 0, 0, 5 );

    const geometry = new THREE.BoxBufferGeometry();
    const material = new THREE.MeshBasicMaterial();
    
    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );
		
		mixer = new THREE.AnimationMixer( mesh );
		
		const keyframeTrack = new THREE.VectorKeyframeTrack( '.position', [ 0, 1 ], [ 0, 0, 0, 1, 0, 0 ] );
		const clip = new THREE.AnimationClip( 'default', - 1, [ keyframeTrack ] );
		
		const clipAction = mixer.clipAction( clip );
		clipAction.setLoop( THREE.LoopPingPong );
		clipAction.play();
		
}

function animate() {

    requestAnimationFrame( animate );
		
		mixer.update( clock.getDelta() );
		
    renderer.render( scene, camera );

}