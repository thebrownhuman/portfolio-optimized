import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Preload } from "@react-three/drei";
import { suspend } from "suspend-react";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { loadEnvMap } from "./utils/envMap";
import { setSceneBusy, useGpuTier } from "./utils/gpuTier";
import { coarsePointer } from "./utils/pointer";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";

const textureLoader = new THREE.TextureLoader();
const imageUrls = [
  "/images/react2.webp",
  "/images/next2.webp",
  "/images/node2.webp",
  "/images/express.webp",
  "/images/mongo.webp",
  "/images/mysql.webp",
  "/images/typescript.webp",
  "/images/javascript.webp",
];
const textures = imageUrls.map((url) => textureLoader.load(url));

// High tier keeps the original 28x28 spheres; low tier uses coarser ones
// (the balls are small on screen and textured)
const sphereGeometries = {
  high: new THREE.SphereGeometry(1, 28, 28),
  low: new THREE.SphereGeometry(1, 12, 12),
};

const spheres = [...Array(30)].map(() => ({
  scale: [0.7, 1, 0.8, 1, 1][Math.floor(Math.random() * 5)],
  materialIndex: Math.floor(Math.random() * imageUrls.length),
}));

type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  r?: typeof THREE.MathUtils.randFloatSpread;
  material: THREE.MeshStandardMaterial;
  geometry: THREE.SphereGeometry;
  isActive: boolean;
  shadows: boolean;
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  material,
  geometry,
  isActive,
  shadows,
}: SphereProps) {
  const api = useRef<RapierRigidBody | null>(null);

  const tempVec = useMemo(() => new THREE.Vector3(), []);
  useFrame((_state, delta) => {
    if (!isActive || !api.current) return;
    delta = Math.min(0.1, delta);
    const impulse = vec
      .copy(api.current.translation())
      .normalize()
      .multiply(
        tempVec.set(
          -50 * delta * scale,
          -150 * delta * scale,
          -50 * delta * scale,
        ),
      );

    api.current?.applyImpulse(impulse, true);
  });

  return (
    <RigidBody
      linearDamping={0.75}
      angularDamping={0.15}
      friction={0.2}
      position={[r(20), r(20) - 25, r(20) - 10]}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <mesh
        castShadow={shadows}
        receiveShadow={shadows}
        scale={scale}
        geometry={geometry}
        material={material}
        rotation={[0.3, 1, 1]}
      />
    </RigidBody>
  );
}

type PointerProps = {
  vec?: THREE.Vector3;
  isActive: boolean;
};

function Pointer({ vec = new THREE.Vector3(), isActive }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) return;
    const targetVec = vec.lerp(
      tempVec.set(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0,
      ),
      0.2,
    );
    ref.current?.setNextKinematicTranslation(targetVec);
  });

  return (
    <RigidBody
      position={[100, 100, 100]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[2]} />
    </RigidBody>
  );
}

// A priority > 0 useFrame takes over rendering from R3F; doing nothing in it
// keeps physics stepping while skipping the draw
function SkipRender() {
  useFrame(() => {}, 1);
  return null;
}

const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

const TechStack = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const tier = useGpuTier();

  // Frames only count toward the weak-GPU watchdog while the balls are drawn
  useEffect(() => {
    setSceneBusy("techstack", isActive && onScreen);
    return () => setSceneBusy("techstack", false);
  }, [isActive, onScreen]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      // Resume a viewport early so the balls have gathered before the section is visible
      { rootMargin: "100% 0px" },
    );
    // Drawing (and N8AO) only while actually on screen: in the early zone the
    // canvas is off-screen, and rendering it there made Career scroll drop frames
    const screenObserver = new IntersectionObserver(([entry]) => {
      setOnScreen(entry.isIntersecting);
    });
    observer.observe(el);
    screenObserver.observe(el);
    return () => {
      observer.disconnect();
      screenObserver.disconnect();
    };
  }, []);
  // High tier: the original glossy clearcoat look. Low tier: plain standard material
  const materials = useMemo(() => {
    const base = { emissive: "#ffffff", emissiveIntensity: 0.3, metalness: 0.5, roughness: 1 };
    return {
      high: textures.map(
        (texture) =>
          new THREE.MeshPhysicalMaterial({ ...base, map: texture, emissiveMap: texture, clearcoat: 0.1 }),
      ),
      low: textures.map(
        (texture) => new THREE.MeshStandardMaterial({ ...base, map: texture, emissiveMap: texture }),
      ),
    };
  }, []);
  const highTier = tier === "high";

  return (
    <div className="techstack" ref={containerRef}>
      <h2> My Techstack</h2>

      {/* Mounted eagerly so wasm/shader/HDR init happens behind the loader;
          "demand" renders once to compile, then idles while off-screen */}
      <Canvas
        shadows={highTier}
        frameloop={isActive ? "always" : "demand"}
        dpr={tier === "low" ? 1 : [1, coarsePointer ? 1.5 : 2]}
        gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
        camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
        onCreated={(state) => (state.gl.toneMappingExposure = 1.5)}
        className="tech-canvas"
        aria-hidden="true"
      >
        <ambientLight intensity={1} />
        <spotLight
          position={[20, 20, 25]}
          penumbra={1}
          angle={0.2}
          color="white"
          castShadow={highTier}
          shadow-mapSize={[512, 512]}
        />
        <directionalLight position={[0, 5, -4]} intensity={2} />
        <Physics gravity={[0, 0, 0]} paused={!isActive}>
          <Pointer isActive={isActive} />
          {spheres.map((props, i) => (
            <SphereGeo
              key={i}
              {...props}
              material={materials[tier][props.materialIndex]}
              geometry={sphereGeometries[tier]}
              isActive={isActive}
              shadows={highTier}
            />
          ))}
        </Physics>
        <SharedEnvironment />
        <Preload all />
        {isActive && !onScreen && <SkipRender />}
        {/* N8AO is several full-screen passes: the main GPU cost on weak GPUs */}
        {!isMobile && highTier && (
          <EffectComposer enableNormalPass={false} enabled={onScreen}>
            <N8AO color="#0f002c" aoRadius={2} intensity={1.15} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
};

// Same HDR texture as the character scene (suspends like <Environment files>,
// so <Preload> still compiles the balls with the env map)
function SharedEnvironment() {
  const map = suspend(loadEnvMap, ["char-env"]);
  if (!map) return null;
  return <Environment map={map} environmentIntensity={0.5} environmentRotation={[0, 4, 2]} />;
}

export default TechStack;
