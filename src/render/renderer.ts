import * as THREE from 'three';

export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  return renderer;
}
