import bpy
import sys
import os

# Clear existing scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import FBX file
fbx_path = "/Users/satoumitsuhiro/Desktop/東京科学大学/interview/uploads_files_4306156_Man_Grey_Suit_01_Blender/Man_Grey_Suit_01_Blender.Fbx"
glb_path = "/Users/satoumitsuhiro/Desktop/東京科学大学/interview/dental-ai-simulator/public/models/man-grey-suit.glb"

print(f"Importing FBX from: {fbx_path}")
bpy.ops.import_scene.fbx(filepath=fbx_path)

# Get the imported armature/object
imported_objects = [obj for obj in bpy.context.scene.objects]
if not imported_objects:
    print("Error: No objects imported from FBX")
    sys.exit(1)

# Find the armature
armature = None
for obj in imported_objects:
    if obj.type == 'ARMATURE':
        armature = obj
        break

# Scale down the model if needed (FBX files are often in cm)
for obj in imported_objects:
    obj.scale = (0.01, 0.01, 0.01)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Create shape keys for lip sync if they don't exist
mesh_objects = [obj for obj in imported_objects if obj.type == 'MESH']

for mesh_obj in mesh_objects:
    if mesh_obj.data.shape_keys is None:
        # Add basis shape key
        mesh_obj.shape_key_add(name='Basis')
    
    # Add common mouth shape keys for lip sync
    mouth_shapes = {
        'mouthOpen': {'scale': 1.0},  # A, AA
        'mouthSmile': {'scale': 1.0},  # EE, smile
        'mouthFrown': {'scale': 1.0},  # U, OO
        'mouthPucker': {'scale': 1.0},  # O
        'mouthWide': {'scale': 1.0},  # CH, SH
        'mouthPress': {'scale': 1.0},  # M, B, P
        'mouthDimple': {'scale': 1.0},  # small smile
        'mouthLeft': {'scale': 1.0},  # mouth to left
        'mouthRight': {'scale': 1.0},  # mouth to right
        'mouthShrugUpper': {'scale': 1.0},  # upper lip up
        'mouthShrugLower': {'scale': 1.0},  # lower lip down
        'mouthClose': {'scale': 1.0},  # closed mouth
        'jawOpen': {'scale': 1.0},  # jaw open
        'jawLeft': {'scale': 1.0},  # jaw to left
        'jawRight': {'scale': 1.0},  # jaw to right
        'jawForward': {'scale': 1.0},  # jaw forward
        'tongueOut': {'scale': 1.0}  # tongue out
    }
    
    for shape_name in mouth_shapes:
        if shape_name not in mesh_obj.data.shape_keys.key_blocks:
            shape_key = mesh_obj.shape_key_add(name=shape_name)
            shape_key.value = 0.0

# Select all objects for export
bpy.ops.object.select_all(action='SELECT')

# Export as GLB
print(f"Exporting GLB to: {glb_path}")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    export_selected=True,
    export_animations=True,
    export_morph=True,
    export_morph_normal=True,
    export_morph_tangent=True,
    export_materials='EXPORT',
    export_colors=True,
    export_attributes=True,
    use_mesh_edges=False,
    use_mesh_vertices=False,
    export_cameras=False,
    export_lights=False
)

print("Conversion complete!")
print(f"GLB file saved to: {glb_path}")

# List all shape keys created
print("\nShape keys created for lip sync:")
for mesh_obj in mesh_objects:
    if mesh_obj.data.shape_keys:
        print(f"\nObject: {mesh_obj.name}")
        for key in mesh_obj.data.shape_keys.key_blocks:
            print(f"  - {key.name}")