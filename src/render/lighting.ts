import * as THREE from 'three';
import { CONFIG } from '../game/config';

export interface SceneLights {
  ambient: THREE.AmbientLight;
  directional: THREE.DirectionalLight;
}

export function setupLighting(scene: THREE.Scene): SceneLights {
  const ambient = new THREE.AmbientLight(
    CONFIG.ambientLightColor,
    CONFIG.ambientLightIntensity,
  );
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(
    CONFIG.directionalLightColor,
    CONFIG.directionalLightIntensity,
  );
  directional.position.set(
    CONFIG.directionalLightPosition[0],
    CONFIG.directionalLightPosition[1],
    CONFIG.directionalLightPosition[2],
  );
  scene.add(directional);

  return { ambient, directional };
}
