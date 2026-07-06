# Blender Door Asset Guide

## Goal

Create a standalone portal door for `Jerry's Room`.

The door should feel like a real object placed in a white void, not a flat UI prop and not a door attached to a wall. It needs enough material detail to carry the first impression of the site.

## Scene Scale

Use metric units.

- Door panel: width `0.86m`, height `2.05m`, depth `0.055m`
- Door frame outer width: about `1.12m`
- Door frame height: about `2.22m`
- Frame depth: `0.10m` to `0.14m`
- Handle height: about `1.0m`
- Plaque: about `0.48m x 0.14m`

## Required Object Names

Use these names so the web scene can target them reliably:

- `Door_Group`
- `Door_Panel`
- `Door_Frame_Left`
- `Door_Frame_Right`
- `Door_Frame_Top`
- `Door_Handle`
- `Door_Plaque`
- `Door_Hinge_Empty`

## Pivot Requirement

The object that rotates should have its origin at the hinge side of the door.

Recommended structure:

- `Door_Hinge_Empty` at the left hinge line
- `Door_Panel`, `Door_Handle`, and `Door_Plaque` parented under `Door_Hinge_Empty`
- Frame objects stay outside the hinge empty, under `Door_Group`

In Three.js, `Door_Hinge_Empty` will rotate to open the door.

## Material Direction

Door:

- Warm off-white, pale wood, or muted beige
- Roughness high enough to avoid plastic shine
- Subtle bevels on all edges
- Slight panel depth for real shadows

Frame:

- Slightly lighter than door panel
- Matte painted material

Handle:

- Brushed dark metal or muted aluminum
- Small bevel, not a plain cylinder

Plaque:

- Dark charcoal or blackened metal
- Text: `Jerry's Room`
- Avoid oversized text. It should be readable but physically plausible.

## Geometry Notes

Add bevels:

- Door panel bevel: `0.01m` to `0.018m`
- Frame bevel: `0.008m` to `0.014m`
- Plaque bevel: `0.004m` to `0.008m`

Avoid:

- Coplanar overlapping planes
- Transparent materials
- Huge wall pieces
- Decorative clutter around the door

## Export

Export as `.glb`.

Target path:

`public/models/JianweiDoor/jianwei_door.glb`

Export settings:

- Format: `glTF Binary (.glb)`
- Include: Selected Objects
- Transform: Apply modifiers
- Geometry: UVs and normals enabled
- Materials enabled
- Compression optional for now

## Baking Direction

Decision recorded on 2026-07-01:

- The entry door should use baked grounding/contact shadow for the closed state.
- Do not spend time preserving a realtime door shadow during the opening animation unless it becomes visually necessary later.
- The current web prototype turns off entry shadow receiving when the door is clicked to prevent room-shadow leakage. This makes the door shadow disappear, but that is acceptable for the prototype.
- Long-term fix: bake the closed door shadow and ambient occlusion in Blender, then treat the opening door mostly as a moving mesh without relying on realtime shadow catchers.
- The doorway/portal transition should avoid realtime shadow catchers until the camera has fully entered the room.

Implementation status on 2026-07-01:

- Added `DoorBakedShadow` to `public/models/JianweiDoor/jianwei_door.glb`.
- Added transparent baked shadow texture at `public/models/JianweiDoor/jianwei_door_shadow.png`.
- Runtime special-cases `DoorBakedShadow` so it keeps a transparent unlit material, does not cast or receive shadows, and does not become a clickable door hotspot.
- Entry floor realtime shadow receiving is disabled by default. The closed door grounding now comes from the baked shadow texture.
- Browser check passed for the settled door view and early door-opening frames with no console errors.

## Acceptance Check

Before export:

- Door is standalone in empty space.
- Door has visible thickness.
- Door frame is not attached to a wall.
- Plaque reads `Jerry's Room`.
- Door panel can rotate around the left hinge without sliding.
- Scale feels like a real human door.
- Closed-state door contact shadow is baked and looks stable before interaction.
