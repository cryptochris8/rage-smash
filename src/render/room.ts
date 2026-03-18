import * as THREE from 'three';

/**
 * Rage room floor details — danger stripes and smash zone ring.
 * No floor plane so the skybox shows through fully.
 */
export function createRageRoom(scene: THREE.Scene): void {
  // --- Danger stripes radiating from pedestal ---
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xddaa00,
    roughness: 0.7,
    metalness: 0.1,
  });

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.005, 0.6),
      stripeMat,
    );
    stripe.position.set(
      Math.cos(angle) * 1.2,
      0.003,
      Math.sin(angle) * 1.2,
    );
    stripe.rotation.y = angle;
    scene.add(stripe);
  }

  // --- "SMASH ZONE" warning ring ---
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xcc3333,
    roughness: 0.6,
    metalness: 0.1,
  });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.03, 8, 48),
    ringMat,
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.005;
  scene.add(ring);
}
