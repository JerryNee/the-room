import './style.css';
import * as THREE from 'three';

type WorldKey = 'white' | 'black';

type WorldConfig = {
  background: number;
  floor: number;
  frame: number;
  cube: number;
  cubePosition: THREE.Vector3;
};

const PORTAL = {
  center: new THREE.Vector3(0, 1.32, 0),
  innerWidth: 1.52,
  innerHeight: 2.34,
  frameWidth: 0.16,
  depth: 0.2,
};

const EYE_HEIGHT = 1.62;
const MOVE_SPEED = 2.7;
const MOUSE_SENSITIVITY = 0.0022;
const ROOM_LIMIT = 8.5;
const PORTAL_SWITCH_COOLDOWN_MS = 120;
const PORTAL_VOLUME_HALF_DEPTH = 0.42;
const PORTAL_VOLUME_PADDING = 0.1;
const PLAYER_RADIUS = 0.16;

const WORLD_OFFSETS: Record<WorldKey, THREE.Vector3> = {
  white: new THREE.Vector3(0, 0, 0),
  black: new THREE.Vector3(0, 0, -30),
};

const WORLD_CONFIG: Record<WorldKey, WorldConfig> = {
  white: {
    background: 0xf6f5ef,
    floor: 0xffffff,
    frame: 0x151515,
    cube: 0x050505,
    cubePosition: new THREE.Vector3(-1.55, 0.5, 2.2),
  },
  black: {
    background: 0x020203,
    floor: 0x050507,
    frame: 0xe8e5dc,
    cube: 0xf7f4ea,
    cubePosition: new THREE.Vector3(0, 0.5, -2.35),
  },
};

class PortalLab {
  private canvas: HTMLCanvasElement;
  private status: HTMLElement | null;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private portalCamera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private worlds: Record<WorldKey, THREE.Group>;
  private portalMask: THREE.Mesh;
  private activeWorld: WorldKey = 'white';
  private keys = new Set<string>();
  private yaw = 0;
  private pitch = 0;
  private pointerLocked = false;
  private portalSwitchLockedUntil = 0;
  private portalLockedUntilExit = false;
  private reusableForward = new THREE.Vector3();
  private reusableRight = new THREE.Vector3();
  private reusableMove = new THREE.Vector3();
  private reusablePortalDelta = new THREE.Vector3();

  constructor() {
    const canvas = document.getElementById('portal-lab');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Missing portal lab canvas');
    }

    this.canvas = canvas;
    this.status = document.querySelector('[data-portal-status]');
    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.025,
      70
    );
    this.camera.position.set(0, EYE_HEIGHT, 4.15);
    this.portalCamera = this.camera.clone();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      stencil: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.worlds = {
      white: this.createWorld('white'),
      black: this.createWorld('black'),
    };
    this.portalMask = this.createPortalMask();

    this.addLights();
    this.scene.add(this.worlds.white, this.worlds.black, this.portalMask);
    this.updateWorldVisibility();
    this.updateCameraRotation();
    this.updateStatus();
    window.portalLab = this;

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (event) => this.handleKeyDown(event));
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('mousemove', (event) => this.handleMouseMove(event));
    document.addEventListener('pointerlockchange', () => this.handlePointerLock());
    this.canvas.addEventListener('click', () => this.requestPointerLock());

    this.animate();
  }

  private addLights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x969696, 0.78));

    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(-3.6, 6, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 24;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    this.scene.add(key);
  }

  private createWorld(key: WorldKey) {
    const config = WORLD_CONFIG[key];
    const group = new THREE.Group();
    group.name = `${key}-world`;
    group.position.copy(WORLD_OFFSETS[key]);

    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(38, 14, 38),
      new THREE.MeshBasicMaterial({
        color: config.background,
        side: THREE.BackSide,
      })
    );
    shell.position.y = 6.8;
    group.add(shell);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 34),
      new THREE.MeshStandardMaterial({
        color: config.floor,
        roughness: key === 'white' ? 0.72 : 0.92,
        metalness: 0,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        color: config.cube,
        roughness: 0.48,
        metalness: 0.02,
      })
    );
    cube.position.copy(config.cubePosition);
    cube.castShadow = true;
    cube.receiveShadow = true;
    group.add(cube);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(cube.geometry),
      new THREE.LineBasicMaterial({
        color: key === 'white' ? 0xffffff : 0x000000,
        transparent: true,
        opacity: key === 'white' ? 0.38 : 0.45,
      })
    );
    edges.position.copy(cube.position);
    group.add(edges);

    this.addDoorFrame(group, config);
    return group;
  }

  private addDoorFrame(group: THREE.Group, config: WorldConfig) {
    const mat = new THREE.MeshStandardMaterial({
      color: config.frame,
      roughness: 0.62,
      metalness: 0.02,
    });
    const outerWidth = PORTAL.innerWidth + PORTAL.frameWidth * 2;
    const outerHeight = PORTAL.innerHeight + PORTAL.frameWidth;
    const centerY = PORTAL.innerHeight / 2;
    const frameGroup = new THREE.Group();
    frameGroup.name = 'portal-frame';

    frameGroup.add(
      this.box(
        [PORTAL.frameWidth, outerHeight, PORTAL.depth],
        [-outerWidth / 2 + PORTAL.frameWidth / 2, centerY, 0],
        mat
      ),
      this.box(
        [PORTAL.frameWidth, outerHeight, PORTAL.depth],
        [outerWidth / 2 - PORTAL.frameWidth / 2, centerY, 0],
        mat
      ),
      this.box(
        [outerWidth, PORTAL.frameWidth, PORTAL.depth],
        [0, PORTAL.innerHeight + PORTAL.frameWidth / 2, 0],
        mat
      ),
      this.box(
        [outerWidth, 0.06, PORTAL.depth],
        [0, 0.03, 0],
        mat
      )
    );
    group.add(frameGroup);
  }

  private createPortalMask() {
    const material = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilFail: THREE.KeepStencilOp,
      stencilZFail: THREE.KeepStencilOp,
      stencilZPass: THREE.ReplaceStencilOp,
    });
    const mask = new THREE.Mesh(
      new THREE.PlaneGeometry(PORTAL.innerWidth, PORTAL.innerHeight),
      material
    );
    mask.position.copy(this.getPortalCenter(this.activeWorld));
    mask.visible = false;
    return mask;
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
    this.keys.add(event.code);

    if (event.code === 'KeyR') {
      this.reset();
    }
  }

  private handleMouseMove(event: MouseEvent) {
    if (!this.pointerLocked) return;
    this.yaw -= event.movementX * MOUSE_SENSITIVITY;
    this.pitch -= event.movementY * MOUSE_SENSITIVITY;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.35, 1.35);
    this.updateCameraRotation();
  }

  private handlePointerLock() {
    this.pointerLocked = document.pointerLockElement === this.canvas;
    this.updateStatus();
  }

  private requestPointerLock() {
    this.canvas.requestPointerLock();
  }

  private reset() {
    this.activeWorld = 'white';
    this.camera.position.set(0, EYE_HEIGHT, 4.15);
    this.yaw = 0;
    this.pitch = 0;
    this.keys.clear();
    this.portalSwitchLockedUntil = 0;
    this.portalLockedUntilExit = false;
    this.updateCameraRotation();
    this.updateWorldVisibility();
    this.updateStatus();
  }

  private updateCameraRotation() {
    this.camera.quaternion.setFromEuler(
      new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')
    );
  }

  public debugSetPose(world: WorldKey, position: [number, number, number], yaw: number, pitch = 0) {
    this.activeWorld = world;
    const offset = WORLD_OFFSETS[world];
    this.camera.position.set(
      position[0] + offset.x,
      position[1] + offset.y,
      position[2] + offset.z
    );
    this.yaw = yaw;
    this.pitch = pitch;
    this.portalSwitchLockedUntil = 0;
    this.portalLockedUntilExit = false;
    this.updateCameraRotation();
    this.updateWorldVisibility();
    this.updateStatus();
  }

  private updateMovement(delta: number) {
    const previous = this.camera.position.clone();
    this.reusableMove.set(0, 0, 0);

    this.reusableForward.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.reusableForward.y = 0;
    this.reusableForward.normalize();

    this.reusableRight.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    this.reusableRight.y = 0;
    this.reusableRight.normalize();

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      this.reusableMove.add(this.reusableForward);
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      this.reusableMove.sub(this.reusableForward);
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      this.reusableMove.add(this.reusableRight);
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      this.reusableMove.sub(this.reusableRight);
    }

    if (this.reusableMove.lengthSq() === 0) return;

    this.reusableMove.normalize().multiplyScalar(MOVE_SPEED * delta);
    this.camera.position.add(this.reusableMove);
    this.camera.position.y = EYE_HEIGHT;
    this.clampCameraToActiveWorld();
    if (this.isInsideSolidDoorFrame()) {
      this.camera.position.copy(previous);
      return;
    }
    this.resolvePortalCrossing(previous);
  }

  private clampCameraToActiveWorld() {
    const offset = WORLD_OFFSETS[this.activeWorld];
    this.camera.position.x = THREE.MathUtils.clamp(
      this.camera.position.x,
      offset.x - ROOM_LIMIT,
      offset.x + ROOM_LIMIT
    );
    this.camera.position.z = THREE.MathUtils.clamp(
      this.camera.position.z,
      offset.z - ROOM_LIMIT,
      offset.z + ROOM_LIMIT
    );
  }

  private resolvePortalCrossing(previous: THREE.Vector3) {
    if (!this.isInsidePortalVolume()) {
      this.portalLockedUntilExit = false;
    }

    const now = performance.now();
    if (now < this.portalSwitchLockedUntil) return;

    const current = this.camera.position;
    const portalZ = WORLD_OFFSETS[this.activeWorld].z;
    const previousLocalZ = previous.z - portalZ;
    const currentLocalZ = current.z - portalZ;
    const crossedPortalPlane = this.activeWorld === 'white'
      ? previousLocalZ > 0 && currentLocalZ <= 0
      : previousLocalZ < 0 && currentLocalZ >= 0;

    if (!crossedPortalPlane) return;

    const withinDoor =
      Math.abs(current.x) <= PORTAL.innerWidth / 2 &&
      current.y >= 0.08 &&
      current.y <= PORTAL.innerHeight;

    if (!withinDoor) {
      current.copy(previous);
      return;
    }

    const remoteWorld = this.getRemoteWorld();
    current.add(
      this.reusablePortalDelta
        .copy(WORLD_OFFSETS[remoteWorld])
        .sub(WORLD_OFFSETS[this.activeWorld])
    );
    this.activeWorld = remoteWorld;
    this.portalSwitchLockedUntil = now + PORTAL_SWITCH_COOLDOWN_MS;
    this.portalLockedUntilExit = true;
    this.updateWorldVisibility();
    this.updateStatus();
  }

  private isInsidePortalVolume() {
    const local = this.getLocalCameraPosition();
    return (
      Math.abs(local.x) <= PORTAL.innerWidth / 2 + PORTAL_VOLUME_PADDING &&
      local.y >= 0.06 &&
      local.y <= PORTAL.innerHeight &&
      Math.abs(local.z) <= PORTAL_VOLUME_HALF_DEPTH
    );
  }

  private isInsideSolidDoorFrame() {
    const local = this.getLocalCameraPosition();
    const outerHalfWidth = PORTAL.innerWidth / 2 + PORTAL.frameWidth;
    const inFrameDepth = Math.abs(local.z) <= PORTAL.depth / 2 + PLAYER_RADIUS;
    const inSideJamb =
      Math.abs(local.x) >= PORTAL.innerWidth / 2 - PLAYER_RADIUS &&
      Math.abs(local.x) <= outerHalfWidth + PLAYER_RADIUS;
    const inTopJamb =
      Math.abs(local.x) <= outerHalfWidth + PLAYER_RADIUS &&
      local.y >= PORTAL.innerHeight - PLAYER_RADIUS &&
      local.y <= PORTAL.innerHeight + PORTAL.frameWidth + PLAYER_RADIUS;

    return inFrameDepth && (inSideJamb || inTopJamb);
  }

  private shouldRenderRemoteFullscreenInPortalVolume() {
    if (this.portalLockedUntilExit || !this.isInsidePortalVolume()) return false;

    const localZ = this.getLocalCameraPosition().z;
    return this.activeWorld === 'white' ? localZ >= 0 : localZ <= 0;
  }

  private getLocalCameraPosition() {
    return this.camera.position.clone().sub(WORLD_OFFSETS[this.activeWorld]);
  }

  private updateWorldVisibility() {
    const remoteWorld = this.getRemoteWorld();
    this.worlds[this.activeWorld].visible = true;
    this.worlds[remoteWorld].visible = false;
  }

  private getRemoteWorld(): WorldKey {
    return this.activeWorld === 'white' ? 'black' : 'white';
  }

  private updatePortalCamera() {
    this.camera.updateMatrixWorld(true);
    this.portalCamera.position.copy(this.camera.position).add(
      this.reusablePortalDelta
        .copy(WORLD_OFFSETS[this.getRemoteWorld()])
        .sub(WORLD_OFFSETS[this.activeWorld])
    );
    this.portalCamera.quaternion.copy(this.camera.quaternion);
    this.portalCamera.projectionMatrix.copy(this.camera.projectionMatrix);
    this.portalCamera.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse);
    this.portalCamera.updateMatrixWorld(true);
  }

  private render() {
    const activeWorld = this.worlds[this.activeWorld];
    const remoteWorld = this.worlds[this.getRemoteWorld()];
    const previousMaskVisibility = this.portalMask.visible;
    const previousActiveVisibility = activeWorld.visible;
    const previousRemoteVisibility = remoteWorld.visible;

    if (this.shouldRenderRemoteFullscreenInPortalVolume()) {
      this.renderRemoteWorldFullscreen(
        activeWorld,
        remoteWorld,
        previousMaskVisibility,
        previousActiveVisibility,
        previousRemoteVisibility
      );
      return;
    }

    if (this.portalLockedUntilExit && this.isInsidePortalVolume()) {
      this.renderActiveWorldOnly(
        activeWorld,
        remoteWorld,
        previousMaskVisibility,
        previousActiveVisibility,
        previousRemoteVisibility
      );
      return;
    }

    this.renderer.clear(true, true, true);

    activeWorld.visible = true;
    remoteWorld.visible = false;
    this.portalMask.visible = false;
    this.renderer.render(this.scene, this.camera);

    this.positionPortalMask();
    activeWorld.visible = false;
    this.portalMask.visible = true;
    this.renderer.render(this.scene, this.camera);
    activeWorld.visible = true;

    this.renderer.clearDepth();
    this.updatePortalCamera();
    activeWorld.visible = false;
    remoteWorld.visible = true;
    this.portalMask.visible = false;
    this.setPortalFrameVisibility(remoteWorld, false);
    this.setStencil(remoteWorld, true);
    this.renderer.render(this.scene, this.portalCamera);
    this.setStencil(remoteWorld, false);
    this.setPortalFrameVisibility(remoteWorld, true);

    activeWorld.visible = previousActiveVisibility;
    remoteWorld.visible = previousRemoteVisibility;
    this.portalMask.visible = previousMaskVisibility;
  }

  private renderRemoteWorldFullscreen(
    activeWorld: THREE.Group,
    remoteWorld: THREE.Group,
    previousMaskVisibility: boolean,
    previousActiveVisibility: boolean,
    previousRemoteVisibility: boolean
  ) {
    this.renderer.clear(true, true, true);
    this.updatePortalCamera();
    activeWorld.visible = false;
    remoteWorld.visible = true;
    this.portalMask.visible = false;
    this.setPortalFrameVisibility(remoteWorld, false);
    this.renderer.render(this.scene, this.portalCamera);
    this.setPortalFrameVisibility(remoteWorld, true);
    activeWorld.visible = previousActiveVisibility;
    remoteWorld.visible = previousRemoteVisibility;
    this.portalMask.visible = previousMaskVisibility;
  }

  private renderActiveWorldOnly(
    activeWorld: THREE.Group,
    remoteWorld: THREE.Group,
    previousMaskVisibility: boolean,
    previousActiveVisibility: boolean,
    previousRemoteVisibility: boolean
  ) {
    this.renderer.clear(true, true, true);
    activeWorld.visible = true;
    remoteWorld.visible = false;
    this.portalMask.visible = false;
    this.renderer.render(this.scene, this.camera);
    activeWorld.visible = previousActiveVisibility;
    remoteWorld.visible = previousRemoteVisibility;
    this.portalMask.visible = previousMaskVisibility;
  }

  private getPortalCenter(world: WorldKey) {
    return PORTAL.center.clone().add(WORLD_OFFSETS[world]);
  }

  private positionPortalMask() {
    this.portalMask.position.copy(this.getPortalCenter(this.activeWorld));
  }

  private setPortalFrameVisibility(group: THREE.Group, visible: boolean) {
    const frame = group.getObjectByName('portal-frame');
    if (frame) frame.visible = visible;
  }

  private setStencil(group: THREE.Group, enabled: boolean) {
    group.traverse((child) => {
      if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.LineSegments)) return;
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => {
        material.stencilWrite = enabled;
        material.stencilRef = 1;
        material.stencilFunc = enabled
          ? THREE.EqualStencilFunc
          : THREE.AlwaysStencilFunc;
        material.stencilFail = THREE.KeepStencilOp;
        material.stencilZFail = THREE.KeepStencilOp;
        material.stencilZPass = THREE.KeepStencilOp;
      });
    });
  }

  private animate = () => {
    window.requestAnimationFrame(this.animate);
    this.updateMovement(Math.min(this.clock.getDelta(), 0.05));
    this.render();
  };

  private resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private box(
    size: [number, number, number],
    position: [number, number, number],
    material: THREE.Material
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private updateStatus() {
    if (!this.status) return;
    const world = this.activeWorld === 'white'
      ? 'WHITE WORLD / black cube'
      : 'BLACK WORLD / white cube';
    const lock = this.pointerLocked ? 'mouse locked' : 'click to lock mouse';
    this.status.textContent = `${world} · WASD move · ${lock} · R reset`;
  }
}

declare global {
  interface Window {
    portalLab?: PortalLab;
  }
}

new PortalLab();
