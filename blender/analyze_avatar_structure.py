"""
アバターの現在の構造を分析
"""
import bpy

print("=== アバター構造分析 ===\n")

# オブジェクトの分析
obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    print(f"【オブジェクト情報】")
    print(f"名前: {obj.name}")
    print(f"タイプ: {obj.type}")
    
    # メッシュ情報
    if obj.type == 'MESH':
        mesh = obj.data
        print(f"\n【メッシュ情報】")
        print(f"頂点数: {len(mesh.vertices)}")
        print(f"ポリゴン数: {len(mesh.polygons)}")
        print(f"エッジ数: {len(mesh.edges)}")
        
        # シェイプキー
        if mesh.shape_keys:
            print(f"\n【シェイプキー】")
            print(f"シェイプキー数: {len(mesh.shape_keys.key_blocks)}")
            for key in mesh.shape_keys.key_blocks[:10]:  # 最初の10個
                print(f"  - {key.name}")
            if len(mesh.shape_keys.key_blocks) > 10:
                print(f"  ... 他 {len(mesh.shape_keys.key_blocks) - 10} 個")
    
    # モディファイア
    print(f"\n【モディファイア】")
    print(f"モディファイア数: {len(obj.modifiers)}")
    for mod in obj.modifiers:
        print(f"  - {mod.name} ({mod.type})")
    
    # アーマチュア（ボーン）の確認
    print(f"\n【アーマチュア情報】")
    armature_mod = None
    for mod in obj.modifiers:
        if mod.type == 'ARMATURE':
            armature_mod = mod
            break
    
    if armature_mod and armature_mod.object:
        armature = armature_mod.object
        print(f"アーマチュア名: {armature.name}")
        print(f"ボーン数: {len(armature.data.bones)}")
        
        # 頭部関連のボーンを探す
        head_bones = []
        face_bones = []
        jaw_bones = []
        
        for bone in armature.data.bones:
            bone_name = bone.name.lower()
            if 'head' in bone_name:
                head_bones.append(bone.name)
            elif 'face' in bone_name or 'lip' in bone_name or 'mouth' in bone_name:
                face_bones.append(bone.name)
            elif 'jaw' in bone_name:
                jaw_bones.append(bone.name)
        
        print(f"\n頭部関連ボーン:")
        print(f"  Head: {head_bones}")
        print(f"  Face: {face_bones}")
        print(f"  Jaw: {jaw_bones}")
    else:
        print("アーマチュアが設定されていません")
    
    # 頂点グループ
    print(f"\n【頂点グループ】")
    print(f"頂点グループ数: {len(obj.vertex_groups)}")
    if len(obj.vertex_groups) > 0:
        print("主な頂点グループ:")
        for vg in obj.vertex_groups[:10]:
            print(f"  - {vg.name}")
        if len(obj.vertex_groups) > 10:
            print(f"  ... 他 {len(obj.vertex_groups) - 10} 個")
    
    # 親子関係
    print(f"\n【親子関係】")
    if obj.parent:
        print(f"親オブジェクト: {obj.parent.name}")
    else:
        print("親オブジェクト: なし")
    
    children = [o.name for o in bpy.data.objects if o.parent == obj]
    if children:
        print(f"子オブジェクト: {children}")
    else:
        print("子オブジェクト: なし")

# シーン内の他のオブジェクト
print(f"\n【シーン内の関連オブジェクト】")
for obj in bpy.data.objects:
    if 'avatar' in obj.name.lower() or 'face' in obj.name.lower() or 'head' in obj.name.lower():
        print(f"  - {obj.name} ({obj.type})")

print("\n=== 分析完了 ===")