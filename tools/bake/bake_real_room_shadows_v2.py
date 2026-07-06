import math
import os
import struct
import zlib
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path("/Users/nijianwei/Desktop/Github/Portfolio")
OUT_DIR = ROOT / "public" / "textures" / "baked"
QA_DIR = ROOT / ".tmp-qa" / "blender-bake"
OUT_DIR.mkdir(parents=True, exist_ok=True)
QA_DIR.mkdir(parents=True, exist_ok=True)

ROOM_DEPTH_OFFSET = -0.85
DESK_SCENE_Z_OFFSET = -0.52
DESK_SURFACE_Y = 0.91
MONITOR_RAISER_HEIGHT = 0.15
RISER_SET_Z_OFFSET = -0.108
SHADOW_MAP_RESOLUTION = 2048


def desk_z(z):
    return z + DESK_SCENE_Z_OFFSET


def world_z(z):
    return z + ROOM_DEPTH_OFFSET


def three_to_blender(x, y, z):
    return (x, -z, y)


def three_vec(v):
    return Vector(three_to_blender(v[0], v[1], v[2]))


def three_size(v):
    return Vector((v[0], v[2], v[1]))


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def setup_render(samples=96):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.transparent_max_bounces = 12
    scene.cycles.max_bounces = 12
    scene.render.film_transparent = True
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.render.resolution_x = SHADOW_MAP_RESOLUTION
    scene.render.resolution_y = SHADOW_MAP_RESOLUTION
    scene.world = bpy.data.worlds.new("transparent warm shadow bake")
    scene.world.color = (1.0, 1.0, 1.0)


def import_gltf(path, name):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    imported = [obj for obj in bpy.data.objects if obj not in before]
    root = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(root)
    for obj in imported:
        if obj.parent is None or obj.parent not in imported:
            obj.parent = root
    return root


def bounds(root):
    bpy.context.view_layer.update()
    points = []
    for obj in root.children_recursive:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            points.append(obj.matrix_world @ Vector(corner))
    if not points:
        return None
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return mins, maxs, maxs - mins


def fit_to_three_box(root, center, max_size, stretch=(1, 1, 1), bottom_align=True):
    bpy.context.view_layer.update()
    current = bounds(root)
    if current is None:
        return
    _, _, current_size = current
    target = three_size(max_size)
    scale = min(
        target.x / max(current_size.x, 1e-5),
        target.y / max(current_size.y, 1e-5),
        target.z / max(current_size.z, 1e-5),
    )
    root.scale *= scale
    root.scale.x *= stretch[0]
    root.scale.y *= stretch[2]
    root.scale.z *= stretch[1]
    bpy.context.view_layer.update()

    current = bounds(root)
    if current is None:
        return
    mins, maxs, _ = current
    current_center = (mins + maxs) * 0.5
    target_center = three_vec(center)
    target_z = target_center.z if not bottom_align else target_center.z - mins.z
    delta = Vector(
        (
            target_center.x - current_center.x,
            target_center.y - current_center.y,
            target_z if bottom_align else target_center.z - current_center.z,
        )
    )
    root.location += delta
    bpy.context.view_layer.update()


def set_yaw(root, yaw):
    root.rotation_euler[2] = -yaw


def hide_camera_but_cast(root):
    for obj in root.children_recursive:
        if obj.type != "MESH":
            continue
        obj.visible_camera = False
        obj.visible_shadow = True
        obj.visible_diffuse = True
        obj.visible_glossy = True
        obj.visible_transmission = True
        for slot in obj.material_slots:
            mat = slot.material
            if not mat:
                continue
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf and "Alpha" in bsdf.inputs:
                bsdf.inputs["Alpha"].default_value = 1
            mat.blend_method = "OPAQUE"


def set_shadow_visibility(root, visible):
    for obj in root.children_recursive:
        if obj.type == "MESH":
            obj.visible_shadow = visible


def disable_floor_tabletop_shadow(root):
    """Keep floor bake as contact shadow, not a hard full tabletop projection."""
    bpy.context.view_layer.update()
    for obj in root.children_recursive:
        if obj.type != "MESH":
            continue
        material_names = {
            slot.material.name.lower() for slot in obj.material_slots if slot.material
        }
        is_broad_tabletop = (
            obj.dimensions.x > 1.5
            and obj.dimensions.z > 0.75
            and obj.dimensions.y < 0.08
            and ("material" in material_names or "edge_color000255" in material_names)
        )
        if is_broad_tabletop:
            obj.visible_shadow = False


def remove_children(root, predicate):
    # Removing a Blender object does NOT remove its children — they get
    # orphaned at their raw (untransformed) coordinates and keep casting
    # shadows. Delete the whole subtree, deepest first.
    doomed = []
    for obj in list(root.children_recursive):
        if predicate(obj):
            doomed.append(obj)
            doomed.extend(obj.children_recursive)
    seen = set()
    for obj in doomed:
        if obj.name in seen or obj.name not in bpy.data.objects:
            continue
        seen.add(obj.name)
    for name in seen:
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)


def add_light_rig(mode="room"):
    def area(name, loc, target, color, power, size):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = power
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = three_vec(loc)
        direction = three_vec(target) - obj.location
        obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        return obj

    def point(name, loc, color, power, radius):
        data = bpy.data.lights.new(name, "POINT")
        data.energy = power
        data.shadow_soft_size = radius
        data.color = color
        obj = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = three_vec(loc)
        return obj

    if mode == "floor-contact":
        area(
            "floor contact overhead softbox",
            (0.0, 5.2, world_z(desk_z(-3.45))),
            (0.0, 0.1, world_z(desk_z(-3.45))),
            (1.0, 1.0, 1.0),
            520,
            8.4,
        )
        # NOTE: the old "floor contact front lift" area light is intentionally
        # gone: an area light emits from its front face only, so its plane
        # sliced the floor into lit/unlit halves with a razor-straight edge
        # that baked in as a giant square shadow. The white world provides
        # the fill instead.
        return

    area(
        "warm room softbox",
        (-1.65, 4.2, world_z(desk_z(-2.2))),
        (0.0, 0.72, world_z(desk_z(-3.8))),
        (1.0, 0.97, 0.93),
        560,
        7.2,
    )
    area(
        "cool outside lift",
        (1.5, 3.4, world_z(-1.2)),
        (0.0, 0.2, world_z(desk_z(-3.7))),
        (0.94, 0.96, 1.0),
        140,
        5.5,
    )
    point(
        "floor lamp warm practical",
        (-1.98, 1.42, world_z(-4.08)),
        (1.0, 0.78, 0.55),
        70,
        3.2,
    )


def make_shadow_catcher(name, center, size):
    mat = bpy.data.materials.new(f"{name} catcher material")
    mat.diffuse_color = (1, 1, 1, 1)
    bpy.ops.mesh.primitive_plane_add(size=1, location=three_vec(center))
    plane = bpy.context.object
    plane.name = name
    plane.dimensions = (size[0], size[1], 1)
    plane.data.materials.append(mat)
    plane.is_shadow_catcher = True
    bpy.context.view_layer.update()
    return plane


def add_top_camera(name, center, ortho_size, height):
    bpy.ops.object.camera_add(location=three_vec((center[0], height, center[2])))
    cam = bpy.context.object
    cam.name = name
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = ortho_size
    direction = three_vec(center) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def load_live_transforms():
    import json
    return json.loads((ROOT / ".tmp-qa" / "live_transforms.json").read_text())


LIVE_TRANSFORMS = None


def apply_live_transform(root, key):
    """Place an imported glb root exactly like the live site (world TRS)."""
    global LIVE_TRANSFORMS
    if LIVE_TRANSFORMS is None:
        LIVE_TRANSFORMS = load_live_transforms()
    t = LIVE_TRANSFORMS[key]
    px, py, pz = t["position"]
    qx, qy, qz, qw = t["quaternion"]
    sx, sy, sz = t["scale"]
    yaw = 2.0 * math.atan2(qy, qw)
    root.rotation_euler = (0.0, 0.0, yaw)
    root.scale = (sx, sz, sy)
    root.location = three_vec((px, py, pz))
    bpy.context.view_layer.update()
    # self-check against the site's world bbox
    b = bounds(root)
    if b is not None:
        mins, maxs, _ = b
        t_min = t["bboxMin"]; t_max = t["bboxMax"]
        exp_min = Vector((t_min[0], -t_max[2], t_min[1]))
        exp_max = Vector((t_max[0], -t_min[2], t_max[1]))
        err = max((mins - exp_min).length, (maxs - exp_max).length)
        print(f"[live-transform] {key}: bbox error {err:.4f} m")
    return root


def make_room_objects(include_floor_lamp=True, floor_only=False):
    objects = []

    desk = import_gltf(ROOT / "public/models/OfficeDesk/office_desk.glb", "OfficeDesk")
    remove_children(desk, lambda obj: "reviste" in obj.name.lower() or obj.name.lower() == "group_2")
    apply_live_transform(desk, "OfficeDeskModel")
    objects.append(desk)

    chair = import_gltf(ROOT / "public/models/AppleDesk/ModernChair/modern_chair.glb", "ModernChair")
    apply_live_transform(chair, "ModernErgonomicChairModel")
    objects.append(chair)

    if include_floor_lamp:
        floor_lamp = import_gltf(ROOT / "public/models/AppleDesk/FloorLamp/rita_floor_lamp.glb", "FloorLamp")
        remove_children(
            floor_lamp,
            lambda obj: "plane001_floor" in obj.name.lower()
            or any(
                slot.material and slot.material.name.lower() == "floor"
                for slot in getattr(obj, "material_slots", [])
            ),
        )
        apply_live_transform(floor_lamp, "RitaFloorLampModel")
        objects.append(floor_lamp)

    if floor_only:
        disable_floor_tabletop_shadow(desk)
        for obj in objects:
            hide_camera_but_cast(obj)
        return objects

    riser = import_gltf(ROOT / "public/models/AppleDesk/MonitorRaiser/monitor_raiser.glb", "MonitorRaiser")
    apply_live_transform(riser, "WoodMonitorRaiserModel")
    objects.append(riser)

    display = import_gltf(ROOT / "public/models/AppleDesk/StudioDisplay/studio_display.glb", "StudioDisplay")
    apply_live_transform(display, "StudioDisplayModel")
    objects.append(display)

    mac = import_gltf(ROOT / "public/models/AppleDesk/MacStudio/mac_studio.glb", "MacStudio")
    apply_live_transform(mac, "MacStudioModel")
    objects.append(mac)

    keyboard = import_gltf(ROOT / "public/models/AppleDesk/Keyboard/keyboard.glb", "Keyboard")
    apply_live_transform(keyboard, "KeyboardModel")
    objects.append(keyboard)

    mouse = import_gltf(ROOT / "public/models/AppleDesk/Mouse/mouse.glb", "Mouse")
    apply_live_transform(mouse, "MouseModel")
    objects.append(mouse)

    homepod = import_gltf(ROOT / "public/models/AppleDesk/HomePodMini/homepod_mini.glb", "HomePodMini")
    apply_live_transform(homepod, "HomePodMiniModel")
    objects.append(homepod)

    plant = import_gltf(ROOT / "public/models/AppleDesk/PottedPlant/mini_plant.glb", "PottedPlant")
    apply_live_transform(plant, "PottedPlantModel")
    objects.append(plant)

    for obj in objects:
        hide_camera_but_cast(obj)
    if floor_only:
        disable_floor_tabletop_shadow(desk)
    return objects


def read_png_rgba(path):
    data = Path(path).read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")
    pos = 8
    raw = b""
    width = height = None
    while pos < len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        pos += 4
        chunk_type = data[pos : pos + 4]
        pos += 4
        chunk = data[pos : pos + length]
        pos += length + 4
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, *_ = struct.unpack(">IIBBBBB", chunk)
            if bit_depth != 8 or color_type != 6:
                raise ValueError(f"{path} must be 8-bit RGBA")
        elif chunk_type == b"IDAT":
            raw += chunk
        elif chunk_type == b"IEND":
            break

    decoded = zlib.decompress(raw)
    stride = width * 4
    rows = []
    cursor = 0
    previous = [0] * stride
    for _ in range(height):
        filter_type = decoded[cursor]
        cursor += 1
        scan = list(decoded[cursor : cursor + stride])
        cursor += stride
        row = [0] * stride
        for index, value in enumerate(scan):
            left = row[index - 4] if index >= 4 else 0
            up = previous[index]
            up_left = previous[index - 4] if index >= 4 else 0
            if filter_type == 0:
                decoded_value = value
            elif filter_type == 1:
                decoded_value = value + left
            elif filter_type == 2:
                decoded_value = value + up
            elif filter_type == 3:
                decoded_value = value + ((left + up) // 2)
            elif filter_type == 4:
                prediction = left + up - up_left
                candidates = (left, up, up_left)
                distances = [abs(prediction - item) for item in candidates]
                decoded_value = value + candidates[distances.index(min(distances))]
            else:
                raise ValueError(f"Unsupported PNG filter {filter_type}")
            row[index] = decoded_value & 255
        rows.append(row)
        previous = row
    return width, height, rows


def write_png_rgba(path, width, height, rows):
    def chunk(kind, payload):
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    raw = b"".join(bytes([0]) + bytes(row) for row in rows)
    payload = b"\x89PNG\r\n\x1a\n"
    payload += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    payload += chunk(b"IDAT", zlib.compress(raw, 9))
    payload += chunk(b"IEND", b"")
    Path(path).write_bytes(payload)


def blur_alpha(rows, width, height, radius):
    if radius <= 0:
        return rows
    alpha = [[row[x * 4 + 3] for x in range(width)] for row in rows]
    horizontal = [[0] * width for _ in range(height)]
    for y in range(height):
        prefix = [0]
        for value in alpha[y]:
            prefix.append(prefix[-1] + value)
        for x in range(width):
            left = max(0, x - radius)
            right = min(width - 1, x + radius)
            horizontal[y][x] = (prefix[right + 1] - prefix[left]) // (right - left + 1)

    vertical = [[0] * width for _ in range(height)]
    for x in range(width):
        prefix = [0]
        for y in range(height):
            prefix.append(prefix[-1] + horizontal[y][x])
        for y in range(height):
            top = max(0, y - radius)
            bottom = min(height - 1, y + radius)
            vertical[y][x] = (prefix[bottom + 1] - prefix[top]) // (bottom - top + 1)

    blurred = []
    for y, row in enumerate(rows):
        out = row[:]
        for x in range(width):
            out[x * 4 + 3] = vertical[y][x]
        blurred.append(out)
    return blurred


def blur_alpha_xy(rows, width, height, radius_x, radius_y):
    if radius_x <= 0 and radius_y <= 0:
        return rows
    alpha = [[row[x * 4 + 3] for x in range(width)] for row in rows]
    horizontal = [[0] * width for _ in range(height)]

    if radius_x <= 0:
        horizontal = [row[:] for row in alpha]
    else:
        for y in range(height):
            prefix = [0]
            for value in alpha[y]:
                prefix.append(prefix[-1] + value)
            for x in range(width):
                left = max(0, x - radius_x)
                right = min(width - 1, x + radius_x)
                horizontal[y][x] = (prefix[right + 1] - prefix[left]) // (
                    right - left + 1
                )

    vertical = [[0] * width for _ in range(height)]
    if radius_y <= 0:
        vertical = [row[:] for row in horizontal]
    else:
        for x in range(width):
            prefix = [0]
            for y in range(height):
                prefix.append(prefix[-1] + horizontal[y][x])
            for y in range(height):
                top = max(0, y - radius_y)
                bottom = min(height - 1, y + radius_y)
                vertical[y][x] = (prefix[bottom + 1] - prefix[top]) // (
                    bottom - top + 1
                )

    blurred = []
    for y, row in enumerate(rows):
        out = row[:]
        for x in range(width):
            out[x * 4 + 3] = vertical[y][x]
        blurred.append(out)
    return blurred


def normalize_shadow(path, cap, threshold, gamma, blur_radius):
    width, height, rows = read_png_rgba(path)
    normalized = []
    for row in rows:
        out = [0] * len(row)
        for index in range(0, len(row), 4):
            source_alpha = row[index + 3]
            if source_alpha <= threshold:
                alpha = 0
            else:
                amount = (source_alpha - threshold) / (255 - threshold)
                alpha = min(cap, int((amount**gamma) * cap))
            out[index : index + 4] = [0, 0, 0, alpha]
        normalized.append(out)
    normalized = blur_alpha(normalized, width, height, blur_radius)
    write_png_rgba(path, width, height, normalized)


def directional_blur_shadow(path, radius_x, radius_y):
    width, height, rows = read_png_rgba(path)
    rows = blur_alpha_xy(rows, width, height, radius_x, radius_y)
    write_png_rgba(path, width, height, rows)


def scale_shadow_alpha(path, multiplier, cap):
    width, height, rows = read_png_rgba(path)
    scaled = []
    for row in rows:
        out = row[:]
        for index in range(0, len(row), 4):
            out[index + 3] = min(cap, int(row[index + 3] * multiplier))
        scaled.append(out)
    write_png_rgba(path, width, height, scaled)


def combine_shadow_alpha(base_path, overlay_path, overlay_multiplier=1.0, cap=255):
    base_width, base_height, base_rows = read_png_rgba(base_path)
    overlay_width, overlay_height, overlay_rows = read_png_rgba(overlay_path)
    if (base_width, base_height) != (overlay_width, overlay_height):
        raise ValueError("Shadow maps must have the same dimensions")

    combined = []
    for base_row, overlay_row in zip(base_rows, overlay_rows):
        out = base_row[:]
        for index in range(0, len(base_row), 4):
            base_alpha = base_row[index + 3]
            overlay_alpha = int(overlay_row[index + 3] * overlay_multiplier)
            out[index : index + 4] = [
                0,
                0,
                0,
                min(cap, base_alpha + overlay_alpha),
            ]
        combined.append(out)
    write_png_rgba(base_path, base_width, base_height, combined)


def tint_shadow_rgb(path, rgb):
    width, height, rows = read_png_rgba(path)
    tinted = []
    for row in rows:
        out = row[:]
        for index in range(0, len(row), 4):
            out[index : index + 3] = list(rgb)
        tinted.append(out)
    write_png_rgba(path, width, height, tinted)


def contact_mask_material():
    mat = bpy.data.materials.new("contact footprint mask")
    mat.diffuse_color = (0, 0, 0, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0, 0, 0, 1)
        bsdf.inputs["Alpha"].default_value = 1
        bsdf.inputs["Roughness"].default_value = 1
    mat.blend_method = "OPAQUE"
    return mat


def filter_contact_footprint_meshes(objects):
    mat = contact_mask_material()
    bpy.context.view_layer.update()
    for root in objects:
        root_name = root.name.lower()
        for obj in root.children_recursive:
            if obj.type != "MESH":
                continue
            material_names = {
                slot.material.name.lower() for slot in obj.material_slots if slot.material
            }
            corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
            min_z = min(corner.z for corner in corners)
            max_z = max(corner.z for corner in corners)
            size_x = max(corner.x for corner in corners) - min(corner.x for corner in corners)
            size_y = max(corner.y for corner in corners) - min(corner.y for corner in corners)
            touches_floor = min_z <= 0.12
            is_paper_stack = any(
                "dwell" in name or "magazine" in name for name in material_names
            )
            is_long_desk_strip = (
                "officedesk" in root_name
                and size_x > 0.72
                and size_y < 0.09
                and max_z > 0.24
            )
            too_large_surface = size_x > 2.2 and size_y > 1.0 and max_z > 0.35
            keep = (
                touches_floor
                and not too_large_surface
                and not is_paper_stack
                and not is_long_desk_strip
            )
            obj.hide_render = not keep
            obj.visible_camera = keep
            obj.visible_shadow = False
            obj.data.materials.clear()
            obj.data.materials.append(mat)


def render_contact_shadow_map(name, output_path, center, ortho_size, camera_height):
    clear_scene()
    setup_render(samples=64)
    objects = make_room_objects(include_floor_lamp=True, floor_only=True)
    filter_contact_footprint_meshes(objects)
    add_top_camera(f"{name} camera", center, ortho_size, camera_height)
    bpy.context.scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)


def filter_desk_contact_meshes(objects):
    mat = contact_mask_material()
    bpy.context.view_layer.update()
    for root in objects:
        root_name = root.name.lower()
        skip_root = (
            "officedesk" in root_name
            or "modernchair" in root_name
            or "studiodisplay" in root_name
        )
        for obj in root.children_recursive:
            if obj.type != "MESH":
                continue
            corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
            min_z = min(corner.z for corner in corners)
            max_z = max(corner.z for corner in corners)
            size_x = max(corner.x for corner in corners) - min(corner.x for corner in corners)
            size_y = max(corner.y for corner in corners) - min(corner.y for corner in corners)
            touches_desk = (
                min_z <= DESK_SURFACE_Y + 0.085
                and max_z >= DESK_SURFACE_Y - 0.005
            )
            too_large_surface = size_x > 1.55 and size_y > 0.62
            keep = touches_desk and not too_large_surface and not skip_root
            obj.hide_render = not keep
            obj.visible_camera = keep
            obj.visible_shadow = False
            obj.data.materials.clear()
            obj.data.materials.append(mat)


def render_desk_contact_shadow_map(name, output_path, center, ortho_size, camera_height, res_y=None):
    clear_scene()
    setup_render(samples=64)
    if res_y:
        bpy.context.scene.render.resolution_y = res_y
    objects = make_room_objects(include_floor_lamp=False, floor_only=False)
    filter_desk_contact_meshes(objects)
    add_top_camera(f"{name} camera", center, ortho_size, camera_height)
    bpy.context.scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)


def render_shadow_map(
    name,
    output_path,
    center,
    plane_size,
    ortho_size,
    camera_height,
    floor_only=False,
    light_mode="room",
    desk_surface=False,
    res_y=None,
):
    clear_scene()
    setup_render()
    if res_y:
        bpy.context.scene.render.resolution_y = res_y
    make_shadow_catcher(f"{name} shadow catcher", center, plane_size)
    add_light_rig(light_mode)
    objects = make_room_objects(include_floor_lamp=not desk_surface, floor_only=floor_only)
    if desk_surface:
        for root in objects:
            root_name = root.name.lower()
            if (
                "officedesk" in root_name
                or "modernchair" in root_name
                or "floorlamp" in root_name
            ):
                set_shadow_visibility(root, False)
    add_top_camera(f"{name} camera", center, ortho_size, camera_height)
    bpy.context.scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)


target = os.environ.get("BAKE_TARGET", "all").strip().lower()
floor_path = OUT_DIR / "real_room_floor_shadow.png"
floor_surface_path = OUT_DIR / "real_room_floor_baked_surface.png"
desk_path = OUT_DIR / "real_desk_surface_shadow.png"
desk_surface_path = OUT_DIR / "real_desk_baked_surface.png"
floor_contact_path = QA_DIR / "real_room_floor_contact_shadow.png"
floor_pin_contact_path = QA_DIR / "real_room_floor_pin_contact_shadow.png"
desk_contact_path = QA_DIR / "real_desk_surface_contact_shadow.png"
desk_pin_contact_path = QA_DIR / "real_desk_surface_pin_contact_shadow.png"


def smoothstep(edge0, edge1, value):
    if edge0 == edge1:
        return 1.0 if value >= edge1 else 0.0
    amount = max(0.0, min(1.0, (value - edge0) / (edge1 - edge0)))
    return amount * amount * (3.0 - 2.0 * amount)


def make_floor_baked_surface(shadow_path, output_path):
    """Create a Henry-style visible baked floor patch from the Blender shadow map."""
    width, height, rows = read_png_rgba(shadow_path)
    baked = []
    for y, row in enumerate(rows):
        out = row[:]
        ny = (y / max(1, height - 1)) * 2.0 - 1.0
        for x in range(width):
            nx = (x / max(1, width - 1)) * 2.0 - 1.0
            index = x * 4
            shadow_alpha = row[index + 3]

            # Soft oval stage under the room, so the shadow reads as part of an
            # environment texture instead of a loose transparent decal.
            radius = math.sqrt((nx * 0.86) ** 2 + (ny * 1.12) ** 2)
            stage = 1.0 - smoothstep(0.48, 1.06, radius)
            vertical_falloff = 1.0 - smoothstep(0.12, 1.0, abs(ny))
            edge = edge_feather(x, y, width, height, feather=0.16)
            floor_alpha = int(70 * stage * (0.7 + 0.3 * vertical_falloff))  # warm interior pool

            shadow_strength = shadow_alpha / 255.0
            broad_shadow = shadow_strength**1.15
            contact_shadow = smoothstep(0.16, 0.38, shadow_strength)
            shadow_alpha_boost = int(
                min(196, shadow_alpha * 1.12 + contact_shadow * 88)
            )
            alpha = int(max(floor_alpha, shadow_alpha_boost) * edge)

            # Neutral off-white floor, darkened by the baked shadow. Keep it
            # close to the void color, but strong enough to ground the furniture.
            base = (237, 233, 226)
            warm_noise = ((x * 17 + y * 31) % 23) - 11
            darken = broad_shadow * 82 + contact_shadow * 58
            out[index : index + 4] = [
                max(0, min(255, int(base[0] - darken * 0.86 + warm_noise * 0.18))),
                max(0, min(255, int(base[1] - darken * 0.94 + warm_noise * 0.15))),
                max(0, min(255, int(base[2] - darken * 1.02 + warm_noise * 0.12))),
                alpha,
            ]
        baked.append(out)
    write_png_rgba(output_path, width, height, baked)


def edge_feather(x, y, width, height, feather=0.055):
    nx = x / max(1, width - 1)
    ny = y / max(1, height - 1)
    return min(
        smoothstep(0.0, feather, nx),
        smoothstep(0.0, feather, ny),
        smoothstep(0.0, feather, 1.0 - nx),
        smoothstep(0.0, feather, 1.0 - ny),
    )


def make_desk_baked_surface(shadow_path, output_path):
    """Bake the desktop itself, not only a separate grey shadow decal."""
    width, height, rows = read_png_rgba(shadow_path)
    baked = []
    for y, row in enumerate(rows):
        out = row[:]
        ny = y / max(1, height - 1)
        for x in range(width):
            index = x * 4
            shadow_alpha = row[index + 3]
            shadow_strength = shadow_alpha / 255.0
            broad_shadow = shadow_strength**1.1
            contact_shadow = smoothstep(0.08, 0.26, shadow_strength)
            feather = edge_feather(x, y, width, height, feather=0.085)

            # Keep the surface almost identical to the white tabletop, but let
            # Blender's contact map carry the grounding around objects.
            warm_noise = ((x * 13 + y * 29) % 17) - 8
            light_gradient = (0.5 - ny) * 3.2
            base = (248, 245, 240)
            darken = broad_shadow * 46 + contact_shadow * 64
            base_alpha = 0  # no veil: any base tint on this plane shows edge-on at the desk rim
            contact_alpha = int(min(248, shadow_alpha * 1.45 + contact_shadow * 112))
            alpha = int(max(base_alpha, contact_alpha) * feather)

            out[index : index + 4] = [
                max(0, min(255, int(base[0] - darken * 0.78 + warm_noise * 0.14 + light_gradient))),
                max(0, min(255, int(base[1] - darken * 0.9 + warm_noise * 0.12 + light_gradient))),
                max(0, min(255, int(base[2] - darken * 1.0 + warm_noise * 0.1 + light_gradient))),
                alpha,
            ]
        baked.append(out)
    write_png_rgba(output_path, width, height, baked)

if target in {"all", "floor"}:
    render_shadow_map(
        "floor",
        floor_path,
        (0, 0.004, world_z(desk_z(-3.42))),
        (6.4, 6.4),
        6.4,
        5.8,
        floor_only=True,
        light_mode="floor-contact",
    )
    normalize_shadow(floor_path, cap=126, threshold=6, gamma=1.1, blur_radius=64)
    scale_shadow_alpha(floor_path, multiplier=2.1, cap=118)
    directional_blur_shadow(floor_path, radius_x=18, radius_y=62)
    render_contact_shadow_map(
        "floor contact",
        floor_contact_path,
        (0, 0.004, world_z(desk_z(-3.42))),
        6.4,
        5.8,
    )
    normalize_shadow(floor_contact_path, cap=52, threshold=14, gamma=0.95, blur_radius=44)
    combine_shadow_alpha(floor_path, floor_contact_path, overlay_multiplier=0.6, cap=132)

    render_contact_shadow_map(
        "floor pin contact",
        floor_pin_contact_path,
        (0, 0.004, world_z(desk_z(-3.42))),
        6.4,
        5.8,
    )
    normalize_shadow(floor_pin_contact_path, cap=64, threshold=4, gamma=0.82, blur_radius=12)
    combine_shadow_alpha(floor_path, floor_pin_contact_path, overlay_multiplier=0.24, cap=138)
    tint_shadow_rgb(floor_path, (52, 54, 58))
    make_floor_baked_surface(floor_path, floor_surface_path)

if target in {"all", "desk"}:
    render_shadow_map(
        "desk",
        desk_path,
        (0, DESK_SURFACE_Y + 0.018, world_z(desk_z(-3.66))),
        (3.55, 1.72),
        3.55,
        3.2,
        floor_only=False,
        light_mode="floor-contact",
        desk_surface=True,
        res_y=992,
    )
    normalize_shadow(desk_path, cap=112, threshold=8, gamma=1.18, blur_radius=26)
    render_desk_contact_shadow_map(
        "desk contact",
        desk_contact_path,
        (0, DESK_SURFACE_Y + 0.018, world_z(desk_z(-3.66))),
        3.55,
        3.2,
        res_y=992,
    )
    normalize_shadow(desk_contact_path, cap=58, threshold=12, gamma=0.9, blur_radius=30)
    combine_shadow_alpha(desk_path, desk_contact_path, overlay_multiplier=0.68, cap=140)

    render_desk_contact_shadow_map(
        "desk pin contact",
        desk_pin_contact_path,
        (0, DESK_SURFACE_Y + 0.018, world_z(desk_z(-3.66))),
        3.55,
        3.2,
        res_y=992,
    )
    normalize_shadow(desk_pin_contact_path, cap=86, threshold=4, gamma=0.78, blur_radius=13)
    combine_shadow_alpha(desk_path, desk_pin_contact_path, overlay_multiplier=0.44, cap=156)
    tint_shadow_rgb(desk_path, (54, 56, 60))
    make_desk_baked_surface(desk_path, desk_surface_path)

if target in {"surfaces", "surface"}:
    make_floor_baked_surface(floor_path, floor_surface_path)
    make_desk_baked_surface(desk_path, desk_surface_path)

bpy.ops.wm.save_as_mainfile(filepath=str(QA_DIR / "jianwei_real_room_shadow_bake_v2.blend"))
