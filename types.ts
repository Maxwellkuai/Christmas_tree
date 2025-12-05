import * as THREE from 'three';

export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface HandGestureState {
  gesture: 'OPEN' | 'CLOSED' | 'PINCH' | 'NONE';
  rotation: { x: number; y: number };
  pinchDistance: number;
}

export interface ParticleData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  color: THREE.Color;
  size: number;
  speed: number;
}

export interface OrnamentData extends ParticleData {
  type: 'ball' | 'gift' | 'photo';
  rotationOffset: THREE.Euler;
  textureUrl?: string;
}
