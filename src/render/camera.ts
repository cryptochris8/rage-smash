import * as THREE from 'three';
import { CONFIG } from '../game/config';

export function createCamera(container: HTMLElement): THREE.PerspectiveCamera {
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, aspect, 0.1, 100);

  camera.position.set(
    CONFIG.cameraPosition[0],
    CONFIG.cameraPosition[1],
    CONFIG.cameraPosition[2],
  );
  camera.lookAt(
    CONFIG.cameraLookAt[0],
    CONFIG.cameraLookAt[1],
    CONFIG.cameraLookAt[2],
  );

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });

  return camera;
}
