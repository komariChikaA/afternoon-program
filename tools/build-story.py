"""Compile authored chapters into VNUI's direct-file project and JSON mirrors."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORDER = ['prologue', 'day1', 'day2', 'afternoon_a', 'reset', 'loop2_day1', 'loop2_day2', 'afternoon_b', 'escape', 'home', 'ending']

def build():
    scenes = []
    for chapter in ORDER:
        data = json.loads((ROOT / 'story' / (chapter + '.json')).read_text(encoding='utf-8'))
        for i, node in enumerate(data):
            node.setdefault('id', f'{chapter.replace("_", "-")}-{i:03}')
            node['chapter'] = chapter
            node.setdefault('background', {'src': 'assets/generated/bg/' + node.pop('bg', 'living') + '.svg'})
            if 'text' in node:
                node['dialogue'] = {'name': node.pop('speaker', ''), 'text': node.pop('text'), 'style': {
                    'x': .06, 'y': .735, 'width': .88, 'height': .205, 'opacity': .92,
                    'color': '#191e1c', 'blur': 0, 'radius': 2, 'fontFamily': '"Noto Serif SC", "Songti SC", "SimSun", serif', 'fontSize': 30}, 'animation': 'none'}
            node.setdefault('camera', {'zoom': 1, 'x': 0, 'y': 0})
            node.setdefault('hotspots', [])
            scenes.append(node)
    ids = {s['id'] for s in scenes}
    assert len(ids) == len(scenes), 'Duplicate scene id'
    for s in scenes:
        for choice in s.get('choices', []):
            assert choice.get('to', s['id']) in ids, choice
        if s.get('next'):
            assert s['next'] in ids, s
        assert (ROOT / s['background']['src']).is_file(), s['background']
    timeline = [{'scene': s['id'], 'duration': max(3500, len(s.get('dialogue', {}).get('text', '')) * 160 + 1800), 'transition': 'cut', 'transitionDuration': 0} for s in scenes]
    credits=json.loads((ROOT/'assets/source/attribution.json').read_text(encoding='utf-8')) if (ROOT/'assets/source/attribution.json').exists() else []
    project = {'meta': {'title': '下午的节目', 'mode': 'style', 'width': 1920, 'height': 1080, 'storyVersion': 1, 'credits':credits},
               'settings': {'typingSpeed': 38, 'advanceKeys': ['Space', 'Enter'], 'fit': 'contain'}, 'scenes': scenes, 'timeline': timeline}
    (ROOT / 'project.js').write_text('window.VN_PROJECT = ' + json.dumps(project, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    (ROOT / 'scenes/scene.json').write_text(json.dumps(scenes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'timeline/timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(scenes)} scenes, {sum(len(s.get("dialogue", {}).get("text", "")) for s in scenes)} dialogue characters, {len(ORDER)} chapters')

if __name__ == '__main__':
    build()
