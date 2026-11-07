import * as THREE from 'three';

// ==========================================
// 1. Configuración de la Escena
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6ec6ff);
scene.fog = new THREE.Fog(0x6ec6ff, 25, 60);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(8, 5, 14);
camera.lookAt(8, 3, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ==========================================
// 2. Luces
// ==========================================
const luzAmbiente = new THREE.HemisphereLight(0xffffff, 0x7caa5c, 2.2);
scene.add(luzAmbiente);

const luzSol = new THREE.DirectionalLight(0xffffff, 2.6);
luzSol.position.set(10, 20, 10);
luzSol.castShadow = true;
luzSol.shadow.mapSize.set(2048, 2048);
luzSol.shadow.camera.left = -30;
luzSol.shadow.camera.right = 30;
luzSol.shadow.camera.top = 20;
luzSol.shadow.camera.bottom = -10;
scene.add(luzSol);


const RUTA_TEXTURAS = './src/img/texture/';
const manager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(manager);

// Función auxiliar para cargar texturas y darles formato
function cargarTextura(archivo, repeticionesY = 1) {
    const tex = textureLoader.load(RUTA_TEXTURAS + archivo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    // Ajuste para que las texturas no se estiren
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, repeticionesY);
    
    return tex;
}

// Cargamos las imágenes
const texTierra = cargarTextura('ground.jpg');
const texTierraRelleno = cargarTextura('ground.jpg', 4); // 4 repeticiones para el bloque largo
const texSuelo = cargarTextura('pasto.jpg');
const texSueloLado = cargarTextura('suelo-lado.jpg');
const texLadrillo = cargarTextura('ladrillo.jpg');
const texSorpresa = cargarTextura('sorpresa.jpg');
const texPiedra = cargarTextura('piedra.jpg');
const texColumna = cargarTextura('columna.jpg');

// ==========================================
// 4. Materiales
// ==========================================
const matSueloLado = new THREE.MeshLambertMaterial({ map: texSueloLado });

const MATERIALES = {
    // El suelo usa 6 caras: pasto arriba, tierra abajo, y lado en los costados
    suelo: [
        matSueloLado, matSueloLado, 
        new THREE.MeshLambertMaterial({ map: texSuelo }), 
        new THREE.MeshLambertMaterial({ map: texTierra }), 
        matSueloLado, matSueloLado 
    ],
    tierra: new THREE.MeshLambertMaterial({ map: texTierraRelleno }),
    ladrillo: new THREE.MeshLambertMaterial({ map: texLadrillo }),
    sorpresa: new THREE.MeshLambertMaterial({ map: texSorpresa, emissive: 0x332200 }),
    piedra: new THREE.MeshLambertMaterial({ map: texPiedra }),
    columna: new THREE.MeshLambertMaterial({ map: texColumna }),
    gema: new THREE.MeshPhongMaterial({ color: 0x26c6da, emissive: 0x0b5560, shininess: 100 })
};

// ==========================================
// 5. Geometrías
// ==========================================
const GEO_BLOQUE = new THREE.BoxGeometry(1, 1, 1);
const GEO_TIERRA = new THREE.BoxGeometry(1, 4, 1);
const GEO_GEMA = new THREE.OctahedronGeometry(0.28);

// ==========================================
// 6. Construcción del Escenario (TILEMAP)
// ==========================================
const MAPA = [
  "",
  "                                                                   ooo                               SS",
  "          G                                                        BBB                              SSS",
  "                              oooo                                                                 SSSS",
  "                              BBBB                    SS   S                                      SSSSS",
  "        GBGBG                                        SSS   SS     BGBGB          oo   GGG        SSSSSS",
  "                    C                     C         SSSS   SSS                                  SSSSSSS",
  "  P            E    C               E E   C    E   SSSSS   SSSS K       E E               E    SSSSSSSS   F",
  "#########################  #############################   ######################  ###########################",
];

const grupoNivel = new THREE.Group();
scene.add(grupoNivel);

const caracteresSolidos = ["#", "B", "G", "S", "C"];
const gemasParaAnimar = [];
const alturaMapa = MAPA.length;

// Recorremos el mapa fila por fila
for (let y = 0; y < alturaMapa; y++) {
    const fila = MAPA[y];
    const yMundo = alturaMapa - 1 - y; // Invertimos la Y para que el mapa se dibuje bien

    for (let x = 0; x < fila.length; x++) {
        const caracter = fila[x];

        if (caracteresSolidos.includes(caracter)) {
            // Elegir material según el carácter
            let material;
            if (caracter === "#") material = MATERIALES.suelo;
            else if (caracter === "B") material = MATERIALES.ladrillo;
            else if (caracter === "G") material = MATERIALES.sorpresa;
            else if (caracter === "S") material = MATERIALES.piedra;
            else if (caracter === "C") material = MATERIALES.columna;

            // Crear el bloque
            const bloque = new THREE.Mesh(GEO_BLOQUE, material);
            bloque.position.set(x + 0.5, yMundo + 0.5, 0);
            bloque.castShadow = true;
            bloque.receiveShadow = true;
            grupoNivel.add(bloque);

            // Si es suelo, agregarle el relleno de tierra abajo
            if (caracter === "#") {
                const tierra = new THREE.Mesh(GEO_TIERRA, MATERIALES.tierra);
                tierra.position.set(x + 0.5, yMundo - 1.5, 0);
                tierra.receiveShadow = true;
                grupoNivel.add(tierra);
            }
        } 
        // Crear gemas
        else if (caracter === "o") {
            const gema = new THREE.Mesh(GEO_GEMA, MATERIALES.gema);
            gema.position.set(x + 0.5, yMundo + 0.5, 0);
            gema.castShadow = true;
            gema.userData.posicionBaseY = yMundo + 0.5; // Guardamos su posición original
            grupoNivel.add(gema);
            gemasParaAnimar.push(gema); // Las guardamos para animarlas
        }
    }
}

// ==========================================
// 7. Animación y Renderizado
// ==========================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const reloj = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const tiempo = reloj.getElapsedTime();

    // Hacer que las gemas giren y floten un poquito
    for (let i = 0; i < gemasParaAnimar.length; i++) {
        const gema = gemasParaAnimar[i];
        gema.rotation.y = tiempo * 2;
        // Usamos la posición base para que no se vayan volando hacia arriba
        gema.position.y = gema.userData.posicionBaseY + Math.sin(tiempo * 3 + i) * 0.1;
    }

    renderer.render(scene, camera);
}

animate();

