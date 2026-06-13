"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 120;
const CONNECTION_DISTANCE = 1.8;
const COLOR_A = new THREE.Color("#5266eb");
const COLOR_B = new THREE.Color("#02b8cc");

function Network() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  const [positions, velocities, connections] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const con: number[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 3;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      vel[i * 3] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }

    return [pos, vel, con];
  }, []);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6);
    geo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !linesRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const linePosAttr = lineGeometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const lineArray = linePosAttr.array as Float32Array;

    const time = clock.getElapsedTime();
    const mx = mouseRef.current.x * viewport.width * 0.25;
    const my = mouseRef.current.y * viewport.height * 0.25;

    let lineIndex = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // gentle orbit + noise
      const angle = time * 0.05 + i * 0.1;
      posArray[ix] += velocities[ix] + Math.cos(angle) * 0.002;
      posArray[iy] += velocities[iy] + Math.sin(angle) * 0.002;
      posArray[iz] += velocities[iz];

      // mouse attraction (subtle)
      const dx = mx - posArray[ix];
      const dy = my - posArray[iy];
      const distMouse = Math.sqrt(dx * dx + dy * dy) + 0.1;
      posArray[ix] += (dx / distMouse) * 0.003;
      posArray[iy] += (dy / distMouse) * 0.003;

      // keep within bounds
      const dist = Math.sqrt(posArray[ix] ** 2 + posArray[iy] ** 2 + posArray[iz] ** 2);
      if (dist > 5.5) {
        posArray[ix] *= 0.99;
        posArray[iy] *= 0.99;
        posArray[iz] *= 0.99;
      }

      // connections
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const jx = j * 3;
        const jy = j * 3 + 1;
        const jz = j * 3 + 2;

        const cx = posArray[jx] - posArray[ix];
        const cy = posArray[jy] - posArray[iy];
        const cz = posArray[jz] - posArray[iz];
        const d = Math.sqrt(cx * cx + cy * cy + cz * cz);

        if (d < CONNECTION_DISTANCE) {
          lineArray[lineIndex++] = posArray[ix];
          lineArray[lineIndex++] = posArray[iy];
          lineArray[lineIndex++] = posArray[iz];
          lineArray[lineIndex++] = posArray[jx];
          lineArray[lineIndex++] = posArray[jy];
          lineArray[lineIndex++] = posArray[jz];
        }
      }
    }

    posAttr.needsUpdate = true;
    lineGeometry.setDrawRange(0, lineIndex / 3);
    linePosAttr.needsUpdate = true;

    pointsRef.current.rotation.y = time * 0.02;
    linesRef.current.rotation.y = time * 0.02;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#02b8cc"
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#5266eb" transparent opacity={0.25} />
      </lineSegments>
    </>
  );
}

export function NeuralNetwork() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-bg-deep via-bg to-bg-deep" />
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <Network />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/80 via-transparent to-bg-deep pointer-events-none" />
    </div>
  );
}
