"""
無題.blendファイル内のオブジェクトを検査するスクリプト
"""
import bpy

print('\n=== Blenderファイル内のオブジェクト一覧 ===')
print(f'ファイル名: {bpy.data.filepath}')
print(f'オブジェクト総数: {len(bpy.data.objects)}')

for obj in bpy.data.objects:
    print(f'\n【オブジェクト名】: {obj.name}')
    print(f'  タイプ: {obj.type}')
    print(f'  位置: ({obj.location.x:.2f}, {obj.location.y:.2f}, {obj.location.z:.2f})')
    print(f'  スケール: ({obj.scale.x:.2f}, {obj.scale.y:.2f}, {obj.scale.z:.2f})')
    
    if obj.type == 'MESH':
        mesh = obj.data
        print(f'  メッシュ情報:')
        print(f'    - 頂点数: {len(mesh.vertices)}')
        print(f'    - エッジ数: {len(mesh.edges)}')
        print(f'    - ポリゴン数: {len(mesh.polygons)}')
        
        # マテリアル情報
        if mesh.materials:
            print(f'  マテリアル:')
            for mat in mesh.materials:
                if mat:
                    print(f'    - {mat.name}')
        
        # シェイプキー情報
        if mesh.shape_keys:
            print(f'  シェイプキー:')
            for key in mesh.shape_keys.key_blocks:
                print(f'    - {key.name} (値: {key.value})')
    
    # 親子関係
    if obj.parent:
        print(f'  親オブジェクト: {obj.parent.name}')
    if obj.children:
        print(f'  子オブジェクト: {[child.name for child in obj.children]}')
    
    # モディファイア
    if obj.modifiers:
        print(f'  モディファイア:')
        for mod in obj.modifiers:
            print(f'    - {mod.name} ({mod.type})')

# シーン情報
print('\n=== シーン情報 ===')
print(f'アクティブシーン: {bpy.context.scene.name}')
print(f'フレームレート: {bpy.context.scene.render.fps}')
print(f'フレーム範囲: {bpy.context.scene.frame_start} - {bpy.context.scene.frame_end}')