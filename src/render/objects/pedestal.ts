import * as THREE from 'three';
import { CONFIG } from '../../game/config';

export function createPedestal(scene: THREE.Scene): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 32);
  const material = new THREE.MeshStandardMaterial({ color: CONFIG.pedestalColor });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(
    CONFIG.pedestalPosition[0],
    CONFIG.pedestalPosition[1] + 0.15,
    CONFIG.pedestalPosition[2],
  );

  scene.add(mesh);
  return mesh;
}
