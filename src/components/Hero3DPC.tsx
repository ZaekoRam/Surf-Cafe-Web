'use client';

import { Float, OrbitControls, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const GREEN = '#21E14B';
const YELLOW = '#E6FF00';
const CYAN = '#00F0FF';

const MODEL_PATH = '/models/pc_gamer_animation.glb';

/**
 * Escena 3D del hero. Todo el contenido es real, nada placeholder:
 *   - El PC gamer — "Pc Gamer (Animation)" de Caio de Oliveira en
 *     Sketchfab (CC-BY-4.0), 117 mallas, con su propia animación
 *     ("Take 001") reproduciéndose en loop.
 *   - La insignia de la rana que gira — la generó Carlo con Meshy AI a
 *     partir del logo real, con relieve de verdad (no un plano con
 *     textura, por eso se ve bien desde cualquier ángulo al girar).
 *   - Los logos de marca (ASUS ROG, AORUS, Microsoft) — también de
 *     Sketchfab, CC-BY-4.0. Créditos completos en `CREDITS.md`. Solo se
 *     muestran modelos 3D reales — nada de texto de relleno para marcas
 *     sin modelo (MSI, CORSAIR, NVIDIA, HP se quitaron por eso).
 *
 * La PC gira sobre su propio eje (no la cámara alrededor de ella) y vive
 * fija del lado derecho, centrada verticalmente. En escritorio (mouse) el
 * visitante puede además arrastrar para ver el ángulo con OrbitControls —
 * en touch se deja quieto a propósito para no robarle el scroll de la
 * página al celular (ver nota abajo).
 *
 * Nota de rendimiento: entre el PC (~4.5 MB) y la insignia de la rana
 * (~5.4 MB) el hero ya carga cerca de 10 MB solo de modelos 3D. Es mucho
 * para un celular gama media con datos móviles — si al probar en
 * dispositivo real se siente lento o tarda en aparecer, lo primero a
 * intentar es comprimir ambos con `gltf-transform` (Draco + resize de
 * texturas) antes de tocar código. Con Draco, 10 MB baja típicamente a
 * 1-2 MB sin perderse casi nada visualmente.
 */
export function Hero3DPC() {
  const [dragEnabled, setDragEnabled] = useState(false);
  const compact = useIsCompactCanvas();

  useEffect(() => {
    // Solo activa el drag en dispositivos con mouse real: OrbitControls
    // pone `touch-action: none` en el canvas apenas se monta, y eso le
    // roba el scroll vertical a cualquier touch que empiece ahí. En
    // celulares `pointer:fine` da false y ni se monta — en una laptop con
    // pantalla táctil (mouse + touch a la vez) sí se monta porque el
    // puntero primario es el trackpad; ese caso raro queda sin resolver.
    setDragEnabled(window.matchMedia('(pointer: fine)').matches);
  }, []);

  return (
    <>
      {/* Luz base: el modelo real tiene materiales PBR oscuros (vidrio,
          metal negro) que necesitan más luz blanca de la que un disipador
          de primitivas necesitaba — si no, se ve como una silueta plana. */}
      <ambientLight intensity={1.1} color="#ffffff" />
      <directionalLight position={[4, 6, 5]} intensity={3.5} color="#ffffff" />
      <directionalLight position={[-3, 2, 6]} intensity={2} color="#eafff0" />

      {/* Acentos de marca — verde neón ROG (#21E14B) domina la escena */}
      <pointLight position={[-4, 2, 3]} intensity={55} color={GREEN} distance={16} />
      <pointLight position={[0, 3, 4]} intensity={35} color={GREEN} distance={14} />
      <spotLight
        position={[0, 5, 3]}
        angle={0.5}
        penumbra={0.6}
        intensity={60}
        color={GREEN}
        distance={18}
      />
      <pointLight position={[3, -1, 3]} intensity={20} color={CYAN} distance={11} />
      <pointLight position={[0, -2, -3]} intensity={16} color={YELLOW} distance={11} />

      {/* En celular se queda la PC (protagonista, hundida al fondo) y un par
          de logos discretos y más chicos — Alienware y Microsoft se quitan
          para no amontonar, ver posiciones "compact" de cada uno. */}
      <PcPlacement />
      <SpinningLogo />
      {!compact && <AlienwareLogo />}
      <BrandModels />

      <NeonParticles count={380} />
      <GridFloor />

      {dragEnabled && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 1.7}
          rotateSpeed={0.5}
        />
      )}
    </>
  );
}

/** Posiciona el modelo según el ancho real del canvas: a la derecha en
 *  escritorio (el titular vive a la izquierda), hundido al fondo en
 *  pantallas angostas para no tapar el texto. El tamaño real del modelo lo
 *  calcula `PcModel` solo (auto-fit por bounding box) — aquí solo se aplica
 *  un multiplicador relativo entre el layout compacto y el de escritorio. */
function PcPlacement() {
  const compact = useIsCompactCanvas();

  return (
    <group position={compact ? [0, 0.6, -1.7] : [1.85, 0, -0.5]} scale={compact ? 0.95 : 1.15}>
      {/* rotationIntensity en 0: el giro de la PC lo controla `PcModel` sobre su
          propio eje — el bamboleo orgánico de Float aquí competía con eso. */}
      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.5}>
        <PcModel />
      </Float>
    </group>
  );
}

/** Tamaño visual objetivo (unidades de Three.js) para la dimensión más
 *  grande del modelo, sea cual sea su escala de origen en el .glb. */
const TARGET_SIZE = 2.1;

function useIsCompactCanvas() {
  // Calculado de una vez al primer render (no arranca en `false`): este
  // componente ya solo se monta en cliente (`next/dynamic` + `ssr: false`),
  // así que `window` siempre existe aquí. Arrancar en `false` y corregir
  // recién en un `useEffect` dejaba un instante con el acomodo de
  // escritorio completo (los 4 logos + PC grandes) antes de encogerse a la
  // versión de celular — en la compu se corrige tan rápido que no se nota,
  // pero en un celular real (JS más lento) ese instante alcanzaba a
  // pintarse y a veces se quedaba así.
  const [compact, setCompact] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const check = () => setCompact(window.innerWidth < 1024);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return compact;
}

const FROG_LOGO_PATH = '/models/frog-logo.glb';

/**
 * Insignia de la rana girando en 3D de verdad, junto al PC — llena el
 * hueco vacío entre el titular y el equipo, y refuerza la marca dentro
 * de la misma escena.
 *
 * Es el modelo que generó Carlo con Meshy AI a partir del logo real (no
 * el plano con la textura del SVG que había antes — ese se veía bien de
 * frente pero desaparecía de canto al girar; este tiene relieve real, así
 * que se ve bien desde cualquier ángulo). Sin licencia de terceros que
 * rastrear: es una generación propia, no viene de Sketchfab.
 */
function SpinningLogo() {
  return (
    <MeshyLogo
      path={FROG_LOGO_PATH}
      compactPos={[-1.2, 2.6, -2.2]}
      pos={[-2.7, 2.1, -1.2]}
      compactScale={0.6}
      scale={1.05}
      targetSize={1.3}
      spinSpeed={0.7}
    />
  );
}

/**
 * Modelo genérico con textura/material propio (generado en Meshy AI, no
 * de Sketchfab) — a diferencia de `BrandModel`, no le pinta encima un
 * tint plano: conserva el material real que ya trae. Usado por la rana y
 * por Alienware.
 */
function MeshyLogo({
  path,
  pos,
  compactPos,
  scale,
  compactScale,
  targetSize,
  spinSpeed,
  rotFix,
}: {
  path: string;
  pos: [number, number, number];
  compactPos: [number, number, number];
  scale: number;
  compactScale: number;
  targetSize: number;
  spinSpeed: number;
  rotFix?: [number, number, number];
}) {
  const compact = useIsCompactCanvas();
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(path);

  // Mismo auto-fit que el PC y los logos de marca: el modelo de Meshy trae
  // su propia escala/origen, nada que ver con las unidades de esta escena.
  const { cloned, fitScale } = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { cloned, fitScale: targetSize / maxDim };
  }, [scene, targetSize]);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * spinSpeed;
  });

  return (
    <Float speed={1.4} floatIntensity={0.7} rotationIntensity={0}>
      <group position={compact ? compactPos : pos} scale={compact ? compactScale : scale}>
        {/* Giro limpio en Y separado de la corrección de postura — ver nota
            en `BrandModel`. */}
        <group ref={group} scale={fitScale}>
          <group rotation={rotFix ?? [0, 0, 0]}>
            <primitive object={cloned} />
          </group>
        </group>
      </group>
    </Float>
  );
}

const ALIENWARE_LOGO_PATH = '/models/brands/alienware.glb';

/** Logo de Alienware — generado en Meshy AI (los mandó Carlo, sep-2026). */
function AlienwareLogo() {
  return (
    <MeshyLogo
      path={ALIENWARE_LOGO_PATH}
      compactPos={[0, -2.8, -3]}
      pos={[2.2, 1.9, -1.6]}
      compactScale={0.7}
      scale={0.95}
      targetSize={1.2}
      spinSpeed={0.45}
      // Mismo problema que AORUS: el frente apuntaba al lado contrario de
      // la cámara y el texto se veía espejeado.
      rotFix={[0, Math.PI, 0]}
    />
  );
}

useGLTF.preload(ALIENWARE_LOGO_PATH);

useGLTF.preload(FROG_LOGO_PATH);

/**
 * Modelos 3D reales de marca (los puso Carlo en Descargas, sep-2026):
 * ASUS ROG y AORUS de Sketchfab bajo CC-BY-4.0 (uso comercial permitido
 * con crédito — ver CREDITS.md en la raíz del repo). El de NVIDIA que
 * también mandó es CC-BY-**NC**-4.0 (no comercial) y por eso NO se usa
 * aquí — este es un sitio de venta. Se quitó también el texto de relleno
 * que sustituía a NVIDIA/MSI/CORSAIR/HP: si algún día llega un modelo con
 * licencia comercial clara, se agrega aquí mismo.
 *
 * Los tres modelos vienen en gris liso (o, en el caso del logo de
 * Microsoft, con un formato de textura que los loaders de Three.js ya no
 * soportan — `KHR_materials_pbrSpecularGlossiness`, una extensión de
 * glTF descontinuada). En vez de dejarlos en blanco/gris sin querer, se
 * les pinta encima un material propio en los acentos de la marca — así
 * los tres se ven a propósito, no rotos.
 */
const BRAND_MODELS: {
  path: string;
  pos: [number, number, number];
  targetSize: number;
  tint: string;
  /** Corrección de orientación para modelos que no vienen "parados" en
   *  Y-up (típico de exports hechos en Blender, que usa Z-up). */
  rotFix?: [number, number, number];
  /** true = se mece de lado a lado en vez de dar la vuelta completa — para
   *  modelos que son una placa delgada, sin reverso de verdad (el reverso
   *  sale espejeado si les toca girar hasta ahí). */
  oscillate?: boolean;
}[] = [
  // Posiciones marcadas a mano por Carlo sobre una captura de pantalla.
  { path: '/models/brands/asus-rog.glb', pos: [-1.3, 2.1, -1.8], targetSize: 1.5, tint: GREEN },
  {
    path: '/models/brands/aorus.glb',
    pos: [0.1, -0.4, -1.5],
    targetSize: 1.2,
    tint: YELLOW,
    // Venía acostado (de plano, viéndose desde arriba) Y con el frente al
    // revés — se combinan las dos correcciones: X lo para, Y lo voltea a
    // ver de frente.
    rotFix: [Math.PI / 2, 0, 0],
    // Es una placa delgada de ~50 KB (sin geometría de reverso real): dar
    // la vuelta completa enseña el reverso espejeado. Se mece en vez de
    // girar, así nunca llega a ese ángulo.
    oscillate: true,
  },
  // Subido al hueco entre ASUS ROG y Alienware — donde estaba antes
  // (junto a la PC) la tapaba la PC al girar.
  { path: '/models/brands/microsoft.glb', pos: [0.6, 1.6, -1.8], targetSize: 0.9, tint: CYAN },
];

function BrandModels() {
  const compact = useIsCompactCanvas();
  // En celular se muestra solo una, más discreta: menos carga para el
  // GPU del equipo y menos elementos compitiendo con el texto del hero.
  const models = compact ? BRAND_MODELS.slice(0, 1) : BRAND_MODELS;

  return (
    <>
      {models.map((m, i) => (
        <BrandModel key={m.path} {...m} spinSpeed={0.35 + i * 0.1} compact={compact} />
      ))}
    </>
  );
}

function BrandModel({
  path,
  pos,
  targetSize,
  tint,
  spinSpeed,
  compact,
  rotFix,
  oscillate,
}: {
  path: string;
  pos: [number, number, number];
  targetSize: number;
  tint: string;
  spinSpeed: number;
  compact: boolean;
  rotFix?: [number, number, number];
  oscillate?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(path);

  // Mismo auto-fit que el PC (ver PcModel): cada logo trae su propia
  // escala/origen de Sketchfab, nada que ver entre sí.
  const { cloned, fitScale } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: tint,
          emissive: tint,
          emissiveIntensity: 0.85,
          metalness: 0.4,
          roughness: 0.35,
        });
      }
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { cloned, fitScale: targetSize / maxDim };
  }, [scene, tint, targetSize]);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (oscillate) {
      // Se mece dentro de un rango chico, nunca llega a enseñar el reverso.
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * spinSpeed) * 0.5;
    } else {
      group.current.rotation.y += delta * spinSpeed;
    }
  });

  return (
    <Float speed={1.3} floatIntensity={0.6}>
      <group position={compact ? [1.3, -3.4, -3.2] : pos} scale={compact ? 0.55 : 1}>
        {/* El giro (useFrame) vive en ESTE grupo, limpio en Y — la corrección
            de postura (rotFix, que puede traer inclinación en X) va en el
            grupo de adentro. Si se mezclan en el mismo grupo, incrementar
            `.rotation.y` con `.x` ya inclinado hace que se vea "tambaleando"
            en vez de girar parado (pasó con AORUS). */}
        <group ref={group} scale={fitScale}>
          <group rotation={rotFix ?? [0, 0, 0]}>
            <primitive object={cloned} />
          </group>
        </group>
      </group>
    </Float>
  );
}

useGLTF.preload('/models/brands/asus-rog.glb');
useGLTF.preload('/models/brands/aorus.glb');
useGLTF.preload('/models/brands/microsoft.glb');

/**
 * Carga el modelo real y reproduce su animación incluida en loop.
 *
 * Auto-fit: el .glb viene en la escala/origen que le dio el autor original
 * en Maya (unidades arbitrarias, nada que ver con las de esta escena), así
 * que en vez de adivinar un `scale` a mano se mide el bounding box real del
 * modelo YA cargado y se recentra + escala para que siempre ocupe
 * `TARGET_SIZE` unidades sin importar qué tan grande venga el archivo.
 */
/** Radianes por segundo del giro propio de la PC — lento, "de exhibición". */
const PC_SPIN_SPEED = 0.35;

function PcModel() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions } = useAnimations(animations, group);

  // Gira sobre su propio eje Y, quieta en su lugar — antes el "giro" venía
  // de `OrbitControls autoRotate`, que en realidad orbita la CÁMARA
  // alrededor del origen del mundo. Como la PC vive descentrada (a la
  // derecha), eso hacía que pareciera irse de lado en vez de girar en sí
  // misma. Este `useFrame` gira el modelo de verdad, en su lugar.
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * PC_SPIN_SPEED;
  });

  // Cada instancia necesita su propia copia del árbol de escena — sin esto,
  // dos <PcModel/> montados a la vez (o un remount en Fast Refresh)
  // comparten el mismo objeto y se pisan entre sí.
  const { cloned, fitScale } = useMemo(() => {
    const cloned = scene.clone(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Recentra el modelo en su propio origen local ANTES de escalar —
    // así el `<Float>` que lo envuelve flota alrededor del centro real del
    // modelo, no de un origen arbitrario descentrado.
    cloned.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fitScale = TARGET_SIZE / maxDim;

    return { cloned, fitScale };
  }, [scene]);

  useEffect(() => {
    const first = animations[0]?.name;
    if (!first) return;
    const action = actions[first];
    action?.reset().fadeIn(0.4).play();
    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions, animations]);

  return (
    <group ref={group} rotation={[0, Math.PI * 0.15, 0]} scale={fitScale}>
      <primitive object={cloned} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);

/** Campo de particulas: polvo tecnologico flotando en la escena. */
function NeonParticles({ count = 380 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color(GREEN), new THREE.Color(CYAN), new THREE.Color(YELLOW)];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

      // El verde domina; cyan y amarillo son acentos.
      const color = palette[Math.random() < 0.7 ? 0 : Math.random() < 0.5 ? 1 : 2];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.03;
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.25;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Rejilla de horizonte, apenas visible: da profundidad al hero. */
function GridFloor() {
  return (
    <gridHelper
      args={[40, 40, GREEN, '#1A1F29']}
      position={[0, -2.6, 0]}
      material-transparent
      material-opacity={0.16}
    />
  );
}
