# 3D Model Inventory

This folder is the workspace home for source and candidate 3D assets.

## Runtime Models

These are the optimized files the website loads directly from `public/models`.

| Purpose | Runtime path | Status |
| --- | --- | --- |
| Entry door | `public/models/JianweiDoor/jianwei_door.glb` | Active |
| Door baked shadow | `public/models/JianweiDoor/jianwei_door_shadow.png` | Active |
| Current desk | `public/models/OfficeDesk/office_desk.glb` | Active |
| Previous standing desk candidate | `public/models/StandingDesk/standing_desk.glb` | Available |
| Ergonomic chair | `public/models/AppleDesk/ModernChair/modern_chair.glb` | Active |
| Studio Display | `public/models/AppleDesk/StudioDisplay/studio_display.glb` | Active |
| Wooden monitor raiser | `public/models/AppleDesk/MonitorRaiser/monitor_raiser.glb` | Active |
| Keyboard | `public/models/AppleDesk/Keyboard/keyboard.glb` | Active |
| Mouse | `public/models/AppleDesk/Mouse/mouse.glb` | Active |
| HomePod mini | `public/models/AppleDesk/HomePodMini/homepod_mini.glb` | Active; Blender-cleaned single-object export |
| Potted plant | `public/models/AppleDesk/PottedPlant/mini_plant.glb` | Active; placed on monitor riser like the desk reference |
| Floor lamp | `public/models/AppleDesk/FloorLamp/rita_floor_lamp.glb` | Active; left of desk with warm point light |
| Original Henry computer setup | `public/models/Computer/computer_setup.glb` | Legacy/reference |
| Original Henry decor | `public/models/Decor/decor.glb` | Legacy/reference |
| Original Henry environment | `public/models/World/environment.glb` | Legacy/reference |

## Candidate Models

Downloaded models that are not currently loaded by the website should live here first.
After a model is chosen, export/optimize it and copy the final `.glb` into `public/models/<AssetName>/`.

| Asset | Workspace path | Notes |
| --- | --- | --- |
| Gaming desktop PC | `assets/3d-models/candidates/computers/gaming_desktop_pc.glb` | Candidate only |
| Wooden monitor raiser | `assets/3d-models/candidates/desks/wooden_desk_monitor_raiser_stand.glb` | Candidate only |
| Standing desk source copy | `assets/3d-models/candidates/desks/standing_desk.glb` | Same file hash as runtime standing desk |
| Office desk source copy | `assets/3d-models/candidates/desks/office_desk.glb` | Same file hash as active runtime desk |
| Alternate door | `assets/3d-models/candidates/doors/door_723.glb` | Candidate only |
| Keyboard source copy | `assets/3d-models/candidates/peripherals/keyboard.glb` | Same file hash as active runtime keyboard |
| Logitech MX Master source copy | `assets/3d-models/candidates/peripherals/logitech_mx_master_2s.glb` | Same file hash as active runtime mouse |
| HomePod mini clean export | `assets/3d-models/candidates/audio/homepod_mini_clean.glb` | Cleaned from downloaded `.blend`; duplicate model and render planes removed |
| Mini potted plant | `assets/3d-models/candidates/decor/mini_plant.glb` | Same file hash as active runtime plant |
| Rita floor lamp | `assets/3d-models/candidates/lighting/rita_floor_lamp_brass_and_marble.glb` | Same file hash as active runtime floor lamp |

## Blender Sources

| Asset | Workspace path | Notes |
| --- | --- | --- |
| Jianwei door scene | `assets/3d-models/blender/jianwei-door/jianwei_door.blend` | Blender source |
| Jianwei door backup | `assets/3d-models/blender/jianwei-door/jianwei_door.blend1` | Blender autosave/backup |
| HomePod mini source | `assets/3d-models/blender/homepod-mini/apple_homepod_mini.blend` | Downloaded Blender source |

## Workflow

1. Put newly downloaded model files under `assets/3d-models/candidates/<category>/`.
2. Inspect and clean candidate assets in Blender.
3. Export the final optimized `.glb`.
4. Place runtime-ready assets under `public/models/<AssetName>/`.
5. Update `src/outer/v2/SpatialPortfolio.ts` only after the runtime asset path is stable.

Do not leave portfolio model files in `~/Downloads`.
