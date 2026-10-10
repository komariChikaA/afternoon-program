"""Reproducible photo composites; originals and credits remain in assets/source.

No generated bodies or illustrated crime-scene props. Masks, wet stains,
contact shadows and grading are raster operations on the licensed photographs.
Run after make-photo-art.py; this supersedes its living/ending/TV plates.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageDraw
import numpy as np
import cv2
import base64, io, math, random, wave

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets/source'
OUT = ROOT / 'assets/generated'
W, H = 1920, 1080
rng = np.random.default_rng(1432)

def wrapper(im, path):
    buf = io.BytesIO()
    im.convert('RGB').save(buf, 'JPEG', quality=93)
    enc = base64.b64encode(buf.getvalue()).decode()
    path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{im.width}" height="{im.height}" viewBox="0 0 {im.width} {im.height}"><image width="100%" height="100%" href="data:image/jpeg;base64,{enc}"/></svg>', encoding='utf-8')

def grade(im, brightness=.82):
    im = ImageEnhance.Color(im.convert('RGB')).enhance(.5)
    im = ImageEnhance.Brightness(im).enhance(brightness)
    im = Image.blend(im, Image.new('RGB', im.size, '#44493e'), .06)
    a = np.array(im).astype(float)
    y,x = np.indices(a.shape[:2])
    vignette = np.clip(1 - .24*((x/im.width-.5)**2+(y/im.height-.45)**2)*2, .6, 1)
    a = a*vignette[:,:,None] + rng.normal(0,.7,a.shape[:2])[:,:,None]
    return Image.fromarray(np.uint8(np.clip(a,0,255)))

def room(name, night=False):
    im = Image.open(SRC/'rooms'/f'{name}.jpg').convert('RGB')
    if name=='living':
        # Remove exhibition signage using a mask and surrounding wall pixels.
        a=np.array(im); h,w=a.shape[:2]; mask=np.zeros((h,w),np.uint8)
        for poly in [[(0,0),(.145,0),(.165,.36),(0,.40)],[(.125,0),(.248,0),(.275,.32),(.156,.37)],[(.232,.05),(.28,.04),(.285,.27),(.247,.30)],[(.321,.07),(.385,.07),(.395,.245),(.33,.245)],[(.807,.06),(.91,.05),(.9,.276),(.785,.27)],[(.944,.065),(1,.057),(1,.28),(.922,.27)],[(.802,.3),(1,.31),(1,.48),(.779,.46)]]:
            pts=np.array([(round(x*w),round(y*h)) for x,y in poly],np.int32)
            cv2.fillPoly(mask,[pts],255)
        # Clone a clear vertical board instead of smearing the large signs.
        wood=im.crop((int(w*.395),0,int(w*.428),int(h*.41)))
        texture=Image.new('RGB',im.size)
        wood=wood.resize((58,int(h*.43)))
        for xx in range(0,w,58):
            for yy in range(0,h,wood.height):texture.paste(wood,(xx,yy))
        im.paste(texture,(0,0),Image.fromarray(mask).filter(ImageFilter.GaussianBlur(1)))
    im=ImageOps.fit(im,(W,H),centering=(.5,.46))
    im=grade(im,.84 if name=='living' else .88)
    if night:im=Image.blend(im,Image.new('RGB',im.size,'#070b0b'),.76)
    return im

def garment(name, tint=None):
    im=Image.open(SRC/'props'/f'{name}.jpg').convert('RGB')
    a=np.array(im); h,w=a.shape[:2]
    if name=='shirt':
        mask=np.uint8(np.min(a,axis=2)>65)*255
        n,lab,stats,_=cv2.connectedComponentsWithStats(mask)
        mask=np.uint8(lab==(1+np.argmax(stats[1:,4])))*255
    elif name=='scarf':mask=np.uint8((a[:,:,2].astype(int)-a[:,:,0].astype(int)>12)&(a[:,:,0]<185))*255
    elif name=='jeans':
        hsv=cv2.cvtColor(a,cv2.COLOR_RGB2HSV)
        mask=np.uint8((hsv[:,:,0]>85)&(hsv[:,:,0]<125)&(hsv[:,:,1]>45))*255
    else:
        mask=np.zeros((h,w),np.uint8)
        cv2.fillPoly(mask,[np.array([(0,0),(int(w*.93),0),(int(w*.89),h),(int(w*.08),h)],np.int32)],255)
    mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
    mask=Image.fromarray(mask).filter(ImageFilter.GaussianBlur(.6))
    im=ImageEnhance.Color(im).enhance(.35)
    if tint:
        tex=ImageOps.colorize(ImageOps.grayscale(im),'#19201f',tint)
        im=Image.blend(im,tex,.78)
    im=ImageEnhance.Brightness(im).enhance(.78)
    im=im.convert('RGBA');im.putalpha(mask)
    return im.crop(im.getbbox())

def paste_prop(canvas, prop, box, angle=0, shadow=8, light=1):
    x,y,w,h=box
    p=prop.resize((w,h),Image.Resampling.LANCZOS).rotate(angle,Image.Resampling.BICUBIC,expand=True)
    if light!=1:
        alpha=p.getchannel('A');p=ImageEnhance.Brightness(p).enhance(light);p.putalpha(alpha)
    x-=int((p.width-w)/2);y-=int((p.height-h)/2)
    sh=Image.new('RGBA',p.size,(0,0,0,0));sh.putalpha(p.getchannel('A').point(lambda v:int(v*.55)).filter(ImageFilter.GaussianBlur(shadow)))
    canvas.paste(sh,(x+3,y+6),sh);canvas.paste(p,(x,y),p)

def stain(canvas, cx,cy,rx,ry,seed=1):
    # Correlated noise controls the perimeter and thin runoff; texture and light
    # are inherited from the floor through multiply and a translucent wet layer.
    gen=np.random.default_rng(seed); y,x=np.indices((H,W))
    noise=cv2.resize(gen.random((34,60)).astype('float32'),(W,H),interpolation=cv2.INTER_CUBIC)
    d=((x-cx)/rx)**2+((y-cy)/ry)**2
    m=np.clip((1-d+(.5-noise)*1.15)*8,0,1)
    for i in range(90):
        px=int(cx+gen.normal(0,rx*.75));py=int(cy+gen.normal(0,ry*.7))
        if 0<=px<W and 0<=py<H:
            radius=int(gen.integers(1,7));dot=np.zeros_like(m);cv2.ellipse(dot,(px,py),(radius,max(1,radius//2)),0,0,360,float(gen.uniform(.45,.85)),-1);m=np.maximum(m,dot)
    m=cv2.GaussianBlur(m.astype('float32'),(3,3),.4)
    a=np.array(canvas).astype(float); tex=cv2.cvtColor(a.astype('uint8'),cv2.COLOR_RGB2GRAY)/255
    blood=a*np.array([.32,.08,.07])+np.array([10,3,3])
    alpha=m[:,:,None]*.96
    a=a*(1-alpha)+blood*alpha
    # Small directional highlights, restricted to the thin liquid border.
    rim=np.clip(cv2.Laplacian(m,cv2.CV_32F),0,.025)
    a+=rim[:,:,None]*np.array([19,15,12])
    canvas.paste(Image.fromarray(np.uint8(np.clip(a,0,255))))

# Physical television: one genuine cabinet photo shared by all screen modes.
crt=Image.open(SRC/'props/crt.jpg').convert('RGB').crop((40,40,1265,910))
mask=Image.new('L',crt.size);d=ImageDraw.Draw(mask)
d.polygon([(7,11),(1217,9),(1219,807),(1167,832),(1010,832),(1009,867),(211,867),(211,836),(33,829)],fill=255)
crt=grade(crt,.60).convert('RGBA');crt.putalpha(mask.filter(ImageFilter.GaussianBlur(.6)))
crt.save(OUT/'tv/cabinet.png')
shirt=garment('shirt');coat=garment('shirt','#778b8d');pants=garment('jeans');scarf=garment('scarf')
for name,p in [('shirt',shirt),('coat',coat),('jeans',pants),('scarf',scarf)]:p.save(OUT/'cg'/f'{name}-cutout.png')

base=room('living')
# Close shot uses an undecorated photographic wall so the wide-shot cabinet
# cannot appear as a second television behind the enlarged physical cabinet.
close_wall=ImageOps.fit(base.crop((50,0,980,520)),(W,H))
wrapper(close_wall,OUT/'bg/tv-close.svg')
paste_prop(base,crt,(80,138,500,355),shadow=9)
# Keep wall photograph placement constant across loops.
family_source=Image.open(SRC/'tv/family.jpg').convert('RGB')
fw,fh=family_source.size
family_source=family_source.crop((int(fw*.435),int(fh*.23),int(fw*.98),int(fh*.95)))
family=ImageOps.fit(family_source,(1060,700))
family=ImageOps.colorize(ImageOps.grayscale(family),'#292720','#d5c9a9')
family_repeat=family.copy()
# Remove the rightmost adult with adjacent shrub/path pixels, keeping the
# original group photograph, the remaining four adults and the held child.
a=np.array(family_repeat);mask=np.zeros(a.shape[:2],np.uint8)
cv2.fillPoly(mask,[np.array([(850,225),(990,215),(1040,510),(1000,700),(820,700),(817,480)],np.int32)],255)
a=cv2.inpaint(a,mask,7,cv2.INPAINT_TELEA)
family_repeat=Image.fromarray(a)
# Pencil markings are an authored clue on the print, not a replacement face.
d=ImageDraw.Draw(family_repeat)
for dx in [-3,0,3]:d.line([(775+dx,251),(800+dx,258),(803+dx,276),(787+dx,284),(774+dx,268),(775+dx,251)],fill='#514f43',width=2)
def family_frame(repeat=False,size=(334,230)):
    f=Image.new('RGB',(1108,748),'#302920');f.paste(family_repeat if repeat else family,(24,24))
    return f.resize(size,Image.Resampling.LANCZOS)
frame=family_frame()
base.paste(frame,(1530,185))
for name,bloody,repeat,night in [('living',False,False,False),('living-repeat',False,True,False),('living-blood',True,False,False),('living-blood-repeat',True,True,False),('living-night',False,False,True)]:
    im=base.copy()
    if repeat:
        im.paste(family_frame(True),(1530,185))
        paste_prop(im,coat,(1495,455,195,280),-8,light=.9)
    if bloody:
        stain(im,1670,856,280,108,13);stain(im,485,894,205,57,36)
        # Runoff at the lower floor, with smaller spatters beside the table.
        stain(im,1740,998,180,67,59)
        paste_prop(im,coat,(1300,893,380,155),-13,light=.83)
        paste_prop(im,shirt,(1550,772,290,168),-35,light=.85)
        paste_prop(im,pants,(335,862,325,180),-19,light=.7)
        paste_prop(im,scarf,(1730,890,105,120),-25,light=.8)
    if night:im=Image.blend(im,Image.new('RGB',im.size,'#060d0c'),.70)
    wrapper(im,OUT/'bg'/f'{name}.svg')
    if name=='living-blood':im.resize((1280,720)).save(ROOT/'output/candidates/crime-scene-v3.jpg')

for name,repeat in [('photo',False),('photo-repeat',True)]:
    f=family_frame(repeat,(1108,748))
    plate=ImageEnhance.Brightness(base).enhance(.35)
    f=f.resize((1108,748),Image.Resampling.LANCZOS);plate.paste(f,(406,80))
    wrapper(plate,OUT/'bg'/f'{name}.svg')

# Texture-preserving stair stains; perspective narrows farther up the steps.
im=room('stairs')
for i in range(5):stain(im,870-i*21,525+i*107,40+i*13,8+i*3,60+i)
wrapper(im,OUT/'bg/stairs-blood.svg')

# Two photographic busts rather than drawn torsos with pasted faces.
tv=ImageOps.fit(room('guest'),(640,440)).filter(ImageFilter.GaussianBlur(5))
tv=ImageEnhance.Brightness(tv).enhance(.7)
for x,n in [(0,'elder-left.jpg'),(320,'elder-right.jpg')]:
    p=Image.open(SRC/'tv'/n).convert('RGB')
    # Match head size and eye line from the new colour Vietnamese photographs.
    # The crop extends only into transparent space below the right bust.
    p=p.crop((270,330,1270,1830) if x==0 else (270,-50,1670,1750))
    p=ImageOps.fit(p,(310,465))
    # Explicit source-contour masks preserve every facial pixel. Unconstrained
    # segmentation can classify dark eyes as background on these photographs.
    contour=[(0,335),(20,295),(90,240),(112,218),(92,192),(86,142),(104,130),(114,68),(125,40),(143,20),(169,11),(197,13),(222,31),(241,55),(249,90),(258,165),(242,234),(257,260),(278,345),(290,465),(0,465)] if x==0 else [(0,322),(0,269),(25,255),(77,227),(89,211),(70,190),(56,160),(49,128),(50,97),(56,76),(65,57),(83,43),(99,32),(122,29),(148,35),(166,46),(178,62),(186,85),(191,115),(196,145),(195,173),(185,199),(174,219),(172,244),(199,253),(232,268),(257,287),(273,307),(275,325)]
    alpha=Image.new('L',p.size);ImageDraw.Draw(alpha).polygon(contour,fill=255)
    alpha=alpha.filter(ImageFilter.GaussianBlur(.6))
    if x==0:
        a=np.array(p).astype(float)*np.array([.93,1.0,1.16])
        p=Image.fromarray(np.uint8(np.clip(a,0,255)))
    # Preserve colour skin and eyes rather than a sepia historic treatment.
    p=ImageEnhance.Color(p).enhance(.82);p=ImageEnhance.Brightness(p).enhance(.84)
    if x: p=Image.blend(p,Image.new('RGB',p.size,'#936d50'),.06)
    tv.paste(p,(x+5,-8 if x==0 else 8),alpha)
# A real tabletop places both busts behind a shared foreground surface.
table=Image.open(SRC/'rooms/living.jpg').convert('RGB')
tw,th=table.size
table=table.crop((int(tw*.41),int(th*.50),int(tw*.67),int(th*.59)))
table=grade(ImageOps.fit(table,(640,150)),.62)
tv.paste(table,(0,290))
tv.save(ROOT/'output/candidates/television-v3.jpg',quality=93)
for mode in ['recording','lowres','still','outline','drawing','cartoon']:
    im=tv.copy()
    if mode=='lowres':im=im.resize((160,110)).resize(tv.size,Image.Resampling.NEAREST)
    if mode=='still':im=ImageEnhance.Color(im).enhance(.12)
    if mode in ['outline','drawing','cartoon']:
        gray=np.array(im.convert('L'));edges=cv2.adaptiveThreshold(gray,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,15,8)
        smooth=cv2.bilateralFilter(np.array(im),9,50,50)
        poster=np.uint8(smooth//(40 if mode=='outline' else 64))*(40 if mode=='outline' else 64)
        poster[edges<80]=(35,37,30)
        drawn=Image.fromarray(poster)
        im=Image.blend(im,drawn,.5 if mode=='outline' else .88 if mode=='drawing' else 1)
    if mode=='recording':
        d=ImageDraw.Draw(im);d.text((20,16),'PLAY  >   14:32',fill='#babcb0')
    wrapper(im,OUT/'tv'/f'{mode}.svg')
# Abrupt close framing of the same TV faces, deliberately no unrelated monster.
shock=ImageOps.fit(tv.crop((42,50,600,278)),(1920,1080));shock=ImageEnhance.Contrast(shock).enhance(1.6)
shock.save(OUT/'tv/shock.jpg',quality=92)

# Progressive first-person clothing occlusion with real garment folds and seams.
home=room('home',True)
layers=[(coat,(280,565,970,670),-16),(coat,(825,335,900,990),23),(shirt,(45,298,1170,920),-29),(pants,(1050,90,830,1190),-18),(scarf,(230,-180,1100,1460),35),(shirt,(160,-250,1570,1580),-8),(shirt,(-200,-360,2140,2020),9)]
for i,(p,box,angle) in enumerate(layers,1):
    paste_prop(home,p,box,angle,shadow=16,light=.86-i*.065)
    wrapper(home,OUT/'cg'/f'clothes-{i}.svg')
home.resize((1280,720)).save(ROOT/'output/candidates/clothes-v3.jpg')
sheet=ImageOps.fit(shirt,(1920,1080));sheet=ImageEnhance.Brightness(sheet).enhance(.55)
sheet.convert('RGB').save(OUT/'cg/cloth-shock.jpg',quality=91)
impact=ImageOps.fit(base.crop((720,440,1430,840)),(1920,1080));impact=ImageEnhance.Brightness(impact).enhance(.63)
impact.save(OUT/'cg/impact-shock.jpg',quality=91)

# Three short transients with a rapid attack, no clipping, and distinct decays.
rate=44100
for name,freq,decay,duration in [('shock-tv',123,9,.65),('shock-impact',73,12,.6),('shock-cloth',47,5,1.1)]:
    t=np.arange(int(rate*duration))/rate
    noise=rng.normal(0,1,len(t));low=np.convolve(noise,np.ones(13)/13,mode='same')
    env=np.minimum(t/.003,1)*np.exp(-t*decay)
    a=(np.sin(2*np.pi*(freq*t+15*t*t))*.52+low*.8+noise*.13)*env
    a=np.clip(a,-.85,.85)*np.minimum((duration-t)/.06,1)
    with wave.open(str(OUT/'sfx'/f'{name}.wav'),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(np.int16(a*32767).tobytes())
print('v0.3 raster living, crime scene, CRT, photographic TV, clothing CG and 3 shock sounds rebuilt')
