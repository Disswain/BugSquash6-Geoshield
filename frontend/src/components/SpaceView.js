// src/components/SpaceView.js
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Globe from "./Globe";

// ================== Satellite Model ==================
function SatelliteModel({ radius, speed, modelUrl, scale = 0.02 }) {
  const ref = useRef();
  const { scene } = useGLTF(modelUrl);

  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + angle.current;
    const x = radius * Math.cos(t);
    const z = radius * Math.sin(t);
    if (ref.current) {
      ref.current.position.set(x, 0, z);
      ref.current.rotation.y += 0.002; // very slow spin
    }
  });

  return <primitive object={scene.clone()} ref={ref} scale={scale} />;
}

// ================== Orbit ==================
function Orbit({ radius, color }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 360; i++) {
      const rad = (i * Math.PI) / 180;
      pts.push(
        new THREE.Vector3(radius * Math.cos(rad), 0, radius * Math.sin(rad))
      );
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  return (
    <line>
      <primitive object={points} attach="geometry" />
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
}

// ================== Asteroids ==================
function Asteroids({ count = 20, radius = 15 }) {
  const groupRef = useRef();
  const asteroids = useMemo(() => {
    return new Array(count).fill().map(() => ({
      x: (Math.random() - 0.5) * radius,
      y: (Math.random() - 0.5) * radius,
      z: (Math.random() - 0.5) * radius,
      rot: new THREE.Vector3(
        Math.random() * 0.01,
        Math.random() * 0.01,
        Math.random() * 0.01
      ),
    }));
  }, [count, radius]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((mesh, i) => {
      mesh.rotation.x += asteroids[i].rot.x;
      mesh.rotation.y += asteroids[i].rot.y;
      mesh.rotation.z += asteroids[i].rot.z;
    });
  });

  return (
    <group ref={groupRef}>
      {asteroids.map((a, i) => (
        <mesh key={i} position={[a.x, a.y, a.z]}>
          <icosahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color="gray" roughness={1} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ================== Main SpaceView ==================
export default function SpaceView() {
  return (
    <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />

      {/* ✅ Earth (aligned) */}
      <group rotation={[0, Math.PI, 0]}>
        <Globe />
      </group>

      {/* ✅ Orbits */}
      <Orbit radius={3.5} color="cyan" />
      <Orbit radius={4.2} color="lime" />
      <Orbit radius={5.0} color="orange" />

      {/* ✅ Satellites (smaller + synced speed) */}
      <SatelliteModel radius={3.5} speed={0.0012} modelUrl="/models/satellite1.glb" scale={0.025} />
      <SatelliteModel radius={4.2} speed={0.001} modelUrl="/models/satellite2.glb" scale={0.03} />
      <SatelliteModel radius={5.0} speed={0.0008} modelUrl="/models/satellite3.glb" scale={0.035} />

      {/* ✅ Asteroids */}
      <Asteroids count={25} radius={20} />

      {/* ✅ Stars */}
      <Stars radius={100} depth={50} count={10000} factor={4} saturation={0} fade />

      {/* ✅ Controls */}
      <OrbitControls enableZoom enablePan={false} />
    </Canvas>
  );
}
