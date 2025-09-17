// src/components/Globe.js
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function Globe() {
  const earthRef = useRef();
  const cloudsRef = useRef();

  // ✅ Use only day texture + normal + clouds
  const [dayMap, normalMap, cloudsMap] = useTexture([
    "/textures/earth-texture.jpg", // day texture
    "/textures/earth-normal.jpg",  // normal/bump map
    "/textures/earth-clouds.jpg",  // clouds
  ]);

  // Rotate Earth + Clouds
  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.0005;
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0006;
  });

  return (
    <group>
      {/* Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshPhongMaterial map={dayMap} normalMap={normalMap} shininess={15} />
      </mesh>

      {/* Clouds */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.55, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.7, 64, 64]} />
        <shaderMaterial
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(0.3, 0.6, 1.0, 0.4) * intensity;
            }
          `}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
        />
      </mesh>
    </group>
  );
}
