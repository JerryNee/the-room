import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
    CSS3DObject,
    CSS3DRenderer,
} from 'three/examples/jsm/renderers/CSS3DRenderer.js';

type SceneState =
    | 'entry-door'
    | 'door-opening'
    | 'room-idle'
    | 'focus-computer'
    | 'focus-gallery'
    | 'focus-game-log'
    | 'focus-journey'
    | 'returning-room';

type HotspotKey = 'door' | 'computer' | 'gallery' | 'game-log' | 'journey';
type PlacementKey =
    | 'mouse'
    | 'keyboard'
    | 'mac-studio'
    | 'mac-logo'
    | 'computer'
    | 'homepod'
    | 'plant'
    | 'riser'
    | 'floor-lamp';

type HotspotConfig = {
    key: HotspotKey;
    label: string;
    focusState?: SceneState;
    camera?: THREE.Vector3;
    target?: THREE.Vector3;
    title?: string;
    body?: string;
};

type CameraPose = {
    position: THREE.Vector3;
    target: THREE.Vector3;
};

const ROOM_DEPTH_OFFSET = -0.85;
const roomPoint = (x: number, y: number, z: number) =>
    new THREE.Vector3(x, y, z + ROOM_DEPTH_OFFSET);
const DESK_SCENE_Z_OFFSET = -0.52;
const deskZ = (z: number) => z + DESK_SCENE_Z_OFFSET;
const DESK_SURFACE_Y = 0.91;

const CAMERA_POSES: Record<string, CameraPose> = {
    loading: {
        position: new THREE.Vector3(-18, 13.8, 21),
        target: new THREE.Vector3(0, 0.25, 0),
    },
    entry: {
        position: new THREE.Vector3(0, 1.62, 4.25),
        target: new THREE.Vector3(0, 1.45, 0),
    },
    threshold: {
        position: new THREE.Vector3(0, 1.62, -0.18),
        target: new THREE.Vector3(0, 1.22, -2.6),
    },
    room: {
        position: roomPoint(0, 1.92, -0.72),
        target: roomPoint(0, 0.92, deskZ(-3.35)),
    },
};

const FREE_ORBIT_OVERVIEW_POSE: CameraPose = {
    position: roomPoint(0.22, 2.5, 0.38),
    target: roomPoint(0.02, 0.88, deskZ(-3.58)),
};
// Aim below the monitor center so the desk group sits vertically centered
// in the free-orbit overview instead of hugging the bottom of the frame.
const FREE_ORBIT_TARGET_Y_OFFSET = -0.4;

const HOTSPOTS: Record<Exclude<HotspotKey, 'door'>, HotspotConfig> = {
    computer: {
        key: 'computer',
        label: 'Computer',
        focusState: 'focus-computer',
        camera: roomPoint(0, 1.36, deskZ(-2.28)),
        target: roomPoint(0, 1.18, deskZ(-3.56)),
        title: 'Computer',
        body: 'Projects, research, resume, and contact will live here.',
    },
    gallery: {
        key: 'gallery',
        label: 'Gallery',
        focusState: 'focus-gallery',
        camera: roomPoint(-0.92, 1.32, deskZ(-2.34)),
        target: roomPoint(-0.74, 0.84, deskZ(-3.08)),
        title: 'Gallery',
        body: 'The photo stack will become a focused, physical browsing surface.',
    },
    'game-log': {
        key: 'game-log',
        label: 'Game Log',
        focusState: 'focus-game-log',
        camera: roomPoint(0.88, 1.22, deskZ(-2.28)),
        target: roomPoint(0.82, 0.85, deskZ(-3.18)),
        title: 'Game Log',
        body: 'A personal archive of games played, notes, status, and favorite moments.',
    },
    journey: {
        key: 'journey',
        label: 'Journey Map',
        focusState: 'focus-journey',
        camera: roomPoint(0.56, 1.34, deskZ(-2.18)),
        target: roomPoint(0.34, 0.84, deskZ(-3.02)),
        title: 'Journey Map',
        body: 'A desk map will unfold into a route with a small airplane animation.',
    },
};

const REDUCED_MOTION = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
).matches;

const DOOR_MODEL_URL = '/models/JianweiDoor/jianwei_door.glb';
const DOOR_SHADOW_TEXTURE_URL = '/models/JianweiDoor/jianwei_door_shadow.png';
// v=2: braces slimmed ~1mm to stop z-fighting with the frame planks
const OFFICE_DESK_MODEL_URL = '/models/OfficeDesk/office_desk.glb?v=5';
const MODERN_CHAIR_MODEL_URL = '/models/AppleDesk/ModernChair/modern_chair.glb';
const STUDIO_DISPLAY_MODEL_URL = '/models/AppleDesk/StudioDisplay/studio_display.glb';
const MONITOR_RAISER_MODEL_URL = '/models/AppleDesk/MonitorRaiser/monitor_raiser.glb';
const MAC_STUDIO_MODEL_URL = '/models/AppleDesk/MacStudio/mac_studio.glb';
const MAC_STUDIO_LOGO_TEXTURE_URL =
    '/models/AppleDesk/MacStudio/mac_studio_logo_clean.png';
const KEYBOARD_MODEL_URL = '/models/AppleDesk/Keyboard/keyboard.glb';
const MOUSE_MODEL_URL = '/models/AppleDesk/Mouse/mouse.glb';
const HOMEPOD_MINI_MODEL_URL = '/models/AppleDesk/HomePodMini/homepod_mini.glb';
const POTTED_PLANT_MODEL_URL = '/models/AppleDesk/PottedPlant/mini_plant.glb';
const FLOOR_LAMP_MODEL_URL = '/models/AppleDesk/FloorLamp/rita_floor_lamp.glb';
const BAKED_ENVIRONMENT_MODEL_URL =
    '/models/BakedRoom/jianwei_baked_environment.glb';
// Bump when the baked shadow textures are regenerated, so browsers
// don't keep serving the previous bake from disk cache.
const BAKED_SURFACE_TEXTURE_VERSION = 6;
const BAKED_ROOM_FLOOR_SURFACE_TEXTURE_URL = `/textures/baked/real_room_floor_baked_surface.png?v=${BAKED_SURFACE_TEXTURE_VERSION}`;
const BAKED_DESK_SURFACE_TEXTURE_URL = `/textures/baked/real_desk_baked_surface.png?v=${BAKED_SURFACE_TEXTURE_VERSION}`;
const HUD_VOLUME_ON_ICON_URL = '/textures/UI/volume_on.svg';
const HUD_VOLUME_OFF_ICON_URL = '/textures/UI/volume_off.svg';
const HUD_CAMERA_ICON_URL = '/textures/UI/camera.svg';
const HUD_MOUSE_ICON_URL = '/textures/UI/mouse.svg';
const ROOM_AMBIENCE_AUDIO_URL = '/audio/room/jerry-room-house-tone.mp3';
const ROOM_STARTUP_AUDIO_URL = '/audio/startup/jerry-room-entry.mp3';
const DOOR_OPEN_AUDIO_URL = '/audio/room/door-open-b-hard-cut-105.mp3';
const THRESHOLD_WHOOSH_AUDIO_URL = '/audio/room/threshold-whoosh.mp3';
const MONITOR_MOUSE_DOWN_AUDIO_URL = '/audio/mouse/mouse_down.mp3';
const MONITOR_MOUSE_UP_AUDIO_URL = '/audio/mouse/mouse_up.mp3';
const MONITOR_KEYBOARD_AUDIO_URLS = [
    '/audio/keyboard/key_1.mp3',
    '/audio/keyboard/key_2.mp3',
    '/audio/keyboard/key_3.mp3',
    '/audio/keyboard/key_4.mp3',
    '/audio/keyboard/key_5.mp3',
    '/audio/keyboard/key_6.mp3',
];
const ROOM_AMBIENCE_VOLUME = 0.4;
const ROOM_STARTUP_VOLUME = 0.34;
const DOOR_OPEN_VOLUME = 0.75;
const THRESHOLD_WHOOSH_VOLUME = 0;
const MONITOR_MOUSE_DOWN_VOLUME = 0.3;
const MONITOR_MOUSE_UP_VOLUME = 0.22;
const MONITOR_KEYBOARD_VOLUME = 0.26;
const HUD_TYPE_VOLUME = 0.028;
const MONITOR_RAISER_HEIGHT = 0.15;
const DOOR_REVEAL_ORIGIN_Y = 1.08;
const DOOR_REVEAL_START_SCALE = 0.006;
const DOOR_REVEAL_DURATION = 2350;
const PORTAL_PLANE_WIDTH = 0.82;
const PORTAL_PLANE_HEIGHT = 2.04;
const PORTAL_VOLUME_HALF_DEPTH = 1.18;
const PORTAL_VOLUME_PADDING = 0.08;
const PORTAL_RENDER_WIDTH = 640;
const PORTAL_RENDER_HEIGHT = Math.round(
    PORTAL_RENDER_WIDTH / (PORTAL_PLANE_WIDTH / PORTAL_PLANE_HEIGHT)
);
const PORTAL_ASPECT = PORTAL_PLANE_WIDTH / PORTAL_PLANE_HEIGHT;
const PORTAL_SOURCE_POSITION = new THREE.Vector3(0, 1.08, -0.082);
// The logical portal camera stays centred at 1.08, but the binary stencil must
// reach the floor. The old 2.04m mask stopped at y=0.06 and exposed a visible
// strip of the cool CSS backdrop between the warm room and the light pool.
const PORTAL_STENCIL_TOP_Y =
    PORTAL_SOURCE_POSITION.y + PORTAL_PLANE_HEIGHT / 2;
const PORTAL_STENCIL_BOTTOM_Y = 0;
const PORTAL_STENCIL_HEIGHT = PORTAL_STENCIL_TOP_Y - PORTAL_STENCIL_BOTTOM_Y;
const PORTAL_STENCIL_CENTER_Y =
    (PORTAL_STENCIL_TOP_Y + PORTAL_STENCIL_BOTTOM_Y) / 2;
// Horizontal pool of light the open doorway throws onto the entry-side
// ground: doorway-wide at the threshold, fanning wider with distance with a
// growing penumbra, so the floor reads as a gradient instead of the hard
// cool-to-warm line where the stencil cuts the room floor.
const DOOR_FLOOR_POOL_WIDTH = 5.2;
const DOOR_FLOOR_POOL_DEPTH = 3.2;
const DOOR_FLOOR_POOL_COLOR: [number, number, number] = [241, 241, 238];
const DOOR_FLOOR_POOL_MAX_ALPHA = 1;
const DOOR_FLOOR_POOL_SPREAD = 0.4;
// Extend a few centimetres through the binary portal cut so MSAA/stencil edge
// samples always land on the same warm colour as the room. The overlap fades
// in before the threshold, stays solid just outside it, then becomes a pool.
const DOOR_FLOOR_POOL_THRESHOLD_OVERLAP = 0.06;
const DOOR_FLOOR_POOL_THRESHOLD_PLATEAU = 0.1;
const DOOR_OPENING_HALF_WIDTH = 0.44;
const DOOR_BAKED_SHADOW_OPACITY = 0.45;
const DOOR_BAKED_SHADOW_OPEN_OPACITY = 0.22;
const DOOR_BAKED_SHADOW_FADE_DURATION = 1050;
const PORTAL_CROSSING_POSITION = new THREE.Vector3(0, 1.62, 0.08);
const PORTAL_DESTINATION_POSITION = new THREE.Vector3(0, 1.9, 3.2);
const PORTAL_DESTINATION_TARGET = CAMERA_POSES.room.target.clone();
const PORTAL_CROSSING_TARGET = PORTAL_CROSSING_POSITION.clone().add(
    PORTAL_DESTINATION_TARGET.clone().sub(PORTAL_DESTINATION_POSITION)
);
const THRESHOLD_SCREEN_FADE_PROGRESS = 0.78;
const THRESHOLD_SWITCH_PROGRESS = 0.9;
const HENRY_ENTRY_EASING = TWEEN.Easing.Quartic.Out;
const smootherStep = (amount: number) =>
    amount * amount * amount * (amount * (amount * 6 - 15) + 10);
const ENTRY_INTRO_DELAY = 80;
const ENTRY_INTRO_DURATION = 3400;
const ENTRY_INTRO_SNAP_PROGRESS = 0.985;
const ROOM_ORBIT_SPEED = 0.00012;
const ROOM_ORBIT_YAW_AMPLITUDE = 0.24;
const ROOM_ORBIT_POSITION_LERP = 0.008;
const ROOM_ORBIT_TARGET_LERP = 0.03;
const ENTRY_PARALLAX_POSITION_LERP = 0.045;
const ENTRY_PARALLAX_TARGET_LERP = 0.06;
const ENTRY_PARALLAX_X = 0.16;
const ENTRY_PARALLAX_Y = 0.07;
const ENTRY_PARALLAX_TARGET_X = 0.08;
const ENTRY_PARALLAX_TARGET_Y = 0.04;
const MONITOR_CSS_SIZE = new THREE.Vector2(1280, 720);
const FALLBACK_MONITOR_WORLD_SIZE = new THREE.Vector2(0.92, 0.518);
const FALLBACK_MONITOR_POSITION = new THREE.Vector3(0, 1.255, -3.545);
const MONITOR_NORMAL = new THREE.Vector3(0, 0, 1);
const MONITOR_SIDE_HIDE_FACING = 0.015;
const MONITOR_SIDE_FULL_FACING = 0.15;
const MONITOR_SIDE_BLACK_OPACITY = 0.94;
const STUDIO_DISPLAY_SCREEN_MESH = 'NYVmzMLiovxElXF';
const STUDIO_DISPLAY_SCREEN_SCALE = new THREE.Vector2(1.006, 1.006);
const STUDIO_DISPLAY_SCREEN_VERTICAL_OFFSET = 0;
const STUDIO_DISPLAY_SCREEN_SURFACE_OFFSET = 0.0012;
const USE_BAKED_ENVIRONMENT_MODEL = false;

export default class SpatialPortfolio {
    private container: HTMLElement;
    private cssRoot: HTMLElement;
    private uiContainer: HTMLElement;
    private renderer: THREE.WebGLRenderer;
    private cssRenderer: CSS3DRenderer;
    private orbitControls: OrbitControls;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private raycaster: THREE.Raycaster;
    private pointer: THREE.Vector2;
    private cameraTarget: THREE.Vector3;
    private state: SceneState;
    private doorPivot: THREE.Group;
    private entryDoorRoot: THREE.Group;
    private entrySeed: THREE.Sprite | null;
    private portalStencil: THREE.Mesh;
    private portalSurface: THREE.Mesh;
    private portalCamera: THREE.PerspectiveCamera;
    private portalCameraTarget: THREE.Vector3;
    private portalRenderTarget: THREE.WebGLRenderTarget;
    private portalSourceMatrix: THREE.Matrix4;
    private portalDestinationMatrix: THREE.Matrix4;
    private portalTransformMatrix: THREE.Matrix4;
    private roomWarmVoid: THREE.Mesh | null;
    private portalPreviewGroup: THREE.Group;
    private roomGroup: THREE.Group;
    private riserSetGroup: THREE.Group;
    private doorReady: boolean;
    private doorObjects: THREE.Object3D[];
    private hotspotObjects: THREE.Object3D[];
    private hotspotGroups: Map<HotspotKey, THREE.Group>;
    private hoveredKey: HotspotKey | null;
    private hoverPausedUntil: number;
    private focusedKey: HotspotKey | null;
    private labelEl: HTMLDivElement;
    private hintEl: HTMLDivElement;
    private thresholdFlareEl: HTMLDivElement;
    private panelEl: HTMLDivElement;
    private backButtonEl: HTMLButtonElement;
    private roomHudEl: HTMLDivElement;
    private hudNameRowEl: HTMLDivElement;
    private hudTitleRowEl: HTMLDivElement;
    private hudTimeRowEl: HTMLDivElement;
    private hudNameEl: HTMLSpanElement;
    private hudTitleEl: HTMLSpanElement;
    private hudTimeEl: HTMLSpanElement;
    private muteButtonEl: HTMLButtonElement;
    private muteIconEl: HTMLImageElement;
    private freeOrbitButtonEl: HTMLButtonElement;
    private freeOrbitIconEl: HTMLImageElement;
    private animationFrame: number | null;
    private roomOrbitStartedAt: number;
    private roomOrbitPosition: THREE.Vector3;
    private roomOrbitTarget: THREE.Vector3;
    private entryParallaxPosition: THREE.Vector3;
    private entryParallaxTarget: THREE.Vector3;
    private thresholdFlareTimer: number | null;
    private portalFullscreenActive: boolean;
    private portalReleased: boolean;
    private entryDoorFadeTween: { stop: () => void } | null;
    private doorFloorPoolMesh: THREE.Mesh | null;
    private doorFloorPoolMaterial: THREE.MeshBasicMaterial | null;
    private doorBakedShadowMesh: THREE.Mesh | null;
    private doorBakedShadowMaterial: THREE.MeshBasicMaterial | null;
    private monitorCssObject: CSS3DObject | null;
    private monitorElement: HTMLDivElement | null;
    private monitorIframe: HTMLIFrameElement | null;
    private monitorInputProxyEl: HTMLDivElement;
    private monitorGlassMaterial: THREE.MeshBasicMaterial | null;
    private monitorDimmingMaterial: THREE.MeshBasicMaterial | null;
    private monitorWorldPosition: THREE.Vector3;
    private monitorWorldQuaternion: THREE.Quaternion;
    private monitorPlanePosition: THREE.Vector3;
    private monitorPlaneQuaternion: THREE.Quaternion;
    private monitorPlaneNormal: THREE.Vector3;
    private monitorPlaneSize: THREE.Vector2;
    private placementMode: boolean;
    private placementKey: PlacementKey | null;
    private placementTarget: THREE.Object3D | null;
    private placementPanelEl: HTMLDivElement | null;
    private placementCodeEl: HTMLPreElement | null;
    private placementStatusEl: HTMLDivElement | null;
    private hudTimeTimer: number | null;
    private hudIntroStarted: boolean;
    private hudIntroDone: boolean;
    private hudIntroTimers: number[];
    private muted: boolean;
    private freeOrbitEnabled: boolean;
    private doorTravelProgress: number;
    private audioContext: AudioContext | null;
    private audioMasterGain: GainNode | null;
    private roomAmbienceAudio: HTMLAudioElement | null;
    private roomStartupAudio: HTMLAudioElement | null;
    private doorOpenAudio: HTMLAudioElement | null;
    private thresholdWhooshAudio: HTMLAudioElement | null;
    private monitorMouseDownAudio: HTMLAudioElement | null;
    private monitorMouseUpAudio: HTMLAudioElement | null;
    private monitorKeyboardAudios: HTMLAudioElement[];
    private monitorKeyboardAudioCursor: number;
    private ambienceFadeTween: { stop: () => void } | null;
    private ambienceVolume: number;
    private roomAmbienceStarted: boolean;

    constructor() {
        // Debug handle for tooling (e.g. the Blender shadow-bake pipeline
        // extracts real world transforms from the live scene through this).
        (window as unknown as { __spatialPortfolio?: SpatialPortfolio }).__spatialPortfolio = this;
        this.container = document.getElementById('webgl') || document.body;
        this.cssRoot =
            document.getElementById('css') ||
            document.body.insertBefore(document.createElement('div'), this.container);
        this.uiContainer = document.getElementById('ui') || document.body;
        this.scene = new THREE.Scene();
        this.scene.background = null;
        this.scene.fog = new THREE.Fog(0xdfe0de, 7.5, 15);
        this.camera = new THREE.PerspectiveCamera(
            42,
            window.innerWidth / window.innerHeight,
            0.05,
            100
        );
        this.cameraTarget = CAMERA_POSES.loading.target.clone();
        this.camera.position.copy(CAMERA_POSES.loading.position);
        this.camera.lookAt(this.cameraTarget);
        this.portalCamera = new THREE.PerspectiveCamera(42, PORTAL_ASPECT, 0.05, 100);
        this.portalCamera.position.copy(CAMERA_POSES.room.position);
        this.portalCameraTarget = CAMERA_POSES.room.target.clone();
        this.portalCamera.lookAt(this.portalCameraTarget);
        this.portalSourceMatrix = new THREE.Matrix4().makeTranslation(
            PORTAL_SOURCE_POSITION.x,
            PORTAL_SOURCE_POSITION.y,
            PORTAL_SOURCE_POSITION.z
        );
        this.portalDestinationMatrix = new THREE.Matrix4().makeTranslation(
            PORTAL_DESTINATION_POSITION.x,
            PORTAL_DESTINATION_POSITION.y,
            PORTAL_DESTINATION_POSITION.z
        );
        this.portalTransformMatrix = new THREE.Matrix4();
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2(10, 10);
        this.state = 'entry-door';
        this.entrySeed = null;
        this.roomWarmVoid = null;
        this.portalPreviewGroup = new THREE.Group();
        this.portalPreviewGroup.name = 'PortalPreviewGroup';
        this.portalPreviewGroup.visible = false;
        this.roomGroup = new THREE.Group();
        this.roomGroup.position.z = ROOM_DEPTH_OFFSET;
        this.roomGroup.visible = false;
        this.riserSetGroup = new THREE.Group();
        this.riserSetGroup.name = 'RiserSetGroup';
        this.riserSetGroup.position.set(0, 0, -0.108);
        this.roomGroup.add(this.riserSetGroup);
        this.doorReady = false;
        this.doorObjects = [];
        this.hotspotObjects = [];
        this.hotspotGroups = new Map();
        this.hoveredKey = null;
        this.hoverPausedUntil = 0;
        this.focusedKey = null;
        this.animationFrame = null;
        this.roomOrbitStartedAt = performance.now();
        this.roomOrbitPosition = CAMERA_POSES.room.position.clone();
        this.roomOrbitTarget = CAMERA_POSES.room.target.clone();
        this.entryParallaxPosition = CAMERA_POSES.entry.position.clone();
        this.entryParallaxTarget = CAMERA_POSES.entry.target.clone();
        this.thresholdFlareTimer = null;
        this.portalFullscreenActive = false;
        this.portalReleased = false;
        this.entryDoorFadeTween = null;
        this.doorFloorPoolMesh = null;
        this.doorFloorPoolMaterial = null;
        this.doorBakedShadowMesh = null;
        this.doorBakedShadowMaterial = null;
        this.monitorCssObject = null;
        this.monitorElement = null;
        this.monitorIframe = null;
        document
            .querySelectorAll('.v2-monitor-input-proxy')
            .forEach((element) => element.remove());
        this.monitorInputProxyEl = document.createElement('div');
        this.monitorInputProxyEl.className = 'v2-monitor-input-proxy';
        this.bindMonitorInputProxy();
        document.body.appendChild(this.monitorInputProxyEl);
        this.monitorGlassMaterial = null;
        this.monitorDimmingMaterial = null;
        this.monitorWorldPosition = new THREE.Vector3();
        this.monitorWorldQuaternion = new THREE.Quaternion();
        this.monitorPlanePosition = FALLBACK_MONITOR_POSITION.clone();
        this.monitorPlaneQuaternion = new THREE.Quaternion();
        this.monitorPlaneNormal = MONITOR_NORMAL.clone();
        this.monitorPlaneSize = FALLBACK_MONITOR_WORLD_SIZE.clone();
        const placementParam = new URLSearchParams(window.location.search).get('place');
        const placementAlias =
            placementParam === 'monitor' || placementParam === 'display'
                ? 'computer'
                : placementParam;
        this.placementKey =
            placementAlias === 'mouse' ||
            placementAlias === 'keyboard' ||
            placementAlias === 'mac-studio' ||
            placementAlias === 'mac-logo' ||
            placementAlias === 'homepod' ||
            placementAlias === 'plant' ||
            placementAlias === 'riser' ||
            placementAlias === 'floor-lamp' ||
            placementAlias === 'computer'
                ? placementAlias
                : null;
        this.placementMode = this.placementKey !== null;
        this.placementTarget = null;
        this.placementPanelEl = null;
        this.placementCodeEl = null;
        this.placementStatusEl = null;
        this.hudTimeTimer = null;
        this.hudIntroStarted = false;
        this.hudIntroDone = false;
        this.hudIntroTimers = [];
        this.muted = false;
        this.freeOrbitEnabled = false;
        this.doorTravelProgress = 0;
        this.audioContext = null;
        this.audioMasterGain = null;
        this.roomAmbienceAudio = null;
        this.roomStartupAudio = null;
        this.doorOpenAudio = null;
        this.thresholdWhooshAudio = null;
        this.monitorMouseDownAudio = null;
        this.monitorMouseUpAudio = null;
        this.monitorKeyboardAudios = [];
        this.monitorKeyboardAudioCursor = 0;
        this.ambienceFadeTween = null;
        this.ambienceVolume = 0;
        this.roomAmbienceStarted = false;
        this.setupSpatialAudio();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: true,
            // Log depth + MSAA makes silhouette edges of geometry hidden
            // behind the monitor (its stand, rear ports) bleed through the
            // screen's occlusion plane at far camera distances: log depth is
            // written per pixel via gl_FragDepth, and at edge pixels the
            // extrapolated depth can land centimeters closer to the camera,
            // beating the punch-out plane. The standard depth buffer at the
            // 0.05/100 clip range shows no z-fighting on the office-desk
            // planks it was originally enabled for, so keep it off.
            logarithmicDepthBuffer: false,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.96;
        this.renderer.shadowMap.enabled = false;
        this.renderer.domElement.className = 'v2-canvas';
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enabled = false;
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.06;
        this.orbitControls.enablePan = false;
        this.orbitControls.minDistance = 0.95;
        this.orbitControls.maxDistance = 4.8;
        this.orbitControls.minPolarAngle = 0.62;
        this.orbitControls.maxPolarAngle = Math.PI * 0.49;
        this.orbitControls.target.copy(CAMERA_POSES.room.target);
        this.orbitControls.update();
        this.cssRenderer = new CSS3DRenderer();
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.domElement.className = 'v2-css3d';
        this.setupEnvironment();
        this.portalRenderTarget = new THREE.WebGLRenderTarget(
            PORTAL_RENDER_WIDTH,
            PORTAL_RENDER_HEIGHT,
            {
                depthBuffer: true,
                stencilBuffer: false,
            }
        );
        this.portalRenderTarget.texture.encoding = THREE.sRGBEncoding;
        this.portalRenderTarget.texture.generateMipmaps = false;
        this.portalRenderTarget.texture.minFilter = THREE.LinearFilter;
        this.portalRenderTarget.texture.magFilter = THREE.LinearFilter;

        this.container.innerHTML = '';
        this.cssRoot.innerHTML = '';
        this.container.style.pointerEvents = 'auto';
        this.cssRoot.style.pointerEvents = 'none';
        this.cssRoot.appendChild(this.cssRenderer.domElement);
        this.container.appendChild(this.renderer.domElement);

        this.setupUI();
        this.addLights();
        this.scene.add(this.portalPreviewGroup);
        this.scene.add(this.roomGroup);
        this.addEntryHall();
        this.addRoom();
        this.addDesk();
        this.addObjects();
        this.addEvents();
        this.animate();
    }

    private setupUI() {
        this.uiContainer.innerHTML = '';
        this.uiContainer.style.pointerEvents = 'none';

        const root = document.createElement('div');
        root.className = 'v2-ui';

        this.hintEl = document.createElement('div');
        this.hintEl.className = 'v2-hint';
        this.hintEl.textContent = '';

        this.thresholdFlareEl = document.createElement('div');
        this.thresholdFlareEl.className = 'v2-threshold-flare';

        this.labelEl = document.createElement('div');
        this.labelEl.className = 'v2-hotspot-label';

        this.panelEl = document.createElement('div');
        this.panelEl.className = 'v2-focus-panel';

        this.backButtonEl = document.createElement('button');
        this.backButtonEl.className = 'v2-back-button';
        this.backButtonEl.type = 'button';
        this.backButtonEl.textContent = 'Back to room';
        this.backButtonEl.addEventListener('click', () => this.returnToRoom());

        this.roomHudEl = document.createElement('div');
        this.roomHudEl.className = 'v2-room-hud';
        this.roomHudEl.innerHTML = `
            <div class="v2-room-hud-row v2-room-hud-name v2-room-hud-sequenced">
                <span></span>
            </div>
            <div class="v2-room-hud-row v2-room-hud-title v2-room-hud-sequenced">
                <span></span>
            </div>
            <div class="v2-room-hud-actions">
                <div class="v2-room-hud-row v2-room-hud-time v2-room-hud-sequenced">
                    <span></span>
                </div>
            </div>
        `;

        this.hudNameRowEl = this.roomHudEl.querySelector(
            '.v2-room-hud-name'
        ) as HTMLDivElement;
        this.hudTitleRowEl = this.roomHudEl.querySelector(
            '.v2-room-hud-title'
        ) as HTMLDivElement;
        this.hudTimeRowEl = this.roomHudEl.querySelector(
            '.v2-room-hud-time'
        ) as HTMLDivElement;
        this.hudNameEl = this.roomHudEl.querySelector(
            '.v2-room-hud-name span'
        ) as HTMLSpanElement;
        this.hudTitleEl = this.roomHudEl.querySelector(
            '.v2-room-hud-title span'
        ) as HTMLSpanElement;
        this.hudTimeEl = this.roomHudEl.querySelector(
            '.v2-room-hud-time span'
        ) as HTMLSpanElement;
        const actionsEl = this.roomHudEl.querySelector(
            '.v2-room-hud-actions'
        ) as HTMLDivElement;
        this.muteButtonEl = this.createHudIconButton(
            'Mute sound',
            HUD_VOLUME_ON_ICON_URL
        );
        this.muteButtonEl.classList.add('v2-room-hud-sequenced');
        this.muteIconEl = this.muteButtonEl.querySelector('img') as HTMLImageElement;
        this.freeOrbitButtonEl = this.createHudIconButton(
            'Enable free rotation',
            HUD_CAMERA_ICON_URL
        );
        this.freeOrbitButtonEl.classList.add('v2-room-hud-sequenced');
        this.freeOrbitIconEl = this.freeOrbitButtonEl.querySelector(
            'img'
        ) as HTMLImageElement;
        this.muteButtonEl.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggleMuted();
        });
        this.freeOrbitButtonEl.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggleFreeOrbit();
        });
        actionsEl.appendChild(this.muteButtonEl);
        actionsEl.appendChild(this.freeOrbitButtonEl);
        this.updateHudTime();
        this.hudTimeTimer = window.setInterval(() => this.updateHudTime(), 1000);

        root.appendChild(this.thresholdFlareEl);
        root.appendChild(this.roomHudEl);
        root.appendChild(this.hintEl);
        root.appendChild(this.labelEl);
        root.appendChild(this.panelEl);
        root.appendChild(this.backButtonEl);
        this.uiContainer.appendChild(root);
    }

    private createHudIconButton(label: string, iconUrl: string) {
        const button = document.createElement('button');
        button.className = 'v2-room-hud-button';
        button.type = 'button';
        button.setAttribute('aria-label', label);
        button.title = label;
        button.addEventListener('pointerdown', (event) => event.stopPropagation());
        button.addEventListener('pointerup', (event) => event.stopPropagation());

        const icon = document.createElement('img');
        icon.src = iconUrl;
        icon.alt = '';
        icon.draggable = false;
        button.appendChild(icon);
        return button;
    }

    private updateHudTime() {
        if (!this.hudTimeEl) return;
        if (!this.hudIntroDone) return;
        this.hudTimeEl.textContent = this.getHudTimeText();
    }

    private getHudTimeText() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    private updateRoomHud() {
        const visible =
            !this.placementMode &&
            this.roomGroup.visible &&
            this.state !== 'entry-door' &&
            this.state !== 'door-opening' &&
            this.focusedKey !== 'computer';
        const canToggleFreeOrbit =
            visible &&
            (this.state === 'room-idle' || this.freeOrbitEnabled) &&
            !this.focusedKey;

        this.roomHudEl.classList.toggle('is-visible', visible);
        if (visible) this.startRoomHudIntro();
        this.freeOrbitButtonEl.disabled = !canToggleFreeOrbit;
        this.freeOrbitButtonEl.classList.toggle('is-disabled', !canToggleFreeOrbit);
    }

    private updateMonitorInteractivity() {
        const interactive =
            !this.placementMode &&
            this.roomGroup.visible &&
            this.focusedKey === 'computer' &&
            this.state === 'focus-computer';

        this.cssRoot.classList.toggle('is-monitor-interactive', interactive);
        this.monitorElement?.classList.toggle('is-interactive', interactive);
        this.cssRoot.style.pointerEvents = 'none';
        this.cssRenderer.domElement.style.pointerEvents = 'none';
        if (this.monitorElement?.parentElement) {
            this.monitorElement.parentElement.style.pointerEvents = 'none';
        }
        this.updateMonitorInputProxy(interactive);
    }

    private bindMonitorInputProxy() {
        const forwardMouseEvent = (event: MouseEvent) =>
            this.forwardMonitorMouseEvent(event);
        const forwardDragEvent = (event: MouseEvent) => {
            if (event.buttons !== 0) this.forwardMonitorMouseEvent(event);
        };
        this.monitorInputProxyEl.addEventListener('mousedown', forwardMouseEvent);
        this.monitorInputProxyEl.addEventListener('mouseup', forwardMouseEvent);
        this.monitorInputProxyEl.addEventListener('click', forwardMouseEvent);
        this.monitorInputProxyEl.addEventListener('dblclick', forwardMouseEvent);
        this.monitorInputProxyEl.addEventListener('mousemove', forwardDragEvent);
        this.monitorInputProxyEl.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        this.monitorInputProxyEl.addEventListener(
            'wheel',
            (event) => this.forwardMonitorWheelEvent(event),
            { passive: false }
        );
    }

    private updateMonitorInputProxy(interactive: boolean) {
        if (!interactive || !this.monitorIframe) {
            this.monitorInputProxyEl.classList.remove('is-visible');
            return;
        }

        const rect = this.monitorIframe.getBoundingClientRect();
        Object.assign(this.monitorInputProxyEl.style, {
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
        });
        this.monitorInputProxyEl.classList.add('is-visible');
    }

    private getMonitorIframePoint(clientX: number, clientY: number) {
        if (!this.monitorIframe?.contentWindow) return null;
        const rect = this.monitorIframe.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        const width = this.monitorIframe.contentWindow.innerWidth || MONITOR_CSS_SIZE.x;
        const height = this.monitorIframe.contentWindow.innerHeight || MONITOR_CSS_SIZE.y;

        return {
            x: THREE.MathUtils.clamp(
                ((clientX - rect.left) / rect.width) * width,
                0,
                width
            ),
            y: THREE.MathUtils.clamp(
                ((clientY - rect.top) / rect.height) * height,
                0,
                height
            ),
        };
    }

    private forwardMonitorMouseEvent(event: MouseEvent) {
        if (
            !this.monitorIframe?.contentDocument ||
            !this.monitorIframe.contentWindow ||
            !this.monitorInputProxyEl.classList.contains('is-visible')
        ) {
            return;
        }

        const point = this.getMonitorIframePoint(event.clientX, event.clientY);
        if (!point) return;
        event.preventDefault();
        event.stopPropagation();
        this.playMonitorMouseSound(event.type);

        const iframeDocument = this.monitorIframe.contentDocument;
        const target =
            iframeDocument.elementFromPoint(point.x, point.y) ||
            iframeDocument.body ||
            iframeDocument.documentElement;
        if (!target) return;

        target.dispatchEvent(
            new MouseEvent(event.type, {
                bubbles: true,
                cancelable: true,
                view: this.monitorIframe.contentWindow,
                clientX: point.x,
                clientY: point.y,
                screenX: event.screenX,
                screenY: event.screenY,
                button: event.button,
                buttons: event.buttons,
                detail: event.detail,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey,
            })
        );
    }

    private forwardMonitorWheelEvent(event: WheelEvent) {
        if (
            !this.monitorIframe?.contentDocument ||
            !this.monitorIframe.contentWindow ||
            !this.monitorInputProxyEl.classList.contains('is-visible')
        ) {
            return;
        }

        const point = this.getMonitorIframePoint(event.clientX, event.clientY);
        if (!point) return;
        event.preventDefault();
        event.stopPropagation();

        const iframeDocument = this.monitorIframe.contentDocument;
        const target =
            iframeDocument.elementFromPoint(point.x, point.y) ||
            iframeDocument.body ||
            iframeDocument.documentElement;
        if (!target) return;

        const forwardedWheelEvent = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            view: this.monitorIframe.contentWindow,
            clientX: point.x,
            clientY: point.y,
            deltaX: event.deltaX,
            deltaY: event.deltaY,
            deltaZ: event.deltaZ,
            deltaMode: event.deltaMode,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
        });
        target.dispatchEvent(forwardedWheelEvent);
        if (!forwardedWheelEvent.defaultPrevented) {
            this.scrollMonitorDocumentAtTarget(iframeDocument, target, event);
        }
    }

    private scrollMonitorDocumentAtTarget(
        iframeDocument: Document,
        target: Element,
        event: WheelEvent
    ) {
        const deltaMultiplier =
            event.deltaMode === WheelEvent.DOM_DELTA_LINE
                ? 18
                : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                  ? iframeDocument.documentElement.clientHeight
                  : 1;
        const deltaX = event.deltaX * deltaMultiplier;
        const deltaY = event.deltaY * deltaMultiplier;
        const pageContent = iframeDocument.querySelector('.site-page-content');
        const scrollTarget =
            this.findScrollableAncestor(target, deltaX, deltaY) ||
            (pageContent
                ? this.findScrollableAncestor(pageContent, deltaX, deltaY)
                : null) ||
            iframeDocument.scrollingElement;

        if (!scrollTarget) return;

        scrollTarget.scrollLeft += deltaX;
        scrollTarget.scrollTop += deltaY;
    }

    private findScrollableAncestor(
        target: Element,
        deltaX: number,
        deltaY: number
    ): Element | null {
        let current: Element | null = target;
        while (current) {
            const view = current.ownerDocument.defaultView || window;
            const style = view.getComputedStyle(current);
            const hasVerticalOverflow = current.scrollHeight > current.clientHeight;
            const hasHorizontalOverflow = current.scrollWidth > current.clientWidth;
            const canScrollY =
                Math.abs(deltaY) > 0 &&
                /(auto|scroll|overlay)/.test(style.overflowY) &&
                hasVerticalOverflow &&
                ((deltaY > 0 &&
                    current.scrollTop + current.clientHeight < current.scrollHeight) ||
                    (deltaY < 0 && current.scrollTop > 0));
            const canScrollX =
                Math.abs(deltaX) > 0 &&
                /(auto|scroll|overlay)/.test(style.overflowX) &&
                hasHorizontalOverflow &&
                ((deltaX > 0 &&
                    current.scrollLeft + current.clientWidth < current.scrollWidth) ||
                    (deltaX < 0 && current.scrollLeft > 0));

            if (canScrollY || canScrollX) return current;
            current = current.parentElement;
        }
        return null;
    }

    private startRoomHudIntro() {
        if (this.hudIntroStarted) return;
        this.hudIntroStarted = true;
        this.hudIntroDone = false;
        this.clearHudIntroTimers();
        this.hudNameEl.textContent = '';
        this.hudTitleEl.textContent = '';
        this.hudTimeEl.textContent = '';

        if (REDUCED_MOTION) {
            this.hudNameEl.textContent = 'Jerry Ni';
            this.hudTitleEl.textContent = 'Software Engineer';
            this.hudIntroDone = true;
            this.updateHudTime();
            [
                this.hudNameRowEl,
                this.hudTitleRowEl,
                this.hudTimeRowEl,
                this.muteButtonEl,
                this.freeOrbitButtonEl,
            ].forEach((element) => this.revealHudElement(element));
            return;
        }

        this.queueHudIntroTimer(() => {
            this.typeHudText('Jerry Ni', this.hudNameEl, this.hudNameRowEl, () => {
                this.typeHudText(
                    'Software Engineer',
                    this.hudTitleEl,
                    this.hudTitleRowEl,
                    () => {
                        this.typeHudText(
                            this.getHudTimeText(),
                            this.hudTimeEl,
                            this.hudTimeRowEl,
                            () => {
                                this.hudIntroDone = true;
                                this.updateHudTime();
                                this.queueHudIntroTimer(() => {
                                    this.revealHudElement(this.muteButtonEl);
                                    this.queueHudIntroTimer(() => {
                                        this.revealHudElement(this.freeOrbitButtonEl);
                                    }, 250);
                                }, 250);
                            }
                        );
                    }
                );
            });
        }, 400);
    }

    private typeHudText(
        text: string,
        target: HTMLSpanElement,
        row: HTMLElement,
        onComplete: () => void
    ) {
        this.revealHudElement(row);
        let index = 0;
        const typeNext = () => {
            if (index >= text.length) {
                onComplete();
                return;
            }
            const nextCharacter = text[index];
            target.textContent = `${target.textContent || ''}${nextCharacter}`;
            this.pulseHudTypeSound(nextCharacter);
            index += 1;
            this.queueHudIntroTimer(typeNext, 50 + Math.random() * 50);
        };
        typeNext();
    }

    private revealHudElement(element: HTMLElement) {
        element.classList.add('is-revealed');
    }

    private queueHudIntroTimer(callback: () => void, delay: number) {
        const timer = window.setTimeout(() => {
            this.hudIntroTimers = this.hudIntroTimers.filter((item) => item !== timer);
            callback();
        }, delay);
        this.hudIntroTimers.push(timer);
    }

    private clearHudIntroTimers() {
        this.hudIntroTimers.forEach((timer) => window.clearTimeout(timer));
        this.hudIntroTimers = [];
    }

    private pulseHudTypeSound(character = '') {
        this.playHudTypeSound(character);
    }

    private setupSpatialAudio() {
        this.roomAmbienceAudio = new Audio(ROOM_AMBIENCE_AUDIO_URL);
        this.roomAmbienceAudio.loop = true;
        this.roomAmbienceAudio.preload = 'auto';
        this.roomAmbienceAudio.volume = 0;

        this.roomStartupAudio = new Audio(ROOM_STARTUP_AUDIO_URL);
        this.roomStartupAudio.preload = 'auto';
        this.roomStartupAudio.volume = ROOM_STARTUP_VOLUME;

        this.doorOpenAudio = this.createOneShotAudio(
            DOOR_OPEN_AUDIO_URL,
            DOOR_OPEN_VOLUME
        );
        this.thresholdWhooshAudio = this.createOneShotAudio(
            THRESHOLD_WHOOSH_AUDIO_URL,
            THRESHOLD_WHOOSH_VOLUME
        );
        this.monitorMouseDownAudio = this.createOneShotAudio(
            MONITOR_MOUSE_DOWN_AUDIO_URL,
            MONITOR_MOUSE_DOWN_VOLUME
        );
        this.monitorMouseUpAudio = this.createOneShotAudio(
            MONITOR_MOUSE_UP_AUDIO_URL,
            MONITOR_MOUSE_UP_VOLUME
        );
        this.monitorKeyboardAudios = MONITOR_KEYBOARD_AUDIO_URLS.map((src) =>
            this.createOneShotAudio(src, MONITOR_KEYBOARD_VOLUME)
        );
    }

    private createOneShotAudio(src: string, volume: number) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = volume;
        audio.muted = this.muted;
        return audio;
    }

    private getSpatialAudioContext() {
        if (this.audioContext) return this.audioContext;

        const AudioContextConstructor =
            window.AudioContext ||
            (window as typeof window & {
                webkitAudioContext?: typeof AudioContext;
            }).webkitAudioContext;
        if (!AudioContextConstructor) return null;

        this.audioContext = new AudioContextConstructor();
        this.audioMasterGain = this.audioContext.createGain();
        this.audioMasterGain.gain.value = this.muted ? 0 : 1;
        this.audioMasterGain.connect(this.audioContext.destination);
        return this.audioContext;
    }

    private unlockSpatialAudio() {
        const context = this.getSpatialAudioContext();
        if (!context) return null;
        if (context.state !== 'running') {
            context.resume().catch(() => {
                // Browsers may still deny audio if this is not in a trusted gesture.
            });
        }
        return context;
    }

    private connectToMaster(node: AudioNode) {
        if (!this.audioMasterGain) return;
        node.connect(this.audioMasterGain);
    }

    private playOneShotAudio(audio: HTMLAudioElement | null, volume: number) {
        if (!audio || this.muted) return;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = volume;
        audio.play().catch(() => {
            // Audio is decorative; browsers can still reject playback in edge cases.
        });
    }

    private playDoorOpenSound() {
        this.unlockSpatialAudio();
        this.playOneShotAudio(this.doorOpenAudio, DOOR_OPEN_VOLUME);
    }

    private playThresholdCrossingSound() {
        this.unlockSpatialAudio();
        this.playOneShotAudio(this.thresholdWhooshAudio, THRESHOLD_WHOOSH_VOLUME);
    }

    private playMonitorMouseSound(type: string) {
        if (type === 'mousedown') {
            this.playOneShotAudio(this.monitorMouseDownAudio, MONITOR_MOUSE_DOWN_VOLUME);
        } else if (type === 'mouseup') {
            this.playOneShotAudio(this.monitorMouseUpAudio, MONITOR_MOUSE_UP_VOLUME);
        }
    }

    private playMonitorKeyboardSound(event: KeyboardEvent) {
        if (
            this.muted ||
            event.repeat ||
            !this.isMonitorKeyboardSoundActive() ||
            !this.shouldPlayMonitorKeyboardSound(event)
        ) {
            return;
        }

        const audio = this.monitorKeyboardAudios[this.monitorKeyboardAudioCursor];
        this.monitorKeyboardAudioCursor =
            (this.monitorKeyboardAudioCursor + 1) %
            Math.max(1, this.monitorKeyboardAudios.length);
        this.playOneShotAudio(audio, MONITOR_KEYBOARD_VOLUME);
    }

    private isMonitorKeyboardSoundActive() {
        return (
            !this.placementMode &&
            this.state === 'focus-computer' &&
            this.focusedKey === 'computer' &&
            this.monitorInputProxyEl.classList.contains('is-visible')
        );
    }

    private shouldPlayMonitorKeyboardSound(event: KeyboardEvent) {
        if (event.key === 'Escape') return false;
        if (event.metaKey || event.ctrlKey || event.altKey) return false;
        return [
            'Backspace',
            'Delete',
            'Enter',
            'Tab',
            ' ',
        ].includes(event.key) || event.key.length === 1;
    }

    private playRoomArrivalSound() {
        this.unlockSpatialAudio();
        this.startRoomAmbience();

        const startup = this.roomStartupAudio;
        if (!startup) return;
        startup.pause();
        startup.currentTime = 0;
        startup.muted = this.muted;
        startup.volume = this.muted ? 0 : ROOM_STARTUP_VOLUME;
        startup.play().catch(() => {
            // Non-critical: the ambient bed still carries the transition.
        });
    }

    private startRoomAmbience() {
        const ambience = this.roomAmbienceAudio;
        if (!ambience) return;

        if (!this.roomAmbienceStarted) {
            this.roomAmbienceStarted = true;
            ambience.muted = this.muted;
            ambience.volume = 0;
            ambience.play().catch(() => {
                this.roomAmbienceStarted = false;
            });
        }

        this.fadeRoomAmbienceTo(ROOM_AMBIENCE_VOLUME, REDUCED_MOTION ? 1 : 2600);
    }

    private fadeRoomAmbienceTo(volume: number, duration: number) {
        if (!this.roomAmbienceAudio) return;
        if (this.ambienceFadeTween) this.ambienceFadeTween.stop();

        const state = { volume: this.ambienceVolume };
        this.ambienceFadeTween = new TWEEN.Tween(state)
            .to({ volume }, duration)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate(() => this.setRoomAmbienceVolume(state.volume))
            .onComplete(() => {
                this.setRoomAmbienceVolume(volume);
                this.ambienceFadeTween = null;
            })
            .start();
    }

    private setRoomAmbienceVolume(volume: number) {
        this.ambienceVolume = volume;
        if (!this.roomAmbienceAudio) return;
        this.roomAmbienceAudio.volume = this.muted ? 0 : volume;
        this.roomAmbienceAudio.muted = this.muted;
    }

    private applyAudioMuteState() {
        if (this.audioMasterGain && this.audioContext) {
            this.audioMasterGain.gain.setTargetAtTime(
                this.muted ? 0 : 1,
                this.audioContext.currentTime,
                0.018
            );
        }
        this.setRoomAmbienceVolume(this.ambienceVolume);
        if (this.roomStartupAudio) {
            this.roomStartupAudio.muted = this.muted;
            this.roomStartupAudio.volume = this.muted ? 0 : ROOM_STARTUP_VOLUME;
        }
        if (this.doorOpenAudio) {
            this.doorOpenAudio.muted = this.muted;
            this.doorOpenAudio.volume = this.muted ? 0 : DOOR_OPEN_VOLUME;
        }
        if (this.thresholdWhooshAudio) {
            this.thresholdWhooshAudio.muted = this.muted;
            this.thresholdWhooshAudio.volume = this.muted ? 0 : THRESHOLD_WHOOSH_VOLUME;
        }
        if (this.monitorMouseDownAudio) {
            this.monitorMouseDownAudio.muted = this.muted;
            this.monitorMouseDownAudio.volume = this.muted
                ? 0
                : MONITOR_MOUSE_DOWN_VOLUME;
        }
        if (this.monitorMouseUpAudio) {
            this.monitorMouseUpAudio.muted = this.muted;
            this.monitorMouseUpAudio.volume = this.muted ? 0 : MONITOR_MOUSE_UP_VOLUME;
        }
        this.monitorKeyboardAudios.forEach((audio) => {
            audio.muted = this.muted;
            audio.volume = this.muted ? 0 : MONITOR_KEYBOARD_VOLUME;
        });
    }

    private playHudTypeSound(character = '') {
        const context = this.getSpatialAudioContext();
        if (!context || this.muted || !this.roomAmbienceStarted || REDUCED_MOTION) {
            return;
        }

        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const charCode = character.charCodeAt(0) || 0;
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(920 + (charCode % 6) * 34, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(HUD_TYPE_VOLUME, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.052);
        oscillator.connect(gain);
        this.connectToMaster(gain);
        oscillator.start(now);
        oscillator.stop(now + 0.06);
    }

    private toggleMuted() {
        this.muted = !this.muted;
        this.muteIconEl.src = this.muted
            ? HUD_VOLUME_OFF_ICON_URL
            : HUD_VOLUME_ON_ICON_URL;
        this.muteButtonEl.classList.toggle('is-active', this.muted);
        this.muteButtonEl.setAttribute(
            'aria-label',
            this.muted ? 'Unmute sound' : 'Mute sound'
        );
        this.muteButtonEl.title = this.muted ? 'Unmute sound' : 'Mute sound';
        document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((media) => {
            media.muted = this.muted;
        });
        this.applyAudioMuteState();
        window.dispatchEvent(
            new CustomEvent('roomMuteToggle', {
                detail: { muted: this.muted },
            })
        );
    }

    private toggleFreeOrbit() {
        if (this.freeOrbitButtonEl.disabled && !this.freeOrbitEnabled) return;
        this.setFreeOrbitEnabled(!this.freeOrbitEnabled, true);
    }

    private setFreeOrbitEnabled(enabled: boolean, animateHome = false) {
        if (this.freeOrbitEnabled === enabled) return;
        this.freeOrbitEnabled = enabled;
        this.orbitControls.enabled = enabled;
        this.freeOrbitButtonEl.classList.toggle('is-active', enabled);
        this.freeOrbitIconEl.src = enabled ? HUD_MOUSE_ICON_URL : HUD_CAMERA_ICON_URL;
        this.freeOrbitButtonEl.setAttribute(
            'aria-label',
            enabled ? 'Return to auto rotation' : 'Enable free rotation'
        );
        this.freeOrbitButtonEl.title = enabled
            ? 'Return to auto rotation'
            : 'Enable free rotation';

        if (enabled) {
            document.body.style.cursor = 'grab';
            const syncOrbitControls = () => {
                this.orbitControls.target.copy(this.getFreeOrbitTarget());
                this.orbitControls.object.position.copy(this.camera.position);
                this.orbitControls.enabled = true;
                this.orbitControls.update();
            };

            if (animateHome && this.state === 'room-idle') {
                this.orbitControls.enabled = false;
                this.moveCamera(
                    this.getFreeOrbitOverviewPose(),
                    REDUCED_MOTION ? 1 : 850,
                    syncOrbitControls,
                    TWEEN.Easing.Cubic.Out
                );
                return;
            }

            syncOrbitControls();
            return;
        }

        document.body.style.cursor = '';
        if (animateHome && this.state === 'room-idle') {
            this.state = 'returning-room';
            this.moveCamera(CAMERA_POSES.room, REDUCED_MOTION ? 1 : 900, () => {
                this.beginRoomOrbit();
                this.state = 'room-idle';
            });
            return;
        }
        this.beginRoomOrbit();
    }

    private getFreeOrbitTarget() {
        if (!this.monitorCssObject) {
            return FREE_ORBIT_OVERVIEW_POSE.target.clone();
        }

        this.monitorCssObject.updateMatrixWorld(true);
        const target = new THREE.Vector3();
        this.monitorCssObject.getWorldPosition(target);
        target.y += FREE_ORBIT_TARGET_Y_OFFSET;
        return target;
    }

    // Slide the orbit target with zoom distance: far out it sits below the
    // monitor so the whole desk group is centered, and as the camera dollies
    // in it rises back to the monitor center so zooming magnifies the screen.
    private updateFreeOrbitTarget() {
        if (!this.monitorCssObject) return;
        const anchor = new THREE.Vector3();
        this.monitorCssObject.getWorldPosition(anchor);
        const distance = this.camera.position.distanceTo(
            this.orbitControls.target
        );
        const zoomOutAmount = THREE.MathUtils.clamp(
            (distance - this.orbitControls.minDistance) /
                (this.orbitControls.maxDistance - this.orbitControls.minDistance),
            0,
            1
        );
        anchor.y += FREE_ORBIT_TARGET_Y_OFFSET * zoomOutAmount;
        this.orbitControls.target.lerp(anchor, 0.18);
    }

    private getFreeOrbitOverviewPose(): CameraPose {
        return {
            position: FREE_ORBIT_OVERVIEW_POSE.position.clone(),
            target: this.getFreeOrbitTarget(),
        };
    }

    private addLights() {
        const hemisphere = new THREE.HemisphereLight(0xf8f5ee, 0xcac2b5, 0.5);
        this.scene.add(hemisphere);

        const key = new THREE.DirectionalLight(0xffefdc, 0.9);
        key.position.set(-2.2, 6.4, 3.8);
        key.castShadow = false;
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xe7ecff, 0.12);
        fill.position.set(3.4, 2.6, 4.2);
        this.scene.add(fill);

    }

    private setupEnvironment() {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        const environment = new RoomEnvironment();
        this.scene.environment = pmrem.fromScene(environment, 0.02).texture;
        environment.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            child.geometry.dispose();
            const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];
            materials.forEach((material) => material.dispose());
        });
        pmrem.dispose();
    }

    private addEntryHall() {
        this.portalStencil = new THREE.Mesh(
            new THREE.PlaneGeometry(PORTAL_PLANE_WIDTH, PORTAL_STENCIL_HEIGHT),
            new THREE.MeshBasicMaterial({
                colorWrite: false,
                depthWrite: false,
                stencilWrite: true,
                stencilRef: 1,
                stencilFunc: THREE.AlwaysStencilFunc,
                stencilFail: THREE.KeepStencilOp,
                stencilZFail: THREE.KeepStencilOp,
                stencilZPass: THREE.ReplaceStencilOp,
            })
        );
        this.portalStencil.position.copy(PORTAL_SOURCE_POSITION);
        this.portalStencil.position.y = PORTAL_STENCIL_CENTER_Y;
        this.portalStencil.position.z += 0.007;
        this.portalStencil.renderOrder = -100;
        this.portalStencil.visible = false;
        this.scene.add(this.portalStencil);

        this.portalSurface = new THREE.Mesh(
            new THREE.PlaneGeometry(PORTAL_PLANE_WIDTH, PORTAL_PLANE_HEIGHT),
            new THREE.MeshBasicMaterial({
                map: this.portalRenderTarget.texture,
                side: THREE.DoubleSide,
                toneMapped: false,
            })
        );
        this.portalSurface.name = 'DoorPortalSurface';
        this.portalSurface.position.copy(PORTAL_SOURCE_POSITION);
        this.portalSurface.renderOrder = -40;
        this.portalSurface.visible = false;
        this.scene.add(this.portalSurface);

        this.entryDoorRoot = new THREE.Group();
        this.entryDoorRoot.name = 'EntryDoorRoot';
        this.entryDoorRoot.visible = false;
        this.scene.add(this.entryDoorRoot);
        this.addEntrySeed();
        this.loadDoorAsset();
    }

    private addEntrySeed() {
        const material = new THREE.SpriteMaterial({
            color: 0xf8f4ea,
            opacity: 0.76,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
        });
        this.entrySeed = new THREE.Sprite(material);
        this.entrySeed.name = 'EntryRevealSeed';
        this.entrySeed.position.set(0, DOOR_REVEAL_ORIGIN_Y, 0.02);
        this.entrySeed.scale.setScalar(0.16);
        this.scene.add(this.entrySeed);
    }

    private addPortalPreview() {
        const wallMat = new THREE.MeshBasicMaterial({
            color: 0xb68552,
            transparent: true,
            opacity: 0.92,
            side: THREE.DoubleSide,
            toneMapped: false,
        });
        const floorMat = new THREE.MeshBasicMaterial({
            color: 0xe6c08a,
            transparent: true,
            opacity: 0.78,
            side: THREE.DoubleSide,
            toneMapped: false,
        });
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x9b6634,
            roughness: 0.58,
            metalness: 0.02,
        });
        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x2b2926,
            roughness: 0.68,
        });
        const paperMat = new THREE.MeshBasicMaterial({
            color: 0xfff5df,
            side: THREE.DoubleSide,
            toneMapped: false,
        });
        const lampMat = new THREE.MeshStandardMaterial({
            color: 0x1f1e1c,
            roughness: 0.36,
            metalness: 0.14,
            emissive: 0xffb35d,
            emissiveIntensity: 0.24,
        });
        const bulbMat = new THREE.MeshBasicMaterial({
            color: 0xffe4ad,
            toneMapped: false,
        });

        const wall = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 2.05), wallMat);
        wall.position.set(0, 1.03, -0.82);

        const floor = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.15), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0.005, -0.34);

        const deskTop = this.box([0.78, 0.055, 0.28], [0.05, 0.62, -0.58], woodMat, false);
        const deskLegs = [
            [-0.28, 0.32, -0.48],
            [0.38, 0.32, -0.48],
            [-0.28, 0.32, -0.68],
            [0.38, 0.32, -0.68],
        ].map((position) => this.box([0.035, 0.55, 0.035], position, woodMat, false));

        const chairSeat = this.box([0.28, 0.045, 0.24], [-0.22, 0.34, -0.32], darkMat, false);
        const chairBack = this.box([0.28, 0.34, 0.035], [-0.22, 0.54, -0.22], darkMat, false);
        chairBack.rotation.x = -0.12;

        const paper = this.box([0.3, 0.006, 0.18], [-0.02, 0.654, -0.49], paperMat, false);
        paper.rotation.y = -0.14;
        paper.rotation.z = 0.06;

        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.07, 24), paperMat);
        mug.position.set(-0.22, 0.685, -0.53);

        const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.018, 24), darkMat);
        lampBase.position.set(0.23, 0.66, -0.55);
        const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 16), darkMat);
        lampStem.position.set(0.28, 0.83, -0.55);
        lampStem.rotation.z = -0.38;
        const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 24), lampMat);
        lampShade.position.set(0.36, 0.98, -0.55);
        lampShade.rotation.z = -0.74;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 18, 10), bulbMat);
        bulb.position.set(0.33, 0.93, -0.55);

        const warmLight = new THREE.PointLight(0xffb35d, 1.4, 2.2, 1.65);
        warmLight.position.set(0.22, 0.94, -0.5);

        [
            wall,
            floor,
            deskTop,
            ...deskLegs,
            chairSeat,
            chairBack,
            paper,
            mug,
            lampBase,
            lampStem,
            lampShade,
            bulb,
        ].forEach((object) => {
            object.castShadow = false;
            object.receiveShadow = false;
            this.portalPreviewGroup.add(object);
        });
        this.portalPreviewGroup.add(warmLight);
    }

    private loadDoorAsset() {
        const loader = new GLTFLoader();
        loader.load(
            DOOR_MODEL_URL,
            (gltf) => {
                if (this.state !== 'entry-door') return;

                const modelRoot = gltf.scene;
                modelRoot.name = 'JianweiDoorModel';
                const swing = modelRoot.getObjectByName('DoorSwing') as
                    | THREE.Group
                    | undefined;
                if (!swing) return;

                const loadedRoot = new THREE.Group();
                loadedRoot.name = 'EntryDoorRoot';
                loadedRoot.position.y = DOOR_REVEAL_ORIGIN_Y;
                loadedRoot.scale.setScalar(
                    REDUCED_MOTION ? 1 : DOOR_REVEAL_START_SCALE
                );
                loadedRoot.visible = REDUCED_MOTION;
                modelRoot.position.y = -DOOR_REVEAL_ORIGIN_Y;
                loadedRoot.add(modelRoot);

                const plaque = this.createDoorPlaque();
                plaque.name = 'DoorPlaque';
                plaque.position.set(-0.42, 1.5, 0.062);
                plaque.userData.hotspotKey = 'door';
                swing.add(plaque);

                this.doorObjects = [];
                loadedRoot.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    if (this.configureDoorBakedShadow(child)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    child.userData.hotspotKey = 'door';
                    this.doorObjects.push(child);
                    this.applyDoorAssetMaterial(child);
                });

                // Keep the threshold transition strictly on the ground. A
                // vertical spill plane makes this isolated door read as if it
                // were mounted in a wall instead of standing in the void.
                const pool = this.createDoorFloorPool();
                if (pool) modelRoot.add(pool);

                this.scene.remove(this.entryDoorRoot);
                this.entryDoorRoot = loadedRoot;
                this.doorPivot = swing;
                this.scene.add(this.entryDoorRoot);
                this.setHint('');
                this.scheduleEntryIntro();
            },
            undefined,
            () => {
                this.setHint('Door model failed to load. Refresh to try again.');
            }
        );
    }

    private createDoorFloorPool() {
        const texture = this.makeDoorFloorPoolTexture();
        if (!texture) return null;

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
        });
        material.userData.entryBaseOpacity = 0;
        material.userData.entryBaseTransparent = true;
        this.doorFloorPoolMaterial = material;

        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(DOOR_FLOOR_POOL_WIDTH, DOOR_FLOOR_POOL_DEPTH),
            material
        );
        mesh.name = 'DoorFloorLightPool';
        mesh.rotation.x = -Math.PI / 2;
        // Lies on the entry-side ground with a small overlap through the
        // threshold. Drawn before the baked shadow so that shadow can still
        // ground the closed door while the light pool is ramping in.
        const nearEdge =
            PORTAL_SOURCE_POSITION.z - DOOR_FLOOR_POOL_THRESHOLD_OVERLAP;
        mesh.position.set(0, 0.0045, nearEdge + DOOR_FLOOR_POOL_DEPTH / 2);
        mesh.renderOrder = -2;
        mesh.raycast = () => {};
        this.doorFloorPoolMesh = mesh;
        return mesh;
    }

    private makeDoorFloorPoolTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if (!context) return null;

        const smoothstep = (edge0: number, edge1: number, value: number) => {
            const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        };

        const [red, green, blue] = DOOR_FLOOR_POOL_COLOR;
        const image = context.createImageData(canvas.width, canvas.height);
        for (let py = 0; py < canvas.height; py++) {
            for (let px = 0; px < canvas.width; px++) {
                const x =
                    (px / (canvas.width - 1) - 0.5) * DOOR_FLOOR_POOL_WIDTH;
                // Canvas top maps (via flipY) to the edge just inside the
                // portal after the -90° X rotation. z is signed distance from
                // the threshold: negative in the overlap, positive outside.
                const z =
                    (py / (canvas.height - 1)) * DOOR_FLOOR_POOL_DEPTH -
                    DOOR_FLOOR_POOL_THRESHOLD_OVERLAP;

                // Light fans out from the doorway: doorway-wide at the
                // threshold, wider and softer-edged with distance.
                const exteriorDistance = Math.max(0, z);
                const halfWidth =
                    DOOR_OPENING_HALF_WIDTH +
                    exteriorDistance * DOOR_FLOOR_POOL_SPREAD;
                const penumbra = 0.1 + exteriorDistance * 0.2;
                const lateral =
                    1 -
                    smoothstep(
                        halfWidth - penumbra,
                        halfWidth + penumbra,
                        Math.abs(x)
                    );
                const forward =
                    z < 0
                        ? smoothstep(
                              -DOOR_FLOOR_POOL_THRESHOLD_OVERLAP,
                              0,
                              z
                          )
                        : 1 -
                          smoothstep(
                              DOOR_FLOOR_POOL_THRESHOLD_PLATEAU,
                              DOOR_FLOOR_POOL_DEPTH -
                                  DOOR_FLOOR_POOL_THRESHOLD_OVERLAP,
                              z
                          );
                const alpha =
                    DOOR_FLOOR_POOL_MAX_ALPHA * lateral * forward;

                const offset = (py * canvas.width + px) * 4;
                image.data[offset] = red;
                image.data[offset + 1] = green;
                image.data[offset + 2] = blue;
                image.data[offset + 3] = Math.round(alpha * 255);
            }
        }
        context.putImageData(image, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
    }

    private configureDoorBakedShadow(mesh: THREE.Mesh) {
        if (!mesh.name.toLowerCase().includes('bakedshadow')) return false;

        const texture = new THREE.TextureLoader().load(DOOR_SHADOW_TEXTURE_URL);
        texture.anisotropy = Math.min(
            8,
            this.renderer.capabilities.getMaxAnisotropy()
        );

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            // Baked against the old darker backdrop; at full strength it
            // reads as a heavy grey slab in the current high-key entry.
            opacity: DOOR_BAKED_SHADOW_OPACITY,
            depthWrite: false,
            depthTest: true,
            toneMapped: false,
            side: THREE.DoubleSide,
        });
        material.userData.entryBaseOpacity = DOOR_BAKED_SHADOW_OPACITY;
        material.userData.entryBaseTransparent = true;
        mesh.material = material;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.renderOrder = -1;
        mesh.userData.hotspotKey = undefined;
        this.doorBakedShadowMesh = mesh;
        this.doorBakedShadowMaterial = material;
        return true;
    }

    private scheduleEntryIntro() {
        this.camera.position.copy(CAMERA_POSES.loading.position);
        this.cameraTarget.copy(CAMERA_POSES.loading.target);

        const beginIntro = () => {
            window.setTimeout(
                () => this.playEntryIntro(),
                REDUCED_MOTION ? 0 : ENTRY_INTRO_DELAY
            );
        };

        if (document.readyState === 'complete') {
            beginIntro();
        } else {
            window.addEventListener('load', beginIntro, { once: true });
        }
    }

    private playEntryIntro() {
        this.revealEntryDoor();
        this.moveCameraLocked(
            CAMERA_POSES.entry,
            REDUCED_MOTION ? 1 : ENTRY_INTRO_DURATION,
            () => {
                if (this.state !== 'entry-door') return;
                this.beginEntryParallax();
                window.requestAnimationFrame(() => {
                    if (this.state !== 'entry-door') return;
                    this.doorReady = true;
                    this.setHint('Click the door to enter');
                });
            },
            HENRY_ENTRY_EASING
        );
    }

    private revealEntryDoor() {
        this.resetEntryDoorFade();
        this.entryDoorRoot.visible = true;

        if (REDUCED_MOTION) {
            this.entryDoorRoot.scale.setScalar(1);
            if (this.entrySeed) this.entrySeed.visible = false;
            return;
        }

        this.entryDoorRoot.scale.setScalar(DOOR_REVEAL_START_SCALE);
        new TWEEN.Tween(this.entryDoorRoot.scale)
            .to({ x: 1, y: 1, z: 1 }, DOOR_REVEAL_DURATION)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        const seed = this.entrySeed;
        const seedMaterial = seed?.material;
        if (seed && seedMaterial instanceof THREE.SpriteMaterial) {
            new TWEEN.Tween({
                opacity: seedMaterial.opacity,
                scale: seed.scale.x,
            })
                .to({ opacity: 0, scale: 0.07 }, 950)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate(({ opacity, scale }) => {
                    seedMaterial.opacity = opacity;
                    seed.scale.setScalar(scale);
                })
                .onComplete(() => {
                    seed.visible = false;
                })
                .start();
        }
    }

    private setEntryDoorOpacity(opacity: number) {
        this.entryDoorRoot.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;

            const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];

            materials.forEach((material) => {
                if (!material) return;

                if (material.userData.entryBaseOpacity === undefined) {
                    material.userData.entryBaseOpacity = material.opacity;
                    material.userData.entryBaseTransparent = material.transparent;
                }

                const baseOpacity = material.userData.entryBaseOpacity as number;
                const baseTransparent = material.userData.entryBaseTransparent as boolean;
                material.opacity = baseOpacity * opacity;
                material.transparent = opacity < 0.999 ? true : baseTransparent;
                material.needsUpdate = true;
            });
        });
    }

    private resetEntryDoorFade() {
        if (this.entryDoorFadeTween) {
            this.entryDoorFadeTween.stop();
            this.entryDoorFadeTween = null;
        }
        this.entryDoorRoot.visible = true;
        this.setEntryDoorOpacity(1);
    }

    private hideEntryDoorImmediately() {
        if (this.entryDoorFadeTween) {
            this.entryDoorFadeTween.stop();
            this.entryDoorFadeTween = null;
        }
        this.entryDoorRoot.visible = false;
        this.setEntryDoorOpacity(1);
    }

    private fadeEntryDoorAfterCameraSettles() {
        if (!this.entryDoorRoot.visible) return;

        if (this.entryDoorFadeTween) {
            this.entryDoorFadeTween.stop();
            this.entryDoorFadeTween = null;
        }

        const state = { opacity: 1 };
        this.entryDoorFadeTween = new TWEEN.Tween(state)
            .to({ opacity: 0 }, REDUCED_MOTION ? 1 : 950)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate(() => {
                this.setEntryDoorOpacity(state.opacity);
            })
            .onComplete(() => {
                this.entryDoorRoot.visible = false;
                this.setEntryDoorOpacity(1);
                this.entryDoorFadeTween = null;
            })
            .start();
    }

    private applyDoorAssetMaterial(mesh: THREE.Mesh) {
        const name = mesh.name.toLowerCase();
        const materialOptions = {
            side: THREE.DoubleSide,
            envMapIntensity: 0.28,
            vertexColors: mesh.geometry.hasAttribute('color'),
        };

        if (name.includes('plaque')) return;

        if (name.includes('handle') || name.includes('hinge')) {
            mesh.material = new THREE.MeshStandardMaterial({
                ...materialOptions,
                color: 0x85837d,
                metalness: 0.82,
                roughness: 0.36,
            });
            return;
        }

        if (name.includes('frame')) {
            // The room interior (~238) and door spill glow (~240) both bypass
            // tone mapping, but the ACES shoulder caps a tone-mapped frame
            // near ~230 no matter how light its albedo, leaving it as a grey
            // outline ringing the doorway. Bypass tone mapping here too and
            // pick the albedo so the lit face lands between its neighbours.
            mesh.material = new THREE.MeshPhysicalMaterial({
                ...materialOptions,
                color: 0xa9a7a2,
                metalness: 0,
                roughness: 0.66,
                clearcoat: 0.06,
                clearcoatRoughness: 0.78,
                toneMapped: false,
            });
            return;
        }

        // Door panel: same brightness policy as the frame above — bypass tone
        // mapping and calibrate the albedo against the measured lighting gain,
        // otherwise the leaf reads as a grey slab inside the brightened frame.
        mesh.material = new THREE.MeshPhysicalMaterial({
            ...materialOptions,
            color: 0xa6a49e,
            metalness: 0,
            roughness: 0.62,
            clearcoat: 0.08,
            clearcoatRoughness: 0.72,
            toneMapped: false,
        });
    }

    private createDoorPlaque() {
        return new THREE.Mesh(
            new THREE.BoxGeometry(0.46, 0.14, 0.018),
            new THREE.MeshStandardMaterial({
                color: 0x2e3235,
                roughness: 0.48,
                metalness: 0.12,
                map: this.makeTextTexture("Jerry's Room", {
                    width: 768,
                    height: 240,
                    background: '#2e3235',
                    foreground: '#f7efe2',
                    font: 'bold 72px Helvetica, Arial, sans-serif',
                }),
            })
        );
    }

    private addRoom() {
        const warmVoidTexture = this.makeVignetteBackgroundTexture();
        const warmVoidMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: warmVoidTexture,
            opacity: 1,
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false,
            fog: false,
            toneMapped: false,
        });
        const warmVoid = new THREE.Mesh(
            new THREE.SphereGeometry(30, 48, 24),
            warmVoidMat
        );
        warmVoid.name = 'RoomWarmVoid';
        warmVoid.position.set(0, 1.35, deskZ(-3.3));
        warmVoid.renderOrder = -100;
        this.roomWarmVoid = warmVoid;
        this.roomGroup.add(warmVoid);

        if (USE_BAKED_ENVIRONMENT_MODEL) {
            this.loadBakedEnvironmentModel();
        } else {
            this.addBakedRoomShadowPlanes();
        }
    }

    private loadBakedEnvironmentModel() {
        const loader = new GLTFLoader();
        loader.load(
            BAKED_ENVIRONMENT_MODEL_URL,
            (gltf) => {
                const environment = gltf.scene;
                environment.name = 'HenryStyleBakedEnvironment';
                environment.position.z = -ROOM_DEPTH_OFFSET;

                const materialCache = new Map<THREE.Texture, THREE.MeshBasicMaterial>();
                environment.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    const sourceMaterial = Array.isArray(child.material)
                        ? child.material[0]
                        : child.material;
                    const materialWithMaps =
                        sourceMaterial as THREE.MeshStandardMaterial & {
                            emissiveMap?: THREE.Texture | null;
                        };
                    const texture =
                        materialWithMaps.map || materialWithMaps.emissiveMap || null;

                    child.castShadow = false;
                    child.receiveShadow = false;

                    if (!texture) return;
                    texture.encoding = THREE.sRGBEncoding;
                    texture.flipY = false;
                    texture.anisotropy = Math.min(
                        8,
                        this.renderer.capabilities.getMaxAnisotropy()
                    );

                    let bakedMaterial = materialCache.get(texture);
                    if (!bakedMaterial) {
                        bakedMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            side: THREE.DoubleSide,
                            toneMapped: false,
                        });
                        materialCache.set(texture, bakedMaterial);
                    }
                    child.material = bakedMaterial;
                    child.renderOrder = 1;
                });

                this.roomGroup.add(environment);
            },
            undefined,
            (error) => {
                console.warn('Baked environment model failed to load', error);
                this.addBakedRoomShadowPlanes();
                this.loadDeskModel();
            }
        );
    }

    private addBakedRoomShadowPlanes() {
        this.addBakedShadowPlane({
            name: 'BlenderBakedRealFloorSurface',
            url: BAKED_ROOM_FLOOR_SURFACE_TEXTURE_URL,
            width: 6.4,
            depth: 6.4,
            y: 0.004,
            z: deskZ(-3.42),
            opacity: 1,
            renderOrder: 1,
        });
        this.addBakedShadowPlane({
            name: 'BlenderBakedRealDeskSurface',
            url: BAKED_DESK_SURFACE_TEXTURE_URL,
            width: 3.55,
            depth: 1.72,
            y: DESK_SURFACE_Y + 0.018,
            z: deskZ(-3.66),
            opacity: 1,
            renderOrder: 2,
        });
    }

    private addBakedShadowPlane(options: {
        name: string;
        url: string;
        width: number;
        depth: number;
        y: number;
        z: number;
        opacity: number;
        renderOrder: number;
    }) {
        const texture = new THREE.TextureLoader().load(options.url);
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.anisotropy = Math.min(
            8,
            this.renderer.capabilities.getMaxAnisotropy()
        );

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: options.opacity,
            depthWrite: false,
            depthTest: true,
            toneMapped: false,
            side: THREE.DoubleSide,
        });

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(options.width, options.depth),
            material
        );
        plane.name = options.name;
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(0, options.y, options.z);
        plane.castShadow = false;
        plane.receiveShadow = false;
        plane.renderOrder = options.renderOrder;
        this.roomGroup.add(plane);
    }

    private getRoomWarmVoidMaterial() {
        if (!this.roomWarmVoid) return null;
        const material = this.roomWarmVoid.material;
        return material instanceof THREE.MeshBasicMaterial ? material : null;
    }

    private showRoomWarmVoid() {
        const material = this.getRoomWarmVoidMaterial();
        if (!this.roomWarmVoid || !material) return;
        this.roomWarmVoid.visible = true;
        material.opacity = 1;
        material.needsUpdate = true;
    }

    private resetRoomWarmth() {
        this.showRoomWarmVoid();
    }

    private completeRoomWarmth() {
        this.showRoomWarmVoid();
    }

    private addDesk() {
        if (!USE_BAKED_ENVIRONMENT_MODEL) {
            this.loadDeskModel();
        }
        this.loadChairModel();
    }

    private loadDeskModel() {
        const loader = new GLTFLoader();
        loader.load(
            OFFICE_DESK_MODEL_URL,
            (gltf) => {
                const desk = gltf.scene;
                desk.name = 'OfficeDeskModel';
                const removableChildren: THREE.Object3D[] = [];
                desk.traverse((child) => {
                    const name = child.name.toLowerCase();
                    if (name.includes('reviste') || name === 'group_2') {
                        removableChildren.push(child);
                    }
                });
                removableChildren.forEach((child) => child.parent?.remove(child));
                desk.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    materials.forEach((material) => {
                        // SketchUp-style model: many surfaces are single-faced
                        // and vanish when viewed from behind (desk side panel,
                        // shelf planks). Render both sides.
                        material.side = THREE.DoubleSide;
                        if ('envMapIntensity' in material) {
                            material.envMapIntensity = 0.18;
                        }
                        if (material instanceof THREE.MeshStandardMaterial) {
                            if (material.name === 'pal2') {
                                material.color.set(0xc8c0b5);
                                material.roughness = Math.max(material.roughness, 0.74);
                                material.needsUpdate = true;
                            }
                            if (material.name.startsWith('edge_color')) {
                                material.color.set(0x9f9a91);
                                material.roughness = 0.76;
                                material.needsUpdate = true;
                            }
                            if (material.name === 'Color_M01') {
                                material.color.set(0xbdb6ad);
                                material.roughness = 0.78;
                                material.needsUpdate = true;
                            }
                            if (material.name === 'Color_D06') {
                                material.color.set(0xa97843);
                                material.roughness = 0.78;
                                material.needsUpdate = true;
                            }
                        }
                    });
                });

                this.fitModelToBox(desk, {
                    center: new THREE.Vector3(0, 0, deskZ(-3.58)),
                    maxSize: new THREE.Vector3(3.52, 0.92, 1.58),
                    stretch: new THREE.Vector3(1.36, 1, 1.3),
                });
                this.roomGroup.add(desk);
            },
            undefined,
            (error) => {
                console.warn('Office desk model failed to load', error);
            }
        );
    }

    private loadChairModel() {
        const loader = new GLTFLoader();
        loader.load(
            MODERN_CHAIR_MODEL_URL,
            (gltf) => {
                const chair = gltf.scene;
                chair.name = 'ModernErgonomicChairModel';
                chair.rotation.y = Math.PI / 2 + 0.28;
                chair.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;

                    const material = Array.isArray(child.material)
                        ? child.material[0]
                        : child.material;
                    const materialName = material?.name || '';
                    let color = 0x1f2527;
                    let roughness = 0.86;
                    let metalness = 0.02;

                    if (materialName === 'Material.002' || materialName === 'Plane.004__0') {
                        color = 0x66706f;
                        roughness = 0.82;
                    } else if (materialName === '01___Default.001') {
                        color = 0x101416;
                        roughness = 0.7;
                        metalness = 0.08;
                    } else if (materialName === 'Material.003') {
                        color = 0x252c2e;
                        roughness = 0.82;
                    }

                    child.material = new THREE.MeshStandardMaterial({
                        color,
                        roughness,
                        metalness,
                        envMapIntensity: 0.08,
                        side: THREE.DoubleSide,
                    });
                });

                this.fitModelToBox(chair, {
                    center: new THREE.Vector3(0.9, 0, deskZ(-2.42)),
                    maxSize: new THREE.Vector3(0.94, 1.46, 0.94),
                    stretch: new THREE.Vector3(1.12, 1, 1.12),
                });
                this.roomGroup.add(chair);
            },
            undefined,
            (error) => {
                console.warn('Modern chair model failed to load', error);
            }
        );
    }

    private addObjects() {
        this.addComputer();
        this.loadPottedPlantModel();
        this.loadFloorLampModel();
    }

    private loadFloorLampModel() {
        const loader = new GLTFLoader();
        loader.load(
            FLOOR_LAMP_MODEL_URL,
            (gltf) => {
                const floorLamp = new THREE.Group();
                floorLamp.name = 'FloorLampGroup';

                const lampModel = gltf.scene;
                lampModel.name = 'RitaFloorLampModel';
                const removableChildren: THREE.Object3D[] = [];
                lampModel.traverse((child) => {
                    const name = child.name.toLowerCase();
                    const materialNames =
                        child instanceof THREE.Mesh
                            ? (Array.isArray(child.material)
                                  ? child.material
                                  : [child.material]
                              ).map((material) => material.name.toLowerCase())
                            : [];
                    if (
                        name.includes('plane001_floor') ||
                        materialNames.some((materialName) => materialName === 'floor')
                    ) {
                        removableChildren.push(child);
                    }
                });
                removableChildren.forEach((child) => child.parent?.remove(child));

                lampModel.rotation.y = -0.18;
                lampModel.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    materials.forEach((material) => {
                        if ('envMapIntensity' in material) {
                            material.envMapIntensity = 0.2;
                        }
                        if (material instanceof THREE.MeshStandardMaterial) {
                            const name = material.name.toLowerCase();
                            if (name.includes('brass')) {
                                material.color.set(0xb08a48);
                                material.metalness = 0.78;
                                material.roughness = 0.34;
                            } else if (name.includes('lamp_shade')) {
                                material.color.set(0xefe1c8);
                                material.roughness = 0.78;
                                material.metalness = 0.02;
                                material.emissive.set(0xffb766);
                                material.emissiveIntensity = 0.06;
                            } else if (name.includes('light_bulb')) {
                                material.color.set(0xffd8a6);
                                material.emissive.set(0xffb35d);
                                material.emissiveIntensity = 1.35;
                                material.roughness = 0.18;
                                material.metalness = 0;
                            } else if (name.includes('marble')) {
                                material.roughness = Math.max(material.roughness, 0.56);
                                material.metalness = 0.04;
                            }
                        }
                        material.needsUpdate = true;
                    });
                });

                this.fitModelToBox(lampModel, {
                    center: new THREE.Vector3(-2.04, 0, -4.08),
                    maxSize: new THREE.Vector3(0.42, 1.62, 0.42),
                });

                const warmLight = new THREE.PointLight(0xffa94f, 1.72, 4.45, 1.9);
                warmLight.name = 'FloorLampWarmGlow';
                warmLight.position.set(-1.98, 1.28, -4.08);
                warmLight.castShadow = false;

                floorLamp.add(lampModel, warmLight);
                this.placeGroupPivotAtBoundsCenter(floorLamp);
                floorLamp.rotation.y = 0;
                floorLamp.position.set(-1.662, 1.10006, -4.08);
                floorLamp.scale.set(1.55797, 1.55797, 1.55797);
                this.roomGroup.add(floorLamp);
                this.enablePlacementMode(floorLamp, 'floor-lamp');
            },
            undefined,
            (error) => {
                console.warn('Floor lamp model failed to load', error);
            }
        );
    }

    private loadPottedPlantModel() {
        const loader = new GLTFLoader();
        loader.load(
            POTTED_PLANT_MODEL_URL,
            (gltf) => {
                const plant = gltf.scene;
                plant.name = 'PottedPlantModel';
                plant.rotation.y = -0.16;
                plant.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    materials.forEach((material) => {
                        material.side = THREE.DoubleSide;
                        if ('envMapIntensity' in material) {
                            material.envMapIntensity = 0.12;
                        }
                        if (material instanceof THREE.MeshStandardMaterial) {
                            const name = material.name.toLowerCase();
                            if (name.includes('ceramic')) {
                                material.color.set(0xf0eee8);
                                material.roughness = 0.72;
                                material.metalness = 0.02;
                            } else if (name.includes('lambert10')) {
                                material.color.set(0x3a3129);
                                material.roughness = 0.9;
                                material.metalness = 0;
                            } else {
                                material.color.multiplyScalar(0.78);
                                material.roughness = Math.max(material.roughness, 0.74);
                                material.metalness = 0;
                            }
                        }
                        material.needsUpdate = true;
                    });
                });

                plant.position.set(-1.202, 0.92, -4.434);
                plant.scale.set(1.05, 1.05, 1.05);
                this.roomGroup.add(plant);
                this.enablePlacementMode(plant, 'plant');
            },
            undefined,
            (error) => {
                console.warn('Potted plant model failed to load', error);
            }
        );
    }

    private addComputer() {
        this.loadMonitorRaiserModel();
        this.loadMacStudioModel();
        this.loadStudioDisplayModel();
        this.loadKeyboardModel();
        this.loadMouseModel();
        this.loadHomePodMiniModel();
    }

    private loadHomePodMiniModel() {
        const loader = new GLTFLoader();
        loader.load(
            HOMEPOD_MINI_MODEL_URL,
            (gltf) => {
                const homePod = gltf.scene;
                homePod.name = 'HomePodMiniModel';
                homePod.rotation.y = 0.18;
                homePod.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    materials.forEach((material) => {
                        if ('envMapIntensity' in material) {
                            material.envMapIntensity = 0.18;
                        }
                        if (material instanceof THREE.MeshStandardMaterial) {
                            const name = material.name.toLowerCase();
                            if (name.includes('003')) {
                                material.color.set(0x4b4e4d);
                                material.roughness = 0.84;
                                material.metalness = 0.02;
                            } else if (name.includes('002')) {
                                material.color.set(0x24282a);
                                material.roughness = 0.58;
                                material.metalness = 0.04;
                            } else {
                                material.color.set(0x343739);
                                material.roughness = 0.74;
                                material.metalness = 0.03;
                            }
                        }
                        material.needsUpdate = true;
                    });
                });

                homePod.position.set(-0.928, 0.914, -4.43);
                homePod.scale.set(0.045, 0.045, 0.045);
                this.roomGroup.add(homePod);
                this.enablePlacementMode(homePod, 'homepod');
            },
            undefined,
            (error) => {
                console.warn('HomePod mini model failed to load', error);
            }
        );
    }

    private loadMouseModel() {
        const loader = new GLTFLoader();
        loader.load(
            MOUSE_MODEL_URL,
            (gltf) => {
                const mouse = gltf.scene;
                mouse.name = 'MouseModel';
                mouse.rotation.y = -1.4508;
                mouse.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    materials.forEach((material) => {
                        if ('envMapIntensity' in material) {
                            material.envMapIntensity = 0.12;
                        }
                        if (material instanceof THREE.MeshStandardMaterial) {
                            material.roughness = Math.max(material.roughness, 0.48);
                        }
                        material.needsUpdate = true;
                    });
                });

                mouse.position.set(0.45198, 0.93479, -3.8189);
                mouse.scale.set(0.06295, 0.02737, 0.07253);
                this.roomGroup.add(mouse);
                this.enablePlacementMode(mouse, 'mouse');
            },
            undefined,
            (error) => {
                console.warn('Mouse model failed to load', error);
            }
        );
    }

    private loadKeyboardModel() {
        const loader = new GLTFLoader();
        loader.load(
            KEYBOARD_MODEL_URL,
            (gltf) => {
                const keyboard = gltf.scene;
                keyboard.name = 'KeyboardModel';
                keyboard.rotation.y = -0.02;
                keyboard.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    materials.forEach((material) => {
                        if ('envMapIntensity' in material) {
                            material.envMapIntensity = 0.12;
                        }
                        if (material instanceof THREE.MeshStandardMaterial) {
                            material.roughness = Math.max(material.roughness, 0.54);
                        }
                        material.needsUpdate = true;
                    });
                });

                keyboard.position.set(-0.01932, 0.95312, -3.84155);
                keyboard.scale.set(2.46395, 2.46395, 2.46395);
                this.roomGroup.add(keyboard);
                this.enablePlacementMode(keyboard, 'keyboard');
            },
            undefined,
            (error) => {
                console.warn('Keyboard model failed to load', error);
            }
        );
    }

    private loadMacStudioModel() {
        const loader = new GLTFLoader();
        loader.load(
            MAC_STUDIO_MODEL_URL,
            (gltf) => {
                const macStudio = gltf.scene;
                macStudio.name = 'MacStudioModel';
                macStudio.rotation.y = 1.58;
                const logoTexture = new THREE.TextureLoader().load(
                    MAC_STUDIO_LOGO_TEXTURE_URL
                );
                logoTexture.encoding = THREE.sRGBEncoding;
                macStudio.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    const materialNames = materials.map((material) =>
                        material.name.toLowerCase()
                    );
                    child.geometry.computeBoundingBox();
                    const bounds = child.geometry.boundingBox;
                    const size = new THREE.Vector3();
                    bounds?.getSize(size);
                    const isSmallOriginalLogoDecal =
                        materialNames.some((name) => name.includes('botton_black')) &&
                        Math.max(size.x, size.y, size.z) < 0.2;
                    if (child.name === 'Object_18' || isSmallOriginalLogoDecal) {
                        child.visible = false;
                        return;
                    }
                    child.castShadow = false;
                    child.receiveShadow = false;
                    materials.forEach((material) => {
                        if ('envMapIntensity' in material) {
                            material.envMapIntensity = 0.18;
                        }
                        if (material instanceof THREE.MeshStandardMaterial) {
                            const name = material.name.toLowerCase();
                            const isPortMaterial =
                                name.includes('black') || name.includes('botton');
                            if (name.includes('botton_box')) {
                                material.map = null;
                                material.normalMap = null;
                                material.roughnessMap = null;
                                material.metalnessMap = null;
                                material.aoMap = null;
                                material.alphaMap = null;
                                material.bumpMap = null;
                                material.displacementMap = null;
                                material.emissiveMap = null;
                                material.color.set(0x777671);
                                material.roughness = 0.42;
                                material.metalness = 0.48;
                            }
                            if (!isPortMaterial) {
                                material.color.set(0x9f9d98);
                                material.roughness = 0.45;
                                material.metalness = 0.35;
                            } else {
                                material.roughness = Math.max(material.roughness, 0.58);
                            }
                        }
                        material.needsUpdate = true;
                    });
                });

                macStudio.position.set(0.462, 1.04512, -4.25);
                macStudio.scale.set(0.13688, 0.13688, 0.13688);
                const macStudioLogo = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.24, 0.24),
                    new THREE.MeshBasicMaterial({
                        map: logoTexture,
                        transparent: true,
                        opacity: 0.78,
                        depthWrite: false,
                        side: THREE.DoubleSide,
                    })
                );
                macStudioLogo.name = 'MacStudioCleanLogo';
                macStudioLogo.position.set(0, 1.306, 0);
                macStudioLogo.rotation.set(-1.5708, 0, 1.52);
                macStudioLogo.scale.set(2.88526, 2.88526, 2.88526);
                macStudioLogo.renderOrder = 5;
                macStudio.add(macStudioLogo);
                this.riserSetGroup.add(macStudio);
                this.enablePlacementMode(macStudio, 'mac-studio');
                this.enablePlacementMode(macStudioLogo, 'mac-logo');
                this.enablePlacementMode(this.riserSetGroup, 'riser');
            },
            undefined,
            (error) => {
                console.warn('Mac Studio model failed to load', error);
            }
        );
    }

    private loadMonitorRaiserModel() {
        const loader = new GLTFLoader();
        loader.load(
            MONITOR_RAISER_MODEL_URL,
            (gltf) => {
                const raiser = gltf.scene;
                raiser.name = 'WoodMonitorRaiserModel';
                raiser.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    materials.forEach((material) => {
                        if ('envMapIntensity' in material) {
                            material.envMapIntensity = 0.16;
                        }
                        if (material instanceof THREE.MeshStandardMaterial) {
                            material.roughness = Math.max(material.roughness, 0.72);
                            material.metalness = Math.min(material.metalness, 0.04);
                        }
                        material.needsUpdate = true;
                    });
                });

                this.fitModelToBox(raiser, {
                    center: new THREE.Vector3(0, DESK_SURFACE_Y, deskZ(-3.72)),
                    maxSize: new THREE.Vector3(1.36, MONITOR_RAISER_HEIGHT, 0.48),
                    stretch: new THREE.Vector3(1.08, 1, 1),
                });
                this.riserSetGroup.add(raiser);
                this.enablePlacementMode(this.riserSetGroup, 'riser');
            },
            undefined,
            (error) => {
                console.warn('Monitor raiser model failed to load', error);
            }
        );
    }

    private loadStudioDisplayModel() {
        const computer = new THREE.Group();
        computer.name = 'StudioDisplayComputerGroup';
        computer.position.set(0, 0, 0);
        computer.userData.hotspotKey = 'computer';
        const loader = new GLTFLoader();
        loader.load(
            STUDIO_DISPLAY_MODEL_URL,
            (gltf) => {
                const display = gltf.scene;
                display.name = 'StudioDisplayModel';
                display.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    materials.forEach((material) => {
                        material.side = THREE.DoubleSide;
                        if ('envMapIntensity' in material) {
                            material.envMapIntensity = 0.14;
                        }
                        if (material instanceof THREE.MeshStandardMaterial) {
                            material.roughness = Math.max(material.roughness, 0.5);
                            if (material.transparent || material.opacity < 1) {
                                material.depthWrite = false;
                            }
                        }
                        material.needsUpdate = true;
                    });
                });

                this.fitModelToBox(display, {
                    center: new THREE.Vector3(
                        0,
                        DESK_SURFACE_Y + MONITOR_RAISER_HEIGHT,
                        deskZ(-3.86)
                    ),
                    maxSize: new THREE.Vector3(1.08, 0.82, 0.44),
                });

                const screenHitPlane = this.createMonitorScreen(computer, display);

                computer.add(display);
                this.placeGroupPivotAtBoundsCenter(computer);
                computer.rotation.y = 0;
                computer.position.set(0, 1.47, -4.254);
                computer.scale.set(1, 1, 1);
                this.prepareHotspotGroup('computer', computer, [display, screenHitPlane]);
                this.riserSetGroup.add(computer);
                this.enablePlacementMode(computer, 'computer');
                this.enablePlacementMode(this.riserSetGroup, 'riser');
            },
            undefined,
            (error) => {
                console.warn('Studio Display model failed to load', error);
            }
        );
    }

    private placeGroupPivotAtBoundsCenter(group: THREE.Group) {
        group.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(group);
        if (bounds.isEmpty()) return;

        const pivot = bounds.getCenter(new THREE.Vector3());
        group.children.forEach((child) => {
            child.position.sub(pivot);
        });
        group.position.add(pivot);
        group.updateMatrixWorld(true);
    }

    private createMonitorScreen(group: THREE.Group, display: THREE.Object3D) {
        this.resolveStudioDisplayScreenPlane(display);

        const element = this.createMonitorElement();
        const cssObject = new CSS3DObject(element);
        cssObject.name = 'StudioDisplayCssScreen';
        cssObject.position.copy(this.monitorPlanePosition);
        cssObject.quaternion.copy(this.monitorPlaneQuaternion);
        cssObject.scale.set(
            this.monitorPlaneSize.x / MONITOR_CSS_SIZE.x,
            this.monitorPlaneSize.y / MONITOR_CSS_SIZE.y,
            1
        );
        group.add(cssObject);
        this.monitorCssObject = cssObject;
        this.monitorElement = element;

        const occlusionMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.NoBlending,
            toneMapped: false,
        });
        occlusionMaterial.depthWrite = true;
        const occlusionPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(this.monitorPlaneSize.x, this.monitorPlaneSize.y),
            occlusionMaterial
        );
        occlusionPlane.name = 'StudioDisplayScreenOcclusionPlane';
        occlusionPlane.position.copy(this.monitorPlanePosition);
        occlusionPlane.quaternion.copy(this.monitorPlaneQuaternion);
        occlusionPlane.renderOrder = 4;
        group.add(occlusionPlane);

        this.createStudioDisplayGlassLayer(group);
        this.createMonitorDimmingLayer(group);

        return occlusionPlane;
    }

    private resolveStudioDisplayScreenPlane(display: THREE.Object3D) {
        display.updateMatrixWorld(true);
        const screenMesh =
            display.getObjectByName(STUDIO_DISPLAY_SCREEN_MESH) ||
            this.findLikelyStudioDisplayScreen(display);

        if (!screenMesh) {
            this.useFallbackMonitorPlane();
            return;
        }

        if (!(screenMesh instanceof THREE.Mesh)) {
            this.resolveStudioDisplayScreenPlaneFromBox(screenMesh);
            return;
        }

        const geometry = screenMesh.geometry;
        const position = geometry.getAttribute('position');
        if (!position || position.count < 4) {
            this.resolveStudioDisplayScreenPlaneFromBox(screenMesh);
            return;
        }

        const points: THREE.Vector3[] = [];
        for (let index = 0; index < position.count; index += 1) {
            const point = new THREE.Vector3()
                .fromBufferAttribute(position, index)
                .applyMatrix4(screenMesh.matrixWorld);
            if (!points.some((existing) => existing.distanceToSquared(point) < 0.00000001)) {
                points.push(point);
            }
        }

        if (points.length < 4) {
            this.resolveStudioDisplayScreenPlaneFromBox(screenMesh);
            return;
        }

        const half = Math.floor(points.length / 2);
        const average = (items: THREE.Vector3[]) =>
            items
                .reduce((sum, point) => sum.add(point), new THREE.Vector3())
                .multiplyScalar(1 / Math.max(items.length, 1));

        const byX = [...points].sort((a, b) => a.x - b.x);
        const byY = [...points].sort((a, b) => a.y - b.y);
        const leftCenter = average(byX.slice(0, half));
        const rightCenter = average(byX.slice(-half));
        const bottomCenter = average(byY.slice(0, half));
        const topCenter = average(byY.slice(-half));

        const horizontal = rightCenter.clone().sub(leftCenter);
        const vertical = topCenter.clone().sub(bottomCenter);
        const width = horizontal.length();
        const height = vertical.length();
        if (width < 0.1 || height < 0.1) {
            this.resolveStudioDisplayScreenPlaneFromBox(screenMesh);
            return;
        }

        const xAxis = horizontal.clone().normalize();
        const roughYAxis = vertical.clone().normalize();
        const normal = new THREE.Vector3().crossVectors(xAxis, roughYAxis).normalize();
        if (normal.z < 0) {
            normal.negate();
        }
        const yAxis = new THREE.Vector3().crossVectors(normal, xAxis).normalize();
        const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, normal);
        const center = average(points)
            .addScaledVector(yAxis, height * STUDIO_DISPLAY_SCREEN_VERTICAL_OFFSET)
            .addScaledVector(normal, STUDIO_DISPLAY_SCREEN_SURFACE_OFFSET);

        this.monitorPlaneSize.set(
            width * STUDIO_DISPLAY_SCREEN_SCALE.x,
            height * STUDIO_DISPLAY_SCREEN_SCALE.y
        );
        this.monitorPlanePosition.copy(center);
        this.monitorPlaneQuaternion.setFromRotationMatrix(basis);
        this.monitorPlaneNormal.copy(normal);
    }

    private resolveStudioDisplayScreenPlaneFromBox(screenMesh: THREE.Object3D) {
        const box = new THREE.Box3().setFromObject(screenMesh);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        this.monitorPlaneSize.set(
            size.x * STUDIO_DISPLAY_SCREEN_SCALE.x,
            size.y * STUDIO_DISPLAY_SCREEN_SCALE.y
        );
        this.monitorPlanePosition.set(
            center.x,
            center.y + size.y * STUDIO_DISPLAY_SCREEN_VERTICAL_OFFSET,
            box.max.z + STUDIO_DISPLAY_SCREEN_SURFACE_OFFSET
        );
        this.monitorPlaneQuaternion.identity();
        this.monitorPlaneNormal.copy(MONITOR_NORMAL);
    }

    private useFallbackMonitorPlane() {
        this.monitorPlanePosition.copy(FALLBACK_MONITOR_POSITION);
        this.monitorPlaneSize.copy(FALLBACK_MONITOR_WORLD_SIZE);
        this.monitorPlaneQuaternion.identity();
        this.monitorPlaneNormal.copy(MONITOR_NORMAL);
    }

    private findLikelyStudioDisplayScreen(display: THREE.Object3D) {
        let best: THREE.Object3D | null = null;
        let bestScore = -Infinity;

        display.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            const box = new THREE.Box3().setFromObject(child);
            const size = box.getSize(new THREE.Vector3());
            const aspect = size.x / Math.max(size.y, 0.0001);
            const area = size.x * size.y;
            const score =
                area -
                Math.abs(aspect - 16 / 9) * 0.12 -
                Math.max(0, size.z - 0.09) * 0.5;
            if (score > bestScore && size.x > 0.45 && size.y > 0.24) {
                best = child;
                bestScore = score;
            }
        });

        return best;
    }

    private createMonitorElement() {
        const container = document.createElement('div');
        container.className = 'v2-monitor-screen';
        container.style.width = `${MONITOR_CSS_SIZE.x}px`;
        container.style.height = `${MONITOR_CSS_SIZE.y}px`;

        const fallback = document.createElement('div');
        fallback.className = 'v2-monitor-fallback';
        fallback.setAttribute('aria-hidden', 'true');

        const iframe = document.createElement('iframe');
        iframe.src = '/os/';
        iframe.title = 'JianweiOS';
        iframe.id = 'computer-screen';
        iframe.className = 'v2-monitor-iframe';
        iframe.frameBorder = '0';
        iframe.addEventListener('load', () => {
            iframe.classList.add('is-loaded');
        });
        this.monitorIframe = iframe;

        container.appendChild(fallback);
        container.appendChild(iframe);
        return container;
    }

    private createStudioDisplayGlassLayer(group: THREE.Group) {
        const texture = this.makeStudioDisplayGlassTexture();
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            blending: THREE.NormalBlending,
            opacity: 0,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false,
        });
        this.monitorGlassMaterial = material;
        const layer = this.createMonitorLayer('StudioDisplayLaminatedGlass', material, 0.0016);
        group.add(layer);
    }

    private makeStudioDisplayGlassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 576;
        const context = canvas.getContext('2d');
        if (!context) {
            return new THREE.CanvasTexture(canvas);
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        const topGlow = context.createLinearGradient(0, 0, 0, canvas.height);
        topGlow.addColorStop(0, 'rgba(255,255,255,0.026)');
        topGlow.addColorStop(0.08, 'rgba(255,255,255,0.012)');
        topGlow.addColorStop(0.24, 'rgba(255,255,255,0)');
        context.fillStyle = topGlow;
        context.fillRect(0, 0, canvas.width, canvas.height);

        const diagonalSheen = context.createLinearGradient(
            canvas.width * 0.36,
            0,
            canvas.width * 0.78,
            canvas.height
        );
        diagonalSheen.addColorStop(0, 'rgba(255,255,255,0)');
        diagonalSheen.addColorStop(0.54, 'rgba(255,255,255,0)');
        diagonalSheen.addColorStop(0.6, 'rgba(255,255,255,0.006)');
        diagonalSheen.addColorStop(0.66, 'rgba(255,255,255,0)');
        diagonalSheen.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = diagonalSheen;
        context.fillRect(0, 0, canvas.width, canvas.height);

        const edgeShadow = context.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            canvas.width * 0.34,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width * 0.74
        );
        edgeShadow.addColorStop(0, 'rgba(0,0,0,0)');
        edgeShadow.addColorStop(0.84, 'rgba(0,0,0,0.008)');
        edgeShadow.addColorStop(1, 'rgba(0,0,0,0.05)');
        context.fillStyle = edgeShadow;
        context.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
    }

    private createMonitorDimmingLayer(group: THREE.Group) {
        const material = new THREE.MeshBasicMaterial({
            color: 0x020607,
            opacity: 0,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false,
        });
        this.monitorDimmingMaterial = material;
        const layer = this.createMonitorLayer('StudioDisplayPerspectiveDimmer', material, 0.0022);
        layer.renderOrder = 12;
        group.add(layer);
    }

    private createMonitorLayer(
        name: string,
        material: THREE.MeshBasicMaterial,
        offset: number
    ) {
        const layer = new THREE.Mesh(
            new THREE.PlaneGeometry(this.monitorPlaneSize.x, this.monitorPlaneSize.y),
            material
        );
        layer.name = name;
        layer.position.copy(this.monitorPlanePosition);
        layer.position.addScaledVector(this.monitorPlaneNormal, offset);
        layer.quaternion.copy(this.monitorPlaneQuaternion);
        layer.renderOrder = 8;
        return layer;
    }

    private addPhotoStack() {
        const group = new THREE.Group();
        group.userData.hotspotKey = 'gallery';

        const paperMat = new THREE.MeshStandardMaterial({
            color: 0xfdfbf7,
            roughness: 0.84,
        });
        const photoMat = new THREE.MeshStandardMaterial({
            color: 0xf4efe6,
            roughness: 0.65,
            map: this.makePhotoTexture(),
        });

        for (let i = 0; i < 5; i++) {
            const card = this.box(
                [0.48, 0.012, 0.34],
                [-1.02 + i * 0.006, DESK_SURFACE_Y + 0.012 + i * 0.012, deskZ(-3.42 - i * 0.004)],
                i === 4 ? photoMat : paperMat,
                true
            );
            card.rotation.y = -0.08;
            card.rotation.z = 0.035;
            group.add(card);
        }

        this.prepareHotspotGroup('gallery', group, Array.from(group.children));
        this.roomGroup.add(group);
    }

    private addGameObject() {
        const group = new THREE.Group();
        group.userData.hotspotKey = 'game-log';

        const controllerMat = new THREE.MeshStandardMaterial({
            color: 0x24292c,
            roughness: 0.58,
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xb9f4ed,
            roughness: 0.3,
            emissive: 0x59d5ce,
            emissiveIntensity: 0.24,
        });
        const body = this.box([0.44, 0.08, 0.22], [1.04, DESK_SURFACE_Y + 0.04, deskZ(-3.42)], controllerMat, true);
        body.rotation.y = 0.1;
        const leftGrip = new THREE.Mesh(new THREE.SphereGeometry(0.095, 24, 12), controllerMat);
        leftGrip.scale.set(0.86, 0.42, 1.05);
        leftGrip.position.set(0.83, DESK_SURFACE_Y + 0.04, deskZ(-3.41));
        const rightGrip = leftGrip.clone();
        rightGrip.position.x = 1.25;
        const buttonA = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 20), accentMat);
        buttonA.position.set(1.16, DESK_SURFACE_Y + 0.09, deskZ(-3.34));
        const buttonB = buttonA.clone();
        buttonB.position.set(1.23, DESK_SURFACE_Y + 0.09, deskZ(-3.37));
        [leftGrip, rightGrip, buttonA, buttonB].forEach((mesh) => {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
        });
        group.add(body, leftGrip, rightGrip, buttonA, buttonB);

        this.prepareHotspotGroup('game-log', group, Array.from(group.children));
        this.roomGroup.add(group);
    }

    private addJourneyMap() {
        const group = new THREE.Group();
        group.userData.hotspotKey = 'journey';

        const mapTexture = this.makeMapTexture();
        const mapMat = new THREE.MeshStandardMaterial({
            color: 0xf7f0de,
            roughness: 0.76,
            map: mapTexture,
        });
        const map = this.box([0.58, 0.01, 0.38], [-1.0, DESK_SURFACE_Y + 0.012, deskZ(-3.12)], mapMat, true);
        map.rotation.y = 0.26;
        map.rotation.z = -0.12;

        const foldMat = new THREE.MeshStandardMaterial({
            color: 0xe9dcc3,
            roughness: 0.82,
        });
        const fold = this.box([0.012, 0.012, 0.38], [-1.0, DESK_SURFACE_Y + 0.02, deskZ(-3.12)], foldMat, true);
        fold.rotation.y = 0.26;
        fold.rotation.z = -0.12;
        group.add(map, fold);

        this.prepareHotspotGroup('journey', group, [map, fold]);
        this.roomGroup.add(group);
    }

    private prepareHotspotGroup(key: HotspotKey, group: THREE.Group, objects: THREE.Object3D[]) {
        this.hotspotGroups.set(key, group);
        objects.forEach((object) => {
            object.userData.hotspotKey = key;
            this.hotspotObjects.push(object);
            object.traverse((child) => {
                child.userData.hotspotKey = key;
                if (child instanceof THREE.Mesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                }
            });
        });
    }

    private addEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (event) => this.onPointerMove(event));
        window.addEventListener('click', () => this.onClick());
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));
        window.addEventListener('popstate', () => {
            if (this.focusedKey) this.returnToRoom(false);
        });
    }

    private onPointerMove(event: MouseEvent) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.labelEl.style.left = `${event.clientX}px`;
        this.labelEl.style.top = `${event.clientY}px`;
    }

    private onClick() {
        if (this.placementMode) return;
        if (this.state === 'door-opening' || this.state === 'returning-room') return;

        if (this.state === 'focus-computer' && this.focusedKey === 'computer') {
            this.returnToRoom();
            return;
        }

        const hit = this.getIntersectedHotspot();
        if (!hit) return;
        if (hit === 'door' && this.state === 'entry-door') {
            this.openDoor();
            return;
        }
        if (
            this.state === 'room-idle' &&
            hit !== 'door' &&
            !this.freeOrbitEnabled
        ) {
            this.focusObject(hit);
        }
    }

    private onKeyDown(event: KeyboardEvent) {
        if (this.handlePlacementKey(event)) return;
        this.playMonitorKeyboardSound(event);

        // Escape always leaves the focused view; every other key belongs to
        // the OS while its screen is interactive, so forward it into the
        // iframe (the CSS3D-transformed frame never receives real focus, so
        // its own keydown listeners never fire otherwise).
        if (event.key !== 'Escape' && this.forwardMonitorKeyboardEvent(event)) {
            event.preventDefault();
            return;
        }

        if (
            this.state === 'entry-door' &&
            this.doorReady &&
            (event.key === 'Enter' || event.key === ' ')
        ) {
            this.openDoor();
        }
        if (event.key === 'Escape' && this.focusedKey) {
            this.returnToRoom();
        }
    }

    private onKeyUp(event: KeyboardEvent) {
        if (event.key !== 'Escape' && this.forwardMonitorKeyboardEvent(event)) {
            event.preventDefault();
        }
    }

    private forwardMonitorKeyboardEvent(event: KeyboardEvent) {
        if (
            !this.monitorIframe?.contentDocument ||
            !this.monitorIframe.contentWindow ||
            !this.monitorInputProxyEl.classList.contains('is-visible')
        ) {
            return false;
        }

        const iframeDocument = this.monitorIframe.contentDocument;
        const target =
            iframeDocument.activeElement ||
            iframeDocument.body ||
            iframeDocument.documentElement;
        if (!target) return false;

        target.dispatchEvent(
            new KeyboardEvent(event.type, {
                bubbles: true,
                cancelable: true,
                view: this.monitorIframe.contentWindow,
                key: event.key,
                code: event.code,
                location: event.location,
                repeat: event.repeat,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey,
            })
        );
        return true;
    }

    private enablePlacementMode(target: THREE.Object3D, key: PlacementKey) {
        if (!this.placementMode || this.placementKey !== key) return;
        if (this.placementTarget === target) return;

        this.placementTarget = target;
        this.activatePlacementView();
        this.createPlacementPanel();
        this.updatePlacementPanel(`${this.getPlacementLabel()} placement mode ready`);
    }

    private activatePlacementView() {
        if (!this.placementTarget) return;

        this.state = 'room-idle';
        this.focusedKey = null;
        this.roomGroup.visible = true;
        this.completeRoomWarmth();
        this.portalPreviewGroup.visible = false;
        this.portalStencil.visible = false;
        this.portalSurface.visible = false;
        this.hideEntryDoorImmediately();
        this.setPortalPreviewMode(false);
        this.setRoomPortalMode(false);
        this.setHovered(null);
        this.setHint('');

        this.scene.updateMatrixWorld(true);
        const targetPosition = this.getPlacementFocusPosition();
        this.camera.position.copy(CAMERA_POSES.room.position);
        this.cameraTarget.copy(targetPosition);
        this.camera.lookAt(this.cameraTarget);
        this.orbitControls.target.copy(targetPosition);
        this.orbitControls.object.position.copy(this.camera.position);
        this.setFreeOrbitEnabled(true);
        this.orbitControls.update();
    }

    private getPlacementFocusPosition() {
        const targetPosition = new THREE.Vector3();
        if (this.placementKey === 'riser' || this.placementKey === 'floor-lamp') {
            const target =
                this.placementKey === 'riser'
                    ? this.riserSetGroup
                    : this.placementTarget;
            target?.updateMatrixWorld(true);
            const bounds = target
                ? new THREE.Box3().setFromObject(target)
                : new THREE.Box3();
            if (!bounds.isEmpty()) {
                return bounds.getCenter(targetPosition);
            }
        }
        this.placementTarget?.getWorldPosition(targetPosition);
        return targetPosition;
    }

    private createPlacementPanel() {
        if (this.placementPanelEl) return;

        const panel = document.createElement('div');
        panel.className = 'v2-placement-panel';
        panel.innerHTML = `
            <div class="v2-placement-title">${this.getPlacementLabel()} Placement</div>
            <div class="v2-placement-help">
                Drag: orbit view<br>
                Arrow keys: move on desk<br>
                R/F: height<br>
                Q/E: ${this.getPlacementRotateHelp()}<br>
                -/=: scale<br>
                Shift: fine step, Option: large step<br>
                C: copy values
            </div>
        `;

        const status = document.createElement('div');
        status.className = 'v2-placement-status';

        const code = document.createElement('pre');
        code.className = 'v2-placement-code';

        panel.appendChild(status);
        panel.appendChild(code);
        this.uiContainer.appendChild(panel);

        this.placementPanelEl = panel;
        this.placementStatusEl = status;
        this.placementCodeEl = code;
    }

    private handlePlacementKey(event: KeyboardEvent) {
        if (!this.placementMode || !this.placementTarget) return false;
        const target = event.target as HTMLElement | null;
        const tagName = target?.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
            return false;
        }

        const moveStep = event.shiftKey ? 0.004 : event.altKey ? 0.05 : 0.018;
        const heightStep = event.shiftKey ? 0.002 : event.altKey ? 0.025 : 0.008;
        const rotateStep = event.shiftKey ? 0.01 : event.altKey ? 0.14 : 0.04;
        const scaleStep = event.shiftKey ? 0.01 : event.altKey ? 0.08 : 0.03;
        const object = this.placementTarget;
        let handled = true;
        let status = '';

        switch (event.key) {
            case 'ArrowLeft':
                object.position.x -= moveStep;
                status = 'Moved left';
                break;
            case 'ArrowRight':
                object.position.x += moveStep;
                status = 'Moved right';
                break;
            case 'ArrowUp':
                object.position.z -= moveStep;
                status = 'Moved toward monitor';
                break;
            case 'ArrowDown':
                object.position.z += moveStep;
                status = 'Moved toward chair';
                break;
            case 'PageUp':
            case 'r':
            case 'R':
                object.position.y += heightStep;
                status = 'Raised';
                break;
            case 'PageDown':
            case 'f':
            case 'F':
                object.position.y -= heightStep;
                status = 'Lowered';
                break;
            case 'q':
            case 'Q':
                if (this.placementKey === 'riser') {
                    status = 'Riser set rotation is locked';
                    break;
                }
                this.rotatePlacementTarget(rotateStep);
                status =
                    this.placementKey === 'mac-logo'
                        ? 'Rotated on logo plane'
                        : 'Rotated left';
                break;
            case 'e':
            case 'E':
                if (this.placementKey === 'riser') {
                    status = 'Riser set rotation is locked';
                    break;
                }
                this.rotatePlacementTarget(-rotateStep);
                status =
                    this.placementKey === 'mac-logo'
                        ? 'Rotated on logo plane'
                        : 'Rotated right';
                break;
            case '-':
            case '_':
                if (this.placementKey === 'riser') {
                    status = 'Riser set scale is locked';
                    break;
                }
                object.scale.multiplyScalar(Math.max(0.2, 1 - scaleStep));
                status = 'Scaled down';
                break;
            case '=':
            case '+':
                if (this.placementKey === 'riser') {
                    status = 'Riser set scale is locked';
                    break;
                }
                object.scale.multiplyScalar(1 + scaleStep);
                status = 'Scaled up';
                break;
            case 'c':
            case 'C':
                this.copyPlacementCode();
                status = 'Copied placement code';
                break;
            default:
                handled = false;
        }

        if (!handled) return false;
        event.preventDefault();
        event.stopPropagation();
        this.updatePlacementPanel(status);
        return true;
    }

    private rotatePlacementTarget(delta: number) {
        if (!this.placementTarget) return;
        if (this.placementKey === 'mac-logo') {
            this.placementTarget.rotation.z += delta;
            return;
        }
        this.placementTarget.rotation.y += delta;
    }

    private updatePlacementPanel(status = '') {
        if (!this.placementTarget || !this.placementCodeEl) return;

        if (this.placementStatusEl) {
            this.placementStatusEl.textContent = status;
        }
        this.placementCodeEl.textContent = this.getPlacementCode();
    }

    private getPlacementCode() {
        if (!this.placementTarget) return '';
        const object = this.placementTarget;
        const position = object.position;
        const rotation = object.rotation;
        const scale = object.scale;
        const key = this.getPlacementCodeName();
        if (this.placementKey === 'riser') {
            return [
                `${key}.position.set(${this.formatPlacementNumber(position.x)}, ${this.formatPlacementNumber(position.y)}, ${this.formatPlacementNumber(position.z)});`,
            ].join('\n');
        }
        if (this.placementKey === 'mac-logo') {
            return [
                `${key}.position.set(${this.formatPlacementNumber(position.x)}, ${this.formatPlacementNumber(position.y)}, ${this.formatPlacementNumber(position.z)});`,
                `${key}.rotation.set(${this.formatPlacementNumber(rotation.x)}, ${this.formatPlacementNumber(rotation.y)}, ${this.formatPlacementNumber(rotation.z)});`,
                `${key}.scale.set(${this.formatPlacementNumber(scale.x)}, ${this.formatPlacementNumber(scale.y)}, ${this.formatPlacementNumber(scale.z)});`,
            ].join('\n');
        }
        return [
            `${key}.rotation.y = ${this.formatPlacementNumber(object.rotation.y)};`,
            `${key}.position.set(${this.formatPlacementNumber(position.x)}, ${this.formatPlacementNumber(position.y)}, ${this.formatPlacementNumber(position.z)});`,
            `${key}.scale.set(${this.formatPlacementNumber(scale.x)}, ${this.formatPlacementNumber(scale.y)}, ${this.formatPlacementNumber(scale.z)});`,
        ].join('\n');
    }

    private getPlacementLabel() {
        if (this.placementKey === 'computer') return 'Computer';
        if (this.placementKey === 'keyboard') return 'Keyboard';
        if (this.placementKey === 'mac-studio') return 'Mac Studio';
        if (this.placementKey === 'mac-logo') return 'Mac Studio Logo';
        if (this.placementKey === 'homepod') return 'HomePod mini';
        if (this.placementKey === 'plant') return 'Potted Plant';
        if (this.placementKey === 'riser') return 'Riser Set';
        if (this.placementKey === 'floor-lamp') return 'Floor Lamp';
        return 'Mouse';
    }

    private getPlacementRotateHelp() {
        if (this.placementKey === 'riser') return 'locked for grouped move';
        return this.placementKey === 'mac-logo'
            ? 'rotate logo on top surface'
            : 'rotate';
    }

    private getPlacementCodeName() {
        if (this.placementKey === 'computer') return 'computer';
        if (this.placementKey === 'keyboard') return 'keyboard';
        if (this.placementKey === 'mac-studio') return 'macStudio';
        if (this.placementKey === 'mac-logo') return 'macStudioLogo';
        if (this.placementKey === 'homepod') return 'homePod';
        if (this.placementKey === 'plant') return 'plant';
        if (this.placementKey === 'riser') return 'riserSet';
        if (this.placementKey === 'floor-lamp') return 'floorLamp';
        return 'mouse';
    }

    private copyPlacementCode() {
        const code = this.getPlacementCode();
        if (!code || !navigator.clipboard) return;
        navigator.clipboard.writeText(code).catch(() => {
            if (this.placementStatusEl) {
                this.placementStatusEl.textContent = 'Copy failed; select the code manually';
            }
        });
    }

    private formatPlacementNumber(value: number) {
        return Number(value.toFixed(5)).toString();
    }

    private openDoor() {
        if (!this.doorReady) return;
        this.state = 'door-opening';
        this.doorTravelProgress = 0;
        this.playDoorOpenSound();
        this.resetEntryDoorFade();
        this.resetRoomWarmth();
        this.setHovered(null);
        this.setHint('');
        this.portalPreviewGroup.visible = false;
        this.roomGroup.visible = true;
        this.portalStencil.visible = false;
        this.portalStencil.visible = true;
        this.portalSurface.visible = false;
        this.setPortalPreviewMode(false);
        this.setRoomPortalMode(false);
        this.portalFullscreenActive = false;
        this.portalReleased = false;
        const doorDuration = REDUCED_MOTION ? 1 : 2100;
        const cameraDuration = REDUCED_MOTION ? 1 : 4700;
        const cameraStartDelay = REDUCED_MOTION ? 0 : 320;

        const openAngle =
            this.doorPivot.position.x > 0 ? -Math.PI * 0.55 : Math.PI * 0.55;

        new TWEEN.Tween(this.doorPivot.rotation)
            .to({ y: openAngle }, doorDuration)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        if (this.doorFloorPoolMaterial) {
            const poolState = {
                opacity: this.doorFloorPoolMaterial.opacity,
            };
            new TWEEN.Tween(poolState)
                .to({ opacity: 1 }, doorDuration)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(() => {
                    if (!this.doorFloorPoolMaterial) return;
                    this.doorFloorPoolMaterial.opacity = poolState.opacity;
                    this.doorFloorPoolMaterial.userData.entryBaseOpacity =
                        poolState.opacity;
                })
                .start();
        }

        // Preserve a restrained contact shadow after the leaf swings open so
        // the freestanding frame remains grounded in the void. The portal
        // compositor draws it once across both sides of the threshold below.
        if (this.doorBakedShadowMaterial) {
            const shadowState = {
                opacity: this.doorBakedShadowMaterial.opacity,
            };
            new TWEEN.Tween(shadowState)
                .to(
                    { opacity: DOOR_BAKED_SHADOW_OPEN_OPACITY },
                    REDUCED_MOTION ? 1 : DOOR_BAKED_SHADOW_FADE_DURATION
                )
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate(() => {
                    if (!this.doorBakedShadowMaterial) return;
                    this.doorBakedShadowMaterial.opacity = shadowState.opacity;
                    // setEntryDoorOpacity() runs again when the doorway fades;
                    // keep its cached base in sync so it cannot restore 0.45.
                    this.doorBakedShadowMaterial.userData.entryBaseOpacity =
                        shadowState.opacity;
                })
                .start();
        }

        window.setTimeout(
            () => {
                this.moveCameraThroughDoor(cameraDuration, () => {
                    this.setHovered(null);
                    this.hoverPausedUntil = performance.now() + 450;
                    this.beginRoomOrbit();
                    this.state = 'room-idle';
                    this.setHint('');
                    this.fadeEntryDoorAfterCameraSettles();
                });
            },
            cameraStartDelay
        );
    }

    private focusObject(key: HotspotKey) {
        if (key === 'door') return;
        const config = HOTSPOTS[key as Exclude<HotspotKey, 'door'>];
        if (!config.camera || !config.target || !config.focusState) return;
        this.setFreeOrbitEnabled(false);
        this.focusedKey = key;
        this.state = config.focusState;
        this.setHovered(null);
        this.setHotspotEmphasis(key, true);
        if (key === 'computer') {
            this.hidePanel();
        } else {
            this.showPanel(config);
        }
        this.backButtonEl.classList.toggle('is-visible', key !== 'computer');
        window.history.pushState({ roomFocus: key }, '', `#${key}`);
        const focusPose =
            key === 'computer'
                ? this.getComputerFocusPose() || {
                      position: config.camera,
                      target: config.target,
                  }
                : {
                      position: config.camera,
                      target: config.target,
                  };
        this.moveCamera(
            focusPose,
            REDUCED_MOTION ? 1 : 1300
        );
    }

    private getComputerFocusPose(): CameraPose | null {
        if (!this.monitorCssObject) return null;

        this.monitorCssObject.updateMatrixWorld(true);

        const center = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        this.monitorCssObject.getWorldPosition(center);
        this.monitorCssObject.getWorldQuaternion(quaternion);
        this.monitorCssObject.getWorldScale(scale);

        const normal = MONITOR_NORMAL.clone()
            .applyQuaternion(quaternion)
            .normalize();
        const screenWidth = MONITOR_CSS_SIZE.x * Math.abs(scale.x);
        const screenHeight = MONITOR_CSS_SIZE.y * Math.abs(scale.y);
        const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
        const horizontalFov =
            2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);

        const framedWidth = screenWidth * 1.12;
        const framedHeight = screenHeight * 1.18;
        const distanceForWidth =
            framedWidth / (2 * Math.tan(horizontalFov / 2) * 0.88);
        const distanceForHeight =
            framedHeight / (2 * Math.tan(verticalFov / 2) * 0.88);
        const distance = THREE.MathUtils.clamp(
            Math.max(distanceForWidth, distanceForHeight),
            1.05,
            2.4
        );

        return {
            position: center.clone().addScaledVector(normal, distance),
            target: center,
        };
    }

    private returnToRoom(updateHistory = true) {
        if (!this.focusedKey) return;
        this.setFreeOrbitEnabled(false);
        this.state = 'returning-room';
        this.setHotspotEmphasis(this.focusedKey, false);
        this.focusedKey = null;
        this.hidePanel();
        this.backButtonEl.classList.remove('is-visible');
        if (updateHistory && window.location.hash) {
            window.history.pushState({}, '', window.location.pathname + window.location.search);
        }
        this.moveCamera(CAMERA_POSES.room, REDUCED_MOTION ? 1 : 1100, () => {
            this.beginRoomOrbit();
            this.state = 'room-idle';
        });
    }

    private moveCamera(
        pose: CameraPose,
        duration: number,
        onComplete?: () => void,
        easing: (amount: number) => number = TWEEN.Easing.Quintic.InOut
    ) {
        const startPosition = this.camera.position.clone();
        const startTarget = this.cameraTarget.clone();
        const tweenState = {
            positionX: startPosition.x,
            positionY: startPosition.y,
            positionZ: startPosition.z,
            targetX: startTarget.x,
            targetY: startTarget.y,
            targetZ: startTarget.z,
        };

        new TWEEN.Tween(tweenState)
            .to(
                {
                    positionX: pose.position.x,
                    positionY: pose.position.y,
                    positionZ: pose.position.z,
                    targetX: pose.target.x,
                    targetY: pose.target.y,
                    targetZ: pose.target.z,
                },
                duration
            )
            .easing(easing)
            .onUpdate(() => {
                this.camera.position.set(
                    tweenState.positionX,
                    tweenState.positionY,
                    tweenState.positionZ
                );
                this.cameraTarget.set(
                    tweenState.targetX,
                    tweenState.targetY,
                    tweenState.targetZ
                );
            })
            .onComplete(() => {
                this.camera.position.copy(pose.position);
                this.cameraTarget.copy(pose.target);
                if (onComplete) onComplete();
            })
            .start();
    }

    private moveCameraLocked(
        pose: CameraPose,
        duration: number,
        onComplete?: () => void,
        easing: (amount: number) => number = TWEEN.Easing.Quartic.Out
    ) {
        const startPosition = this.camera.position.clone();
        const startTarget = this.cameraTarget.clone();
        const progress = { value: 0 };
        let finished = false;
        let tween: { stop: () => void } | null = null;

        const finish = () => {
            if (finished) return;
            finished = true;
            this.camera.position.copy(pose.position);
            this.cameraTarget.copy(pose.target);
            this.camera.lookAt(this.cameraTarget);
            if (tween) tween.stop();
            if (onComplete) onComplete();
        };

        tween = new TWEEN.Tween(progress)
            .to({ value: 1 }, duration)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(() => {
                if (finished) return;
                if (progress.value >= ENTRY_INTRO_SNAP_PROGRESS) {
                    finish();
                    return;
                }

                const eased = easing(progress.value);
                this.camera.position.lerpVectors(startPosition, pose.position, eased);
                this.cameraTarget.lerpVectors(startTarget, pose.target, eased);
            })
            .onComplete(finish)
            .start();
    }

    private moveCameraThroughDoor(duration: number, onComplete?: () => void) {
        const startPosition = this.camera.position.clone();
        const startTarget = this.cameraTarget.clone();
        const roomPosition = CAMERA_POSES.room.position.clone();
        const roomTarget = CAMERA_POSES.room.target.clone();
        const positionCurve = new THREE.CatmullRomCurve3(
            [
                startPosition,
                new THREE.Vector3(0, 1.62, 3.12),
                new THREE.Vector3(0.012, 1.63, 1.58),
                new THREE.Vector3(0.006, 1.65, 0.24),
                new THREE.Vector3(0, 1.72, -0.52),
                roomPoint(0, 1.84, -0.32),
                roomPosition,
            ],
            false,
            'centripetal'
        );
        const targetCurve = new THREE.CatmullRomCurve3(
            [
                startTarget,
                new THREE.Vector3(0, 1.43, -0.24),
                new THREE.Vector3(0, 1.33, -0.98),
                new THREE.Vector3(0, 1.16, -2.04),
                roomPoint(0, 1.02, -2.82),
                roomTarget,
            ],
            false,
            'centripetal'
        );
        positionCurve.arcLengthDivisions = 260;
        targetCurve.arcLengthDivisions = 260;
        positionCurve.updateArcLengths();
        targetCurve.updateArcLengths();
        const progress = { value: 0 };
        let portalReleased = false;
        let entrySoundPlayed = false;
        const releaseAt = THRESHOLD_SWITCH_PROGRESS;
        const playEntrySoundOnce = () => {
            if (entrySoundPlayed) return;
            entrySoundPlayed = true;
            this.playThresholdCrossingSound();
            this.playRoomArrivalSound();
        };

        new TWEEN.Tween(progress)
            .to({ value: 1 }, duration)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(() => {
                const value = smootherStep(progress.value);
                this.doorTravelProgress = value;

                this.camera.position.copy(positionCurve.getPointAt(value));
                this.cameraTarget.copy(targetCurve.getPointAt(value));

                if (this.camera.position.z <= PORTAL_CROSSING_POSITION.z) {
                    playEntrySoundOnce();
                }

                if (value >= releaseAt) {
                    if (!portalReleased) {
                        playEntrySoundOnce();
                        this.portalStencil.visible = false;
                        this.portalSurface.visible = false;
                        this.setPortalPreviewMode(false);
                        this.portalPreviewGroup.visible = false;
                        this.roomGroup.visible = true;
                        this.completeRoomWarmth();
                        this.setRoomPortalMode(false);
                        this.portalFullscreenActive = false;
                        this.portalReleased = true;
                        portalReleased = true;
                    }
                }
            })
            .onComplete(() => {
                playEntrySoundOnce();
                this.portalStencil.visible = false;
                this.portalSurface.visible = false;
                this.setPortalPreviewMode(false);
                this.portalPreviewGroup.visible = false;
                this.roomGroup.visible = true;
                this.completeRoomWarmth();
                this.setRoomPortalMode(false);
                this.portalFullscreenActive = false;
                this.portalReleased = true;
                this.doorTravelProgress = 1;
                this.camera.position.copy(roomPosition);
                this.cameraTarget.copy(roomTarget);
                if (onComplete) onComplete();
            })
            .start();
    }

    private beginEntryParallax() {
        this.entryParallaxPosition.copy(CAMERA_POSES.entry.position);
        this.entryParallaxTarget.copy(CAMERA_POSES.entry.target);
    }

    private updateEntryParallax() {
        if (
            REDUCED_MOTION ||
            this.state !== 'entry-door' ||
            !this.doorReady
        ) {
            return;
        }

        const pointerX = Math.abs(this.pointer.x) <= 1 ? this.pointer.x : 0;
        const pointerY = Math.abs(this.pointer.y) <= 1 ? this.pointer.y : 0;
        const basePosition = CAMERA_POSES.entry.position;
        const baseTarget = CAMERA_POSES.entry.target;

        this.entryParallaxPosition.set(
            basePosition.x + pointerX * ENTRY_PARALLAX_X,
            basePosition.y + pointerY * ENTRY_PARALLAX_Y,
            basePosition.z
        );
        this.entryParallaxTarget.set(
            baseTarget.x + pointerX * ENTRY_PARALLAX_TARGET_X,
            baseTarget.y + pointerY * ENTRY_PARALLAX_TARGET_Y,
            baseTarget.z
        );

        this.camera.position.lerp(
            this.entryParallaxPosition,
            ENTRY_PARALLAX_POSITION_LERP
        );
        this.cameraTarget.lerp(
            this.entryParallaxTarget,
            ENTRY_PARALLAX_TARGET_LERP
        );
    }

    private beginRoomOrbit() {
        this.roomOrbitStartedAt = performance.now();
        this.roomOrbitPosition.copy(CAMERA_POSES.room.position);
        this.roomOrbitTarget.copy(CAMERA_POSES.room.target);
    }

    private updateRoomOrbit() {
        if (REDUCED_MOTION || this.freeOrbitEnabled || this.state !== 'room-idle') {
            return;
        }

        const elapsed = performance.now() - this.roomOrbitStartedAt;
        const center = CAMERA_POSES.room.target;
        const basePosition = CAMERA_POSES.room.position;
        const radius = Math.hypot(
            basePosition.x - center.x,
            basePosition.z - center.z
        );
        const pointerX = Math.abs(this.pointer.x) <= 1 ? this.pointer.x : 0;
        const pointerY = Math.abs(this.pointer.y) <= 1 ? this.pointer.y : 0;
        const yaw = Math.sin(elapsed * ROOM_ORBIT_SPEED) * ROOM_ORBIT_YAW_AMPLITUDE;
        const heightDrift = Math.sin(elapsed * ROOM_ORBIT_SPEED * 0.72 + 0.8) * 0.045;

        this.roomOrbitPosition.set(
            center.x + Math.sin(yaw) * radius + pointerX * 0.055,
            basePosition.y + heightDrift + pointerY * 0.035,
            center.z + Math.cos(yaw) * radius
        );
        this.roomOrbitTarget.set(
            center.x + Math.sin(yaw) * 0.12 + pointerX * 0.075,
            center.y + Math.sin(elapsed * ROOM_ORBIT_SPEED * 0.5) * 0.03 + pointerY * 0.045,
            center.z
        );

        this.camera.position.lerp(this.roomOrbitPosition, ROOM_ORBIT_POSITION_LERP);
        this.cameraTarget.lerp(this.roomOrbitTarget, ROOM_ORBIT_TARGET_LERP);
    }

    private setRoomPortalMode(enabled: boolean) {
        this.setGroupPortalMode(this.roomGroup, enabled);
    }

    private setPortalPreviewMode(enabled: boolean) {
        this.setGroupPortalMode(this.portalPreviewGroup, enabled);
    }

    private setGroupPortalMode(group: THREE.Group, enabled: boolean) {
        group.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
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

    private setRoomShadowCasting(enabled: boolean) {
        void enabled;
        this.roomGroup.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            child.castShadow = false;
        });
    }

    private updateHover() {
        if (this.placementMode) {
            this.setHovered(null);
            return;
        }
        if (this.freeOrbitEnabled) {
            // Free-look mode: no hotspot emphasis or click affordance, just orbit.
            this.setHovered(null);
            return;
        }
        if (performance.now() < this.hoverPausedUntil) {
            this.setHovered(null);
            return;
        }

        if (this.state === 'focus-computer' && this.focusedKey === 'computer') {
            this.setHovered(null);
            document.body.style.cursor = 'pointer';
            return;
        }

        if (this.state !== 'entry-door' && this.state !== 'room-idle') {
            this.setHovered(null);
            return;
        }
        const hit = this.getIntersectedHotspot();
        if (hit === 'computer') {
            this.setHovered(null);
            document.body.style.cursor = 'pointer';
            return;
        }
        this.setHovered(hit);
    }

    private getIntersectedHotspot(): HotspotKey | null {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const candidates =
            this.state === 'entry-door'
                ? this.doorReady
                    ? this.doorObjects
                    : []
                : this.hotspotObjects;
        const hits = this.raycaster.intersectObjects(candidates, true);
        if (!hits.length) return null;
        const key = hits[0].object.userData.hotspotKey as HotspotKey | undefined;
        return key || null;
    }

    private setHovered(key: HotspotKey | null) {
        const unchanged = this.hoveredKey === key;
        if (!unchanged && this.hoveredKey) {
            this.setHotspotEmphasis(this.hoveredKey, false);
        }
        this.hoveredKey = key;
        if (this.hoveredKey) {
            if (!unchanged) {
                this.setHotspotEmphasis(this.hoveredKey, true);
                this.labelEl.textContent = this.getHotspotLabel(this.hoveredKey);
                this.labelEl.classList.add('is-visible');
            }
            document.body.style.cursor = 'pointer';
        } else {
            if (!unchanged) this.labelEl.classList.remove('is-visible');
            document.body.style.cursor = this.freeOrbitEnabled ? 'grab' : '';
        }
    }

    private setHotspotEmphasis(key: HotspotKey, active: boolean) {
        // The monitor shows the live OS when focused; skip the cyan glow so the
        // display never brightens on hover/click.
        if (key === 'door' || key === 'computer') return;
        const group =
            key === 'door' ? this.entryDoorRoot : this.hotspotGroups.get(key);
        if (!group) return;
        group.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            const material = child.material;
            if (!material || Array.isArray(material)) return;
            if (!child.userData.baseEmissive && 'emissive' in material) {
                child.userData.baseEmissive = material.emissive.clone();
                child.userData.baseEmissiveIntensity = material.emissiveIntensity || 0;
            }
            if ('emissive' in material) {
                if (active) {
                    material.emissive = new THREE.Color(0x7ce9e0);
                    material.emissiveIntensity = 0.08;
                } else if (child.userData.baseEmissive) {
                    material.emissive = child.userData.baseEmissive.clone();
                    material.emissiveIntensity = child.userData.baseEmissiveIntensity;
                }
            }
        });
    }

    private getHotspotLabel(key: HotspotKey) {
        if (key === 'door') return "Enter Jerry's Room";
        return HOTSPOTS[key as Exclude<HotspotKey, 'door'>].label;
    }

    private showPanel(config: HotspotConfig) {
        this.panelEl.innerHTML = `
            <p class="v2-focus-kicker">Prototype module</p>
            <h2>${config.title}</h2>
            <p>${config.body}</p>
        `;
        this.panelEl.classList.add('is-visible');
    }

    private hidePanel() {
        this.panelEl.classList.remove('is-visible');
    }

    private pulseThresholdFlare() {
        if (REDUCED_MOTION) return;
        if (this.thresholdFlareTimer !== null) {
            window.clearTimeout(this.thresholdFlareTimer);
        }

        this.thresholdFlareEl.classList.add('is-visible');
        this.thresholdFlareTimer = window.setTimeout(() => {
            this.thresholdFlareEl.classList.remove('is-visible');
            this.thresholdFlareTimer = null;
        }, 320);
    }

    private setHint(text: string) {
        this.hintEl.textContent = text;
        this.hintEl.classList.toggle('is-visible', Boolean(text));
    }

    private resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    private updateMonitorScreen() {
        if (
            !this.monitorCssObject ||
            !this.monitorElement ||
            !this.monitorDimmingMaterial
        ) {
            return;
        }

        this.monitorCssObject.getWorldPosition(this.monitorWorldPosition);
        this.monitorCssObject.getWorldQuaternion(this.monitorWorldQuaternion);

        const normal = MONITOR_NORMAL.clone()
            .applyQuaternion(this.monitorWorldQuaternion)
            .normalize();
        const viewVector = this.camera.position
            .clone()
            .sub(this.monitorWorldPosition)
            .normalize();
        const facing = Math.max(0, normal.dot(viewVector));
        const distance = this.camera.position.distanceTo(this.monitorWorldPosition);
        const angleDim = THREE.MathUtils.clamp((0.82 - facing) / 0.78, 0, 1);
        const distanceDim = THREE.MathUtils.clamp((distance - 2.3) / 4.2, 0, 1);
        const dimOpacity = THREE.MathUtils.clamp(
            angleDim * 0.82 + distanceDim * 0.16,
            0,
            0.94
        );
        const screenActive = this.roomGroup.visible && this.state !== 'entry-door';
        const angleVisibility = smootherStep(
            THREE.MathUtils.clamp(
                (facing - MONITOR_SIDE_HIDE_FACING) /
                    (MONITOR_SIDE_FULL_FACING - MONITOR_SIDE_HIDE_FACING),
                0,
                1
            )
        );
        const doorFade =
            this.state === 'door-opening'
                ? THREE.MathUtils.clamp(
                      (this.doorTravelProgress - THRESHOLD_SCREEN_FADE_PROGRESS) /
                          (1 - THRESHOLD_SCREEN_FADE_PROGRESS),
                      0,
                      1
                  )
                : 1;
        const screenReveal = screenActive ? smootherStep(doorFade) : 0;
        const contentOpacity = screenReveal * angleVisibility;
        const blackScreenOpacity =
            screenReveal * (1 - angleVisibility) * MONITOR_SIDE_BLACK_OPACITY;
        const compositorWarmupOpacity = this.state === 'door-opening' ? 0.001 : 0;
        const cssOpacity = Math.max(contentOpacity, compositorWarmupOpacity);

        if (this.monitorGlassMaterial) {
            this.monitorGlassMaterial.opacity = contentOpacity * 0.045;
            this.monitorGlassMaterial.needsUpdate = true;
        }
        this.monitorDimmingMaterial.opacity = Math.max(
            contentOpacity * dimOpacity,
            blackScreenOpacity
        );
        this.monitorElement.style.opacity = cssOpacity.toFixed(3);
        this.monitorElement.style.filter = `brightness(${THREE.MathUtils.lerp(
            1,
            0.42,
            dimOpacity
        ).toFixed(3)})`;
    }

    private updatePortalCamera() {
        this.portalTransformMatrix
            .copy(this.portalDestinationMatrix)
            .multiply(this.portalSourceMatrix.clone().invert());

        this.portalCamera.position
            .copy(this.camera.position)
            .applyMatrix4(this.portalTransformMatrix);
        this.portalCameraTarget
            .copy(this.cameraTarget)
            .applyMatrix4(this.portalTransformMatrix);
        this.portalCamera.fov = this.camera.fov;
        this.portalCamera.aspect = this.camera.aspect;
        this.portalCamera.projectionMatrix.copy(this.camera.projectionMatrix);
        this.portalCamera.projectionMatrixInverse.copy(
            this.camera.projectionMatrixInverse
        );
        this.portalCamera.lookAt(this.portalCameraTarget);
        this.portalCamera.updateMatrixWorld(true);
    }

    private renderPortalSurface() {
        if (this.shouldRenderRoomFullscreenInPortalVolume()) {
            this.renderPortalFullscreen();
            return true;
        }

        if (!this.portalStencil.visible || this.portalReleased) return false;

        const previousAutoClear = this.renderer.autoClear;
        const previousRoomVisibility = this.roomGroup.visible;
        const previousDoorVisibility = this.entryDoorRoot.visible;
        const previousPortalSurfaceVisibility = this.portalSurface.visible;
        const previousPortalStencilVisibility = this.portalStencil.visible;
        const previousPortalPreviewVisibility = this.portalPreviewGroup.visible;
        const previousDoorFloorPoolVisibility = this.doorFloorPoolMesh?.visible;
        const previousDoorBakedShadowVisibility =
            this.doorBakedShadowMesh?.visible;

        this.renderer.autoClear = true;

        this.roomGroup.visible = false;
        this.portalPreviewGroup.visible = false;
        this.portalStencil.visible = false;
        this.portalSurface.visible = false;
        // Reserve the contact shadow for the final composite so it lands once
        // across both the room floor and the exterior side of the threshold.
        if (this.doorBakedShadowMesh) this.doorBakedShadowMesh.visible = false;
        this.renderer.render(this.scene, this.camera);

        this.renderer.autoClear = false;
        this.entryDoorRoot.visible = false;
        this.roomGroup.visible = false;
        this.portalStencil.visible = true;
        this.portalSurface.visible = false;
        this.portalPreviewGroup.visible = false;
        this.renderer.render(this.scene, this.camera);

        this.renderer.clearDepth();
        this.portalStencil.visible = false;
        this.roomGroup.visible = true;
        this.setRoomPortalMode(true);
        this.renderer.render(this.scene, this.camera);
        this.setRoomPortalMode(false);

        this.renderer.clearDepth();
        this.entryDoorRoot.visible = true;
        this.roomGroup.visible = false;
        this.portalStencil.visible = false;
        this.portalSurface.visible = false;
        this.portalPreviewGroup.visible = false;
        // The floor pool was already composited by the first pass. Keep it out
        // of the door redraw, but restore the shadow so it bridges the portal
        // cut instead of disappearing or becoming a one-sided dark stripe.
        if (this.doorFloorPoolMesh) this.doorFloorPoolMesh.visible = false;
        if (
            this.doorBakedShadowMesh &&
            previousDoorBakedShadowVisibility !== undefined
        ) {
            this.doorBakedShadowMesh.visible =
                previousDoorBakedShadowVisibility;
        }
        this.renderer.render(this.scene, this.camera);
        if (
            this.doorFloorPoolMesh &&
            previousDoorFloorPoolVisibility !== undefined
        ) {
            this.doorFloorPoolMesh.visible = previousDoorFloorPoolVisibility;
        }

        this.renderer.autoClear = previousAutoClear;
        this.roomGroup.visible = previousRoomVisibility;
        this.entryDoorRoot.visible = previousDoorVisibility;
        this.portalSurface.visible = previousPortalSurfaceVisibility;
        this.portalStencil.visible = previousPortalStencilVisibility;
        this.portalPreviewGroup.visible = previousPortalPreviewVisibility;

        return true;
    }

    private renderPortalFullscreen() {
        const previousAutoClear = this.renderer.autoClear;
        const previousRoomVisibility = this.roomGroup.visible;
        const previousDoorVisibility = this.entryDoorRoot.visible;
        const previousPortalSurfaceVisibility = this.portalSurface.visible;
        const previousPortalStencilVisibility = this.portalStencil.visible;
        const previousPortalPreviewVisibility = this.portalPreviewGroup.visible;

        this.renderer.autoClear = false;
        this.renderer.clear(true, true, true);
        this.entryDoorRoot.visible = previousDoorVisibility;
        this.roomGroup.visible = true;
        this.portalStencil.visible = false;
        this.portalSurface.visible = false;
        this.portalPreviewGroup.visible = false;
        this.setRoomPortalMode(false);
        this.renderer.render(this.scene, this.camera);

        this.renderer.autoClear = previousAutoClear;
        this.roomGroup.visible = previousRoomVisibility;
        this.entryDoorRoot.visible = previousDoorVisibility;
        this.portalSurface.visible = previousPortalSurfaceVisibility;
        this.portalStencil.visible = previousPortalStencilVisibility;
        this.portalPreviewGroup.visible = previousPortalPreviewVisibility;
    }

    private shouldRenderRoomFullscreenInPortalVolume() {
        if (this.portalReleased || this.state !== 'door-opening') return false;

        const localX = this.camera.position.x - PORTAL_SOURCE_POSITION.x;
        const localY = this.camera.position.y - PORTAL_SOURCE_POSITION.y;
        const localZ = this.camera.position.z - PORTAL_SOURCE_POSITION.z;
        const withinDoor =
            Math.abs(localX) <= PORTAL_PLANE_WIDTH / 2 + PORTAL_VOLUME_PADDING &&
            Math.abs(localY) <= PORTAL_PLANE_HEIGHT / 2 + PORTAL_VOLUME_PADDING;

        return withinDoor && Math.abs(localZ) <= PORTAL_VOLUME_HALF_DEPTH;
    }

    private animate = () => {
        this.animationFrame = window.requestAnimationFrame(this.animate);
        TWEEN.update();
        this.updateEntryParallax();
        this.updateRoomOrbit();
        this.updateHover();
        this.updateRoomHud();
        this.updateMonitorInteractivity();
        // Gate on orbitControls.enabled, not just freeOrbitEnabled: during
        // the fly-to-overview tween the controls are disabled and still hold
        // the previous target, so letting them drive the camera here would
        // yank the view off the tweened path (visible snap at tween end).
        if (this.freeOrbitEnabled && this.orbitControls.enabled) {
            this.updateFreeOrbitTarget();
            this.orbitControls.update();
            this.cameraTarget.copy(this.orbitControls.target);
        }
        this.camera.lookAt(this.cameraTarget);
        this.camera.updateMatrixWorld(true);
        this.updateMonitorScreen();
        this.cssRenderer.render(this.scene, this.camera);
        if (!this.renderPortalSurface()) {
            this.renderer.render(this.scene, this.camera);
        }
    };

    private box(
        size: [number, number, number],
        position: number[] | [number, number, number],
        material: THREE.Material,
        receiveShadow = false
    ) {
        void receiveShadow;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        return mesh;
    }

    private fitModelToBox(
        object: THREE.Object3D,
        options: {
            center: THREE.Vector3;
            maxSize: THREE.Vector3;
            stretch?: THREE.Vector3;
        }
    ) {
        object.updateMatrixWorld(true);
        const originalBox = new THREE.Box3().setFromObject(object);
        const originalSize = originalBox.getSize(new THREE.Vector3());
        const scale = Math.min(
            options.maxSize.x / originalSize.x,
            options.maxSize.y / originalSize.y,
            options.maxSize.z / originalSize.z
        );

        object.scale.multiplyScalar(scale);
        if (options.stretch) {
            object.scale.multiply(options.stretch);
        }
        object.updateMatrixWorld(true);

        const fittedBox = new THREE.Box3().setFromObject(object);
        const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
        object.position.x += options.center.x - fittedCenter.x;
        object.position.y += options.center.y - fittedBox.min.y;
        object.position.z += options.center.z - fittedCenter.z;
    }

    private makeTextTexture(
        text: string,
        options: {
            width: number;
            height: number;
            background: string;
            foreground: string;
            font: string;
        }
    ) {
        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        const context = canvas.getContext('2d');
        if (!context) return null;
        context.fillStyle = options.background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = options.foreground;
        context.font = options.font;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = 8;
        return texture;
    }

    private makeVignetteBackgroundTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const context = canvas.getContext('2d');
        if (!context) return null;

        const image = context.createImageData(canvas.width, canvas.height);
        const center = { x: 0.5, y: 0.53 };
        const inner = [241, 241, 238];
        const outer = [190, 192, 194];
        const lower = [238, 236, 231];

        const smoothstep = (edge0: number, edge1: number, value: number) => {
            const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        };

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const u = x / (canvas.width - 1);
                const v = y / (canvas.height - 1);
                const dx = (u - center.x) / 0.72;
                const dy = (v - center.y) / 0.82;
                const radius = Math.sqrt(dx * dx + dy * dy);
                const vignette = smoothstep(0.42, 1.18, radius);
                const topWeight = smoothstep(0.44, 0.0, v) * 0.3;
                const bottomBlend = smoothstep(0.62, 0.9, v);
                const shade = Math.min(1, vignette * 0.5 + topWeight);
                const base = inner.map((channel, index) =>
                    channel * (1 - bottomBlend) + lower[index] * bottomBlend
                );
                const color = base.map((channel, index) =>
                    Math.round(channel * (1 - shade) + outer[index] * shade)
                );
                const grain =
                    (((x * 73856093) ^ (y * 19349663)) & 255) / 255 - 0.5;
                const grainAmount = 3.2 + vignette * 2.2;
                const offset = (y * canvas.width + x) * 4;
                image.data[offset] = Math.max(
                    0,
                    Math.min(255, color[0] + grain * grainAmount)
                );
                image.data[offset + 1] = Math.max(
                    0,
                    Math.min(255, color[1] + grain * grainAmount)
                );
                image.data[offset + 2] = Math.max(
                    0,
                    Math.min(255, color[2] + grain * grainAmount)
                );
                image.data[offset + 3] = 255;
            }
        }

        context.putImageData(image, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        return texture;
    }

    private makePhotoTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 900;
        canvas.height = 620;
        const context = canvas.getContext('2d');
        if (!context) return null;
        context.fillStyle = '#f7f1e8';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ffffff';
        context.fillRect(42, 42, 816, 438);
        const gradient = context.createLinearGradient(42, 42, 858, 480);
        gradient.addColorStop(0, '#7bc7d4');
        gradient.addColorStop(0.55, '#e8d7b2');
        gradient.addColorStop(1, '#1e3c55');
        context.fillStyle = gradient;
        context.fillRect(62, 62, 776, 398);
        context.fillStyle = '#1d2529';
        context.font = 'bold 42px Helvetica, Arial, sans-serif';
        context.fillText('Gallery', 62, 555);
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = 8;
        return texture;
    }

    private makeMapTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 900;
        canvas.height = 620;
        const context = canvas.getContext('2d');
        if (!context) return null;
        context.fillStyle = '#f4ecd8';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#cfbf9d';
        context.lineWidth = 4;
        for (let x = 90; x < canvas.width; x += 180) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
        }
        for (let y = 90; y < canvas.height; y += 150) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }
        context.strokeStyle = '#42aaa3';
        context.lineWidth = 12;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(110, 430);
        context.bezierCurveTo(250, 250, 420, 360, 520, 240);
        context.bezierCurveTo(620, 120, 720, 180, 790, 105);
        context.stroke();
        context.fillStyle = '#1f2a2d';
        [
            [110, 430],
            [520, 240],
            [790, 105],
        ].forEach(([x, y]) => {
            context.beginPath();
            context.arc(x, y, 18, 0, Math.PI * 2);
            context.fill();
        });
        context.font = 'bold 40px Helvetica, Arial, sans-serif';
        context.fillText('Journey', 70, 560);
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = 8;
        return texture;
    }
}
