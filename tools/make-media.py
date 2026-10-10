"""Build photographic TV placeholders and quiet, deterministic synthesis audio."""
from pathlib import Path
from PIL import Image,ImageOps,ImageEnhance,ImageDraw,ImageFilter
import base64,io,math,random,wave,struct,json
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'assets/generated'

def portrait(name):
    im=Image.open(ROOT/'assets/source/tv'/name).convert('RGB')
    # Public-domain photographic busts are temporary cast placeholders.
    w,h=im.size
    crop=(.22,.10,.76,.49) if name=='elder-left.jpg' else (.22,.015,.72,.51)
    im=im.crop(tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(crop))).resize((150,205),Image.Resampling.LANCZOS)
    im=ImageOps.colorize(ImageOps.grayscale(im),'#384535','#c5c6aa')
    return im

plate=Image.new('RGB',(640,440),'#929a81')
d=ImageDraw.Draw(plate);d.rectangle((0,269,640,440),fill='#65715c')
for cx,name,color in [(175,'elder-left.jpg','#6d7975'),(465,'elder-right.jpg','#897e68')]:
    d.polygon([(cx-100,440),(cx-100,280),(cx-40,250),(cx+40,250),(cx+100,280),(cx+100,440)],fill=color)
    mask=Image.new('L',(150,205));ImageDraw.Draw(mask).ellipse((1,0,149,204),fill=255)
    plate.paste(portrait(name),(cx-75,69),mask)
for mode in ['recording','lowres','still']:
    im=plate.copy()
    if mode=='lowres':im=im.resize((160,110)).resize((640,440),Image.Resampling.NEAREST)
    if mode=='still':
        im=ImageEnhance.Color(im).enhance(.15);im=ImageEnhance.Contrast(im).enhance(.8)
    b=io.BytesIO();im.save(b,format='PNG');encoded=base64.b64encode(b.getvalue()).decode()
    body=f'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" viewBox="0 0 640 440"><image width="640" height="440" href="data:image/png;base64,{encoded}"/><text x="27" y="38" fill="#d6d8bd" font-size="22" font-family="monospace">REC ▷ 14:32</text>'
    if mode=='still':body+='<path d="M0 321H640" stroke="#d3d6b6" stroke-opacity=".24" stroke-width="6"/>'
    (out/'tv'/f'{mode}.svg').write_text(body+'</svg>',encoding='utf-8')
(out/'ui/favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="#263c2b"/><rect x="5" y="7" width="22" height="17" rx="3" fill="#afba91"/><path d="M10 29H22M13 24V29M19 24V29" stroke="#afba91" stroke-width="2"/></svg>',encoding='utf-8')

RATE=22050
random.seed(14032)
def wav(name,length,fn):
    values=[];low=0.
    for i in range(int(RATE*length)):
        t=i/RATE;n=random.uniform(-1,1);low=low*.94+n*.06
        sample=fn(t,n,low)
        # Short fades prevent clicks at edges; looped ambiences are quiet.
        env=min(1,t/.04,(length-t)/.1)
        values.append(max(-32000,min(32000,int(sample*env*16000))))
    with wave.open(str(out/'sfx'/f'{name}.wav'),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(struct.pack('<'+'h'*len(values),*values))
def clock(t):
    q=t%1
    return .35*math.exp(-q*75)*math.sin(2*math.pi*1700*t)
def heartbeat(t):
    q=t%1.12
    return (math.exp(-q*28)+.6*math.exp(-max(0,q-.2)*34)*(q>.2))*math.sin(2*math.pi*53*t)*.45
for name,fn in {
    'house':lambda t,n,l: l*.25+clock(t),
    'program':lambda t,n,l: n*.065+math.sin(2*math.pi*100*t)*.018+clock(t)*.3,
    'kitchen':lambda t,n,l:l*.7+math.sin(2*math.pi*650*t)*math.exp(-(t%1.8)*90)*.10,
    'night':lambda t,n,l:l*.2+clock(t)*.55,
    'quiet':lambda t,n,l:n*.08+math.sin(2*math.pi*80*t)*.05,
    'fear':lambda t,n,l:heartbeat(t)+l*.16*(.5+.5*math.sin(2*math.pi*t/3))+.018*math.sin(2*math.pi*2100*t),
    'home':lambda t,n,l:l*.17+clock(t)*.4,
    'pressure':lambda t,n,l:l*.26+math.sin(2*math.pi*41*t)*.19+heartbeat(t)*.2,
}.items():wav('ambient-'+name,4.48,fn)
wav('cloth',1.5,lambda t,n,l: l*1.25*math.exp(-t*2)+math.sin(2*math.pi*48*t)*.4*math.exp(-t*7)+n*.18*math.exp(-((t-.25)/.15)**2))
wav('wood',.65,lambda t,n,l:math.sin(2*math.pi*(135+t*80)*t)*math.exp(-t*10)*.5+l*.6*math.exp(-t*15))
wav('door',.7,lambda t,n,l:l*1.3*math.exp(-t*16)+math.sin(2*math.pi*80*t)*.2*math.exp(-t*10))
wav('applause',2,lambda t,n,l:n*.34*max(0,math.sin(2*math.pi*t*6))**8*math.exp(-t*.7))
wav('howl',3.5,lambda t,n,l:(math.sin(2*math.pi*(170*t+45*math.sin(t*1.5)))+.15*math.sin(2*math.pi*540*t))*.24*math.sin(math.pi*t/3.5)**2+l*.2)
print('Photographic TV modes and 13 generated WAV effects/ambiences ready')
