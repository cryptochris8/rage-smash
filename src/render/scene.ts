import * as THREE from 'three';
import { CONFIG } from '../game/config';
import { ROOMS } from '../content/rooms';
import { createRageRoom } from './room';

export function createScene(roomId: string = 'default'): THREE.Scene {
  const scene = new THREE.Scene();

  // Fallback color while skybox loads
  scene.background = new THREE.Color(CONFIG.bgColor);

  // Load skybox for the selected room
  loadRoomSkybox(scene, roomId);

  // Floor-level rage room details
  createRageRoom(scene);

  return scene;
}

export function switchRoom(scene: THREE.Scene, roomId: string): void {
  loadRoomSkybox(scene, roomId);
}

function loadRoomSkybox(scene: THREE.Scene, roomId: string): void {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return;

  const loader = new THREE.TextureLoader();
  loader.load(
    room.skybox,
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;
    },
    undefined,
    () => {
      // Skybox file missing — fallback to solid color
      scene.background = new THREE.Color(CONFIG.bgColor);
    },
  );
}
