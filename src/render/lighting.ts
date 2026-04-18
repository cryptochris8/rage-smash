import * as THREE from 'three';
import { CONFIG } from '../game/config';
import { ROOMS } from '../content/rooms';

export interface SceneLights {
  ambient: THREE.AmbientLight;
  directional: THREE.DirectionalLight;
  /** Base (room-default) lighting values — streak heat lerps from these. */
  baseAmbientColor: THREE.Color;
  baseAmbientIntensity: number;
  baseDirectionalColor: THREE.Color;
  baseDirectionalIntensity: number;
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

  return {
    ambient,
    directional,
    baseAmbientColor: ambient.color.clone(),
    baseAmbientIntensity: ambient.intensity,
    baseDirectionalColor: directional.color.clone(),
    baseDirectionalIntensity: directional.intensity,
  };
}

/**
 * Apply the given room's lighting profile as the NEW base state.
 * Streak heat should be re-applied afterwards so it composes with this base.
 */
export function applyRoomLighting(lights: SceneLights, roomId: string): void {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return;

  const ambientColor = room.ambientColor ?? CONFIG.ambientLightColor;
  const ambientIntensity = room.ambientIntensity ?? CONFIG.ambientLightIntensity;
  const directionalColor = room.directionalColor ?? CONFIG.directionalLightColor;
  const directionalIntensity = room.directionalIntensity ?? CONFIG.directionalLightIntensity;
  const pos = room.directionalPosition ?? CONFIG.directionalLightPosition;

  lights.ambient.color.setHex(ambientColor);
  lights.ambient.intensity = ambientIntensity;
  lights.directional.color.setHex(directionalColor);
  lights.directional.intensity = directionalIntensity;
  lights.directional.position.set(pos[0], pos[1], pos[2]);

  lights.baseAmbientColor.copy(lights.ambient.color);
  lights.baseAmbientIntensity = ambientIntensity;
  lights.baseDirectionalColor.copy(lights.directional.color);
  lights.baseDirectionalIntensity = directionalIntensity;
}
