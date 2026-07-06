# Jianwei Spatial Portfolio v2 Design Spec

## Design Read

This is a personal spatial portfolio for recruiters, collaborators, friends, and future lab visitors. The experience should feel like entering Jianwei's room: Apple-clean, research-minded, personal, playful, and spatial. It should not feel like a fork of a retro computer website.

Design dials:

- Design variance: 7
- Motion intensity: 7
- Visual density: 4

The site should prioritize one strong first impression, a believable room, and a few memorable interactions over a large number of half-finished features.

## North Star

The website is a room, not a page.

Visitors begin outside a closed door. The door has a physical plaque that says `Jerry's Room`. Clicking the door opens it. The camera moves through the doorway into the room and settles on a desk. The desk becomes the main navigation surface.

Core room objects:

- Computer: projects, OS, resume, contact, research work
- Photo stack or camera: gallery
- Game object: game log
- Map: personal journey

The room should feel like Jianwei's personal workspace: Apple desk setup, MR and AI hints, life artifacts, games, photos, travel, and study. It should not rely on the old computer as the whole identity of the site.

## First 30 Seconds

### Entry

Initial view:

- The first visible moment should not show the completed door waiting for assets.
- Start from an almost invisible point or seed in the white void.
- Once the door asset is ready, the door grows from that point while the camera begins its approach.
- The settled entry view faces a standalone door in a pure white void.
- There should be no surrounding wall or normal hallway.
- The mood should be slightly surreal, closer to a symbolic portal than a real apartment entrance.
- Door material should be warm but restrained, such as painted wood or soft matte white.
- A small plaque on the door reads `Jerry's Room`.
- The plaque should be legible without feeling like a giant UI label.
- The door handle has a subtle hover highlight.

Interaction:

- User clicks the door, handle, or plaque.
- The door opens inward into the room.
- Camera begins moving through the doorway shortly after the door starts opening.
- Door opening and camera entry should overlap as one continuous motion.
- The user should feel like they are entering a real space, not loading a route.
- Avoid a static loaded-door pause. Loading should read as emergence from the point, not as a frozen door.
- Door interior preview is a shallow warm room slice, not the real interactive room.
- The real desk scene releases near the threshold, hidden by doorframe occlusion and a subtle warm flare.

Camera move:

- Start: centered outside the door.
- Door animation starts first, but only leads the camera by a small beat.
- Camera may begin approaching while the door opens, but it must stay outside the door plane until the door is visibly open.
- Camera crosses the threshold.
- The transition switches from the warm preview slice to the real desk scene while the camera is close to the frame.
- Camera turns slightly toward the desk.
- Final frame: desk fills the center, with major clickable objects visible.

Fallback:

- If reduced motion is enabled, skip the long camera move and fade from door to desk.
- If WebGL fails, show a still image of the room with normal navigation links.

### Room Idle

After entering:

- The camera rests at a comfortable room-view angle.
- The desk is the main subject.
- Computer, photo stack, game object, and map are visible enough to be understood.
- Interactive objects use subtle physical affordances: hover glow, small lift, cursor change, label on hover.
- No persistent instruction text should explain the whole website. The objects should be readable.

## Navigation Model

Do not navigate away to separate pages for the core spatial interactions.

Use one persistent scene and change states:

- `entry-door`
- `door-opening`
- `room-idle`
- `focus-computer`
- `focus-gallery`
- `focus-game-log`
- `focus-journey`
- `returning-room`

Rules:

- Clicking an object moves the camera toward that object.
- The focused module opens in place.
- Returning to the room should reverse or reframe the camera, not reload the whole site.
- Browser back can return from a focused module to `room-idle`.
- Escape key returns to `room-idle`.
- A visible but quiet close/back control appears in focused states.

## Core Modules

### Computer

Purpose:

- Main portfolio OS.
- Projects, resume, contact, publications, research demos, and experiments.

Interaction:

- Click computer.
- Camera moves close to the display.
- Screen content becomes readable and interactive.

Implementation direction:

- Keep OS content as DOM or CSS3D where possible.
- Use the 3D monitor as a spatial frame, not as the only rendering surface.
- Avoid fighting model UVs if the display surface is unreliable. A DOM/CSS3D screen aligned to the model is acceptable.

### Gallery

Purpose:

- Personal photos and life moments.

Object:

- A physical photo stack, camera, or small print tray on the desk.

Interaction:

- Click photo stack.
- Camera moves close.
- The photo stack floats or tilts into a readable presentation pose.
- User browses one visible top photo at a time.

Important behavior:

- The stack should have believable thickness but not comical height.
- Only the current photo is fully visible.
- Previous and next can be preloaded for responsiveness.
- Other photos should be represented by stack thickness, not individual full cards.
- Next and previous animations must feel like physical stack order changes, not cards appearing from random directions.

Implementation direction:

- Prefer a high-quality DOM/CSS/GSAP photo stack overlay anchored to the 3D scene over hand-animating every mesh in Three.js.
- Keep the desk photo stack as a static 3D prop.
- When focused, use camera framing plus overlay alignment to make it feel like the object came alive.

### Game Log

Purpose:

- A personal record of games Jianwei has played.
- It should feel like a hobby archive, not embedded copyrighted games.

Object:

- Game controller, handheld device, game cartridge case, or small shelf item.

Interaction:

- Click game object.
- Camera focuses on it.
- A physical media-style UI opens: game cards, timeline, ratings, notes, platform, completion status.

Content fields:

- Title
- Platform
- Year played
- Status
- Personal note
- Favorite moment
- Screenshot or cover image when legally usable

### Journey Map

Purpose:

- A spatial timeline of Jianwei's journey.

Object:

- Folded desk map, passport, boarding pass, or travel notebook.

Interaction:

- Click map.
- Camera moves close.
- Map lifts or unfolds.
- A small airplane or paper plane flies along a route.
- Cities, schools, labs, projects, and life stages light up in order.

Data model:

- Location
- Date or year
- Title
- Short note
- Optional image
- Optional related project

Visual direction:

- Use an abstract personal map, not a real Google map.
- The route should feel like a memory path.
- Keep labels sparse.

## Inner World Art Direction

Base mood:

- Pure white void with an Apple-clean desk setup.
- Quiet, surreal, and object-focused.
- Research and MR hints are present but not forced.
- Personal objects make the space Jianwei's.

Palette:

- White-space base: off-white ground and background, graphite, soft gray, muted wood.
- One accent color: cool cyan or soft green.
- Avoid generic purple-blue AI gradients.

Materials:

- No surrounding walls or normal room shell.
- Clean desk surface.
- Brushed aluminum or silver for Apple-style hardware.
- Paper, photo, map, and notebook materials should have roughness and texture.

Lighting:

- Use one main soft area light.
- Avoid harsh neon gamer-room lighting for the main version.
- Small accent lights are okay only if tied to real desk objects.
- Static desk, chair, computer, fixed props, the entry door, and their grounding shadows should ultimately be baked in Blender. Do not depend on realtime shadow catchers for the main static look.
- Realtime shadows are only for genuinely dynamic objects, such as the opening door if needed, photo flipping, flying map objects, or other moving interaction props.
- Current v2 temporarily disables shadow catchers during door/portal transitions to avoid shadow leaks. This is a prototype workaround, not the long-term art direction.
- The entry door's closed-state floor contact and shadow should be baked. Once baked, clicking/opening the door should not require a realtime door shadow; the viewer's attention is on the portal and desk.
- The desk scene's static shadows should be baked into floor/object textures so shadows do not visibly appear only after the camera settles inside the room.

Style boundaries:

- Not a retro computer clone.
- Not a full gamer room.
- Not a generic Apple product render.
- Not a dense lab dashboard.
- It should feel like a personal desk suspended in a white world that happens to contain spatial computing work, games, photos, and maps.

## Door Sequence Detail

Object requirements:

- Door panel
- Door frame
- Door handle
- Plaque reading `Jerry's Room`
- Optional small room number or subtle sticker

Motion:

- Door rotates around the hinge, about 80 to 100 degrees.
- Handle can depress or rotate slightly before the door opens.
- Door open duration: 1.0 to 1.4 seconds.
- Camera entry duration: 2.0 to 3.0 seconds.
- Use eased camera motion, not linear motion.

Sound:

- Optional and off by default.
- If used, add a soft click and room tone.
- Respect browser autoplay rules and user preferences.

Acceptance:

- The door sign is readable.
- The first frame reads as a tiny point/seed in white space, not a frozen door.
- The settled entry frame reads as a standalone door in white space.
- The door opening reveals the room.
- The camera does not clip through geometry.
- The final desk framing shows all four main navigation objects.

## 3D Production Plan

### Blender Responsibilities

Use Blender for:

- White void ground plane
- Door, frame, handle, plaque
- Desk and major furniture
- Object placement
- Basic materials
- Model scale and proportions
- Optional baked ambient occlusion

Use code for:

- State machine
- Camera motion
- Hover and click hotspots
- Focus transitions
- DOM overlays
- Content loading
- Lightweight object animation

Avoid placing major furniture by code unless it is temporary blockout.

### Asset Conventions

Units:

- Use meters.
- Keep human room scale believable.

Origins:

- Door origin at hinge if the door itself is animated in Three.js.
- Clickable props should have clear origins near their center or intended pivot.
- Group each major object under a named empty.

Names:

- `Door_Group`
- `Door_Panel`
- `Door_Handle`
- `Door_Plaque`
- `Desk_Group`
- `Computer_Group`
- `PhotoStack_Group`
- `GameObject_Group`
- `JourneyMap_Group`
- `Chair_Group`
- `Lamp_Group`

Materials:

- Use simple PBR materials.
- Avoid transparent materials unless truly needed.
- Avoid overlapping coplanar surfaces because they create flicker and moire patterns.
- Keep texture sizes intentional.

Export:

- Preferred format: `.glb`
- One room file for the environment.
- Separate heavy props if they may be lazy-loaded.

## Technical Direction

Initial implementation should stay inside the current Vite + React + Three.js stack unless a rewrite proves cheaper.

Recommended modules:

- `SceneStateMachine`: owns the active spatial state.
- `CameraDirector`: owns camera splines and focus poses.
- `HotspotManager`: maps 3D objects to click and hover states.
- `RoomScene`: loads the white inner world and persistent props.
- `DoorSequence`: handles entry state and door animation.
- `ObjectFocusLayer`: shows focused module UI.
- `GalleryModule`: photo stack content.
- `GameLogModule`: game archive content.
- `JourneyModule`: map and airplane route.
- `ComputerModule`: OS and portfolio content.

Do not mix heavy DOM and Three.js control in the same component if it can be separated.

## Content Strategy

Top-level content should answer:

- What does Jianwei build?
- What has Jianwei researched?
- What kind of person is Jianwei?
- How can someone contact Jianwei?
- What is memorable about this site?

Core identity:

- MR and AI research
- Vision Pro development
- Human-centered tools
- Games and media as personal interests
- Journey across places, schools, and projects

## Accessibility

Requirements:

- Keyboard support for entering room and opening objects.
- Escape returns to room.
- Focus states visible.
- Reduced motion support.
- Text alternatives for core content.
- Non-WebGL fallback.
- Core content discoverable without requiring perfect 3D interaction.

## Performance

Targets:

- First meaningful entry view under 2.5 seconds on good desktop connection.
- Door scene loads before heavy room props if needed.
- Inner-world assets compressed with Draco or Meshopt if file size becomes large.
- Large modules lazy-load after room entry.
- Photo and game media load on demand.

## Phase Plan

### Phase 1: Spatial Skeleton

Build:

- Door entry scene
- Door open animation
- Camera move into room
- White inner-world blockout with desk
- Four clickable placeholder objects
- Return-to-room behavior

Acceptance:

- The website starts at the door.
- Clicking the door enters the room.
- Camera lands on a desk.
- Four objects are clickable and focusable.
- No old template identity appears in visible UI.

### Phase 2: Inner World Art Direction

Build:

- Replace blockout with Blender room.
- Add desk, chair, computer, photo stack, game object, map.
- Add lighting and material pass.
- Tune camera poses.

Acceptance:

- The room reads as Jianwei's desk setup.
- The desk is visually balanced from the default camera.
- Objects are readable but not over-labeled.

### Phase 3: Computer and Gallery

Build:

- Computer focus state.
- OS or portfolio screen content.
- Gallery focus state.
- High-quality photo stack interaction.

Acceptance:

- Computer content is readable.
- Gallery animation does not clip, stutter, or look like cards teleporting.
- Returning to the room is smooth.

### Phase 4: Game Log and Journey Map

Build:

- Game log content model and UI.
- Journey map route data.
- Airplane or paper plane animation.

Acceptance:

- Game log feels like a personal archive.
- Journey map feels like a spatial timeline.
- Neither module needs a page reload.

### Phase 5: Polish and Deployment

Build:

- Mobile fallback.
- Loading states.
- Accessibility pass.
- Performance pass.
- SEO and Open Graph.

Acceptance:

- Desktop and mobile both have intentional experiences.
- Build and typecheck pass.
- Visual inspection passes at common viewport sizes.

## Immediate Next Step

Create the Phase 1 spatial skeleton:

- Keep the old site untouched as reference.
- Add a new v2 scene entry point.
- Implement the door and room blockout with simple geometry first.
- Do not import final models until the camera and state model feel right.

The first success condition is not visual richness. It is a convincing transition from `Jerry's Room` door to desk, with the right architecture for the future objects.

## Portal Direction

The entry should behave like a Portal 2 impossible space, not a simple cutscene.

Current direction:

- The door aperture is a portal surface.
- The room behind the door is not a fake miniature stage.
- The portal surface is rendered from a secondary camera.
- The secondary camera is transformed from the player camera by the source-door to destination-door matrix.
- When crossing the threshold, the main camera should inherit the portal camera pose before continuing into the room.

Important implementation notes:

- Avoid fixed portal cameras. They create an obvious texture-to-room jump.
- Avoid hand-built warm preview geometry. It reads as a fake diorama.
- Next technical step is oblique near-plane clipping so geometry behind the portal is clipped by the door plane instead of bleeding or popping.
- Lighting and exposure must be matched between portal render target and the live room scene.
