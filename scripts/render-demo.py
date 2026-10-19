"""Render a captioned 60-second BhuMi demo from the supplied 26-second recording.
Usage: python3 scripts/render-demo.py /path/to/original.mp4
Requires FFmpeg with libx264 and drawtext, and Liberation Sans fonts.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/videos'
OUT.mkdir(exist_ok=True)
SOURCE = Path(sys.argv[1]).resolve()
FONT = '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'
BOLD = '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf'
if not Path(FONT).exists():
    FONT = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
    BOLD = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'

def run(args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)

def text(value, y, size=28, color='white', bold=False, timing=None):
    # All text is controlled editorial copy without filter-language separators.
    value=value.replace("'", "")
    result = f"drawtext=fontfile={BOLD if bold else FONT}:text='{value}':fontsize={size}:fontcolor={color}:x=(w-text_w)/2:y={y}"
    if timing: result += f":enable='between(t,{timing[0]},{timing[1]})'"
    return result

probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(SOURCE)]))
duration=float(probe['format']['duration'])
if not 25 < duration < 28:
    raise SystemExit('This edit is timed for the supplied approximately 26-second recording.')
segments=[
    (0,7.6,'One deed. A clearer ownership story.','The Bangla interface introduces the reconciliation workflow.'),
    (7.6,15.2,'Follow the ownership history','Start with the recorded shares, then inspect the mutation.'),
    (15.2,22.8,'Find differences hidden by a correct total','Compare the expected and recorded shares for each owner.'),
    (22.8,34.2,'Check a corrected sample','The guided demo recalculates and shows a matching result.'),
    (34.2,50,'Explore the judge workspace','Open the fictional parcel scenarios for further review.'),
]
encoding=['-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-r','30','-an','-movflags','+faststart']
with tempfile.TemporaryDirectory(prefix='bhumi-video-') as tmp:
    tmp=Path(tmp)
    for name,title,subtitle,line in [
        ('intro','BhuMi','Land Ownership Reconciliation','Actual site recording  |  Fictional demonstration records'),
        ('outro','Try BhuMi','bhumi.diu.my.id','Choose Enter judge demo to explore the fictional records'),
    ]:
        filters='[1:v]scale=154:154[logo];[0:v][logo]overlay=(W-w)/2:80,'+','.join([
            text(title,270,58,'0x8dd5c2',True),text(subtitle,355,32),text(line,437,23,'0xc5d9df'),
            text('Supports human review. A match does not establish legal title.',600,20,'0x8dd5c2'),
            'fade=t=in:st=0:d=0.35','fade=t=out:st=4.6:d=0.4'
        ])+'[v]'
        run(['-f','lavfi','-i','color=c=0x112f40:s=1280x720:r=30:d=5','-loop','1','-i',str(ROOT/'public/brand/bhumi-symbol.png'),'-filter_complex',filters,'-map','[v]','-t','5',*encoding,str(tmp/f'{name}.mp4')])
    # Remove browser chrome; preserve the complete site viewport at readable scale.
    filters=[f'setpts={50/duration}*(PTS-STARTPTS)','crop=1230:630:38:90','scale=1216:622','pad=1280:720:32:12:color=0x112f40','fps=30']
    for start,end,title,subtitle in segments:
        filters.extend([text(title,650,25,'0x8dd5c2',True,(start,end)),text(subtitle,686,18,'white',timing=(start,end))])
    filters.extend(['fade=t=in:st=0:d=0.25','fade=t=out:st=49.6:d=0.4'])
    run(['-i',str(SOURCE),'-vf',','.join(filters),'-t','50',*encoding,str(tmp/'main.mp4')])
    (tmp/'concat.txt').write_text('\n'.join(f"file '{tmp/name}.mp4'" for name in ['intro','main','outro']))
    run(['-f','concat','-safe','0','-i',str(tmp/'concat.txt'),'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','64k','-t','60','-movflags','+faststart','-map_metadata','-1',str(OUT/'BhuMi_Demo_60s.mp4')])

def stamp(seconds):
    ms=round(seconds*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
cues=[(0,5,'BhuMi — Land Ownership Reconciliation. Actual site recording; fictional demonstration records.')]+[(a+5,b+5,title+'. '+sub) for a,b,title,sub in segments]+[(55,60,'Try bhumi.diu.my.id. Choose Enter judge demo. A match does not establish legal title.')]
(OUT/'BhuMi_Demo_60s.en.srt').write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{words}' for i,(a,b,words) in enumerate(cues,1))+'\n')
print(OUT/'BhuMi_Demo_60s.mp4')
