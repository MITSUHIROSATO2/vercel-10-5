"""
シーン内の全オブジェクトをリスト
"""
import bpy

print('\n' + '='*60)
print('シーン内の全オブジェクト')
print('='*60 + '\n')

# すべてのオブジェクトをリスト
for i, obj in enumerate(bpy.data.objects):
    print(f'{i+1}. {obj.name}')
    print(f'   タイプ: {obj.type}')
    print(f'   表示: {"表示中" if obj.visible_get() else "非表示"}')
    print(f'   位置: ({obj.location.x:.2f}, {obj.location.y:.2f}, {obj.location.z:.2f})')
    
    if obj.parent:
        print(f'   親: {obj.parent.name}')
    
    if obj.children:
        print(f'   子: {[child.name for child in obj.children]}')
    
    print()

print(f'総オブジェクト数: {len(bpy.data.objects)}')
print('='*60)