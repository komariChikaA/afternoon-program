"""v0.2 photographic composites. Source licences are in source/attribution.json."""
from pathlib import Path
from PIL import Image,ImageOps,ImageEnhance,ImageFilter,ImageChops
import base64,io,random,math
root=Path(__file__).resolve().parents[1];out=root/'assets/generated';source=root/'assets/source/rooms'
W,H=1920,1080
def encoded(im):
 b=io.BytesIO();im.save(b,format='JPEG',quality=88);return 'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
def plate(name,night=False):
 im=Image.open(source/(name+'.jpg')).convert('RGB')
 if name=='outside':
  w,h=im.size;im=im.crop((int(w*.04),int(h*.1),int(w*.70),int(h*.88)))
 im=ImageOps.fit(im,(W,H),centering=(.5,.46))
 im=ImageEnhance.Color(im).enhance(.62 if name!='home' else .7)
 im=ImageEnhance.Contrast(im).enhance(.88)
 im=ImageEnhance.Brightness(im).enhance(.85 if name!='home' else .96)
 grade=Image.new('RGB',im.size,'#667263');im=Image.blend(im,grade,.08)
 if night:im=Image.blend(im,Image.new('RGB',im.size,'#09120e'),.75)
 return im
def photo(im):return f'<image width="1920" height="1080" href="{encoded(im)}"/>'
defs='''<defs><radialGradient id="vignette"><stop offset=".35" stop-color="#050d0a" stop-opacity="0"/><stop offset="1" stop-color="#050d0a" stop-opacity=".42"/></radialGradient>
<linearGradient id="coat" x2="1" y2="1"><stop stop-color="#64726e"/><stop offset=".25" stop-color="#86918a"/><stop offset=".6" stop-color="#43504b"/><stop offset="1" stop-color="#272f2a"/></linearGradient>
<filter id="shadow" x="-.3" y="-.3" width="1.6" height="1.6"><feDropShadow dx="0" dy="12" stdDeviation="13" flood-opacity=".7"/></filter>
<filter id="texture"><feTurbulence baseFrequency=".11 .3" numOctaves="3" seed="7"/><feColorMatrix type="saturate" values="0"/><feBlend in="SourceGraphic" mode="soft-light"/></filter>
<linearGradient id="blood" x2="1" y2="1"><stop stop-color="#241615"/><stop offset=".45" stop-color="#61372d"/><stop offset="1" stop-color="#371e1b"/></linearGradient></defs>'''
def save(folder,name,body):
 (out/folder/(name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'+defs+body+'<rect width="1920" height="1080" fill="url(#vignette)"/></svg>',encoding='utf-8')
def jacket(x,y,scale=1,angle=0,color=None):
 # Lopsided sleeves, overlapping lapels, fabric grain, seam shadows, five buttons.
 fill=color or 'url(#coat)'
 body=f'<g transform="translate({x} {y}) rotate({angle}) scale({scale})" filter="url(#shadow)"><path d="M-83-125Q-105-120-151-103L-201 63Q-168 98-127 83L-88-10-100 172Q-29 183 0 167Q57 189 111 173L88-17 129 84Q178 91 199 59L151-103 75-129 21-116-16-116Z" fill="{fill}" stroke="#25332d" stroke-width="4"/><path d="M-67-126L-19-85-49-21 1 11 43-33 20-88 67-127M1 11L-4 170M-87 61L-40 48-32 102-87 114M52 48L91 63 88 113 47 104" stroke="#14251dcc" stroke-width="7" fill="none"/><path d="M-67-126L-19-85-49-21 1 11 43-33 20-88 67-127M-178 38L-144 29-129 4M142 32L173 50M-79 143L-34 154M37 143L83 156" stroke="#abb3a3" stroke-opacity=".3" stroke-width="2" fill="none"/>'
 for i in range(5):body+=f'<circle cx="8" cy="{15+i*30}" r="4" fill="#202d25" stroke="#80917c" stroke-width="1"/>'
 for d in [-47,-9,35,77]:body+=f'<path d="M-100 {d}Q-15 {d+12} 98 {d-3}" fill="none" stroke="#bac0ab" stroke-opacity=".1" stroke-width="2"/>'
 return body+'</g>'
def family(missing=False):
 # Photo contact sheet is derived from the same two licensed source portraits.
 tex=Image.new('RGB',(420,235),'#b9af95')
 for i in range(4 if missing else 5):
  p=Image.open(root/'assets/source/tv'/('elder-left.jpg' if i%2 else 'elder-right.jpg')).convert('RGB')
  p=ImageOps.fit(p,(76,160),centering=(.5,.18));p=ImageOps.colorize(ImageOps.grayscale(p),'#242a21','#b2ac92');tex.paste(p,(15+i*78,45))
 body=f'<g transform="translate(1260 177) rotate(2)"><rect x="-12" y="-12" width="444" height="259" fill="#352c23" filter="url(#shadow)"/><image width="420" height="235" href="{encoded(tex)}"/>'
 if missing:body+='<path d="M102 74L140 61 154 181 98 190 114 83 143 173M111 105L134 112M117 141L137 140" stroke="#252c20" stroke-width="3" fill="none"/>'
 return body+'</g>'
crt='''<g filter="url(#shadow)"><rect x="135" y="360" width="530" height="370" rx="20" fill="#2b302b"/><rect x="148" y="372" width="457" height="330" rx="42" fill="#171d18"/><path d="M195 399Q338 367 562 409L571 460Q409 417 195 448Z" fill="#ccd9c4" opacity=".055"/><circle cx="637" cy="431" r="16" fill="#5a5b49"/><circle cx="637" cy="492" r="12" fill="#4b4f43"/><circle cx="639" cy="663" r="3" fill="#802f25"/><path d="M613 550H651M613 565H651M613 580H651M613 595H651M613 610H651" stroke="#151f18" stroke-width="5"/></g>'''
base=photo(plate('living'))+crt
for name,missing,blood,night in [('living',False,False,False),('living-repeat',True,False,False),('living-blood',False,True,False),('living-blood-repeat',True,True,False),('living-night',False,False,True)]:
 body=photo(plate('living',night))+crt+family(missing)
 if missing:body+=jacket(1750,560,.55,4)
 if blood:
  body+='<path d="M727 744Q782 707 849 742L1113 707Q1229 724 1180 771L1330 811Q1440 825 1312 850L1090 876 931 835Q730 868 631 820L570 805Q614 765 727 744Z" fill="url(#blood)" opacity=".92"/><path d="M958 728L1060 787 894 790 958 752M1270 799L1200 832" stroke="#bb7c62" stroke-opacity=".15" stroke-width="3" fill="none"/>'
  body+=jacket(916,809,.65,47)+jacket(1240,852,.57,-73,'#6c5e47')
  body+='<path d="M1690 512Q1717 438 1754 512L1788 744H1658Z" fill="#0b1510" opacity=".86"/><ellipse cx="1719" cy="447" rx="36" ry="47" fill="#16261b"/><path d="M1659 601L1566 668 1630 699" fill="none" stroke="#0d1811" stroke-width="31"/><path d="M1498 717Q1511 687 1580 687L1598 713 1553 726Z" fill="#a3a189"/><path d="M1498 717L1553 726" stroke="#535b49" stroke-width="3"/>'
 save('bg',name,body)
for name,src,night in [('guest','guest',False),('guest-night','guest',True),('kitchen','kitchen',False),('home','home',False),('home-curtains','home',False),('outside','outside',False),('street','outside',False),('stairs','stairs',False),('stairs-blood','stairs',False)]:
 body=photo(plate(src,night))
 if name=='stairs-blood':body+='<path d="M801 548L826 652 784 730 882 801 813 872 910 988 818 1060 680 996 754 896 706 781 750 694Z" fill="url(#blood)" opacity=".88"/>'
 if name=='home-curtains':body+='<rect width="1920" height="1080" fill="#18251c" opacity=".28"/>'
 if src=='guest':
  # Mattress photograph pasted over a perspective bed: visibly a placeholder set.
  bed=Image.open(source/'home.jpg');w,h=bed.size;bed=bed.crop((0,int(h*.5),w,int(h*.97)))
  body+=f'<defs><clipPath id="bed"><path d="M580 706L1190 644 1650 850 943 963Z"/></clipPath></defs><g clip-path="url(#bed)"><image x="520" y="650" width="1190" height="330" href="{encoded(bed)}"/><path d="M580 706L1190 644 1650 850 943 963Z" fill="#696955" opacity=".2"/></g>'
 save('bg',name,body)
for name,missing in [('photo',False),('photo-repeat',True)]:
 body=photo(plate('living'))+'<rect width="1920" height="1080" fill="#07170f" opacity=".55"/>'
 body+='<g transform="translate(-2650 -350) scale(2.6)">'+family(missing)+'</g>'
 save('bg',name,body)
# Bathroom uses a cropped photographic kitchen sink, rather than a blank polygon mirror.
save('bg','bathroom',photo(plate('bathroom')))
# Photographic fabric detail is clipped into irregular clothing silhouettes.
fabric=Image.open(source/'home.jpg').convert('RGB');fw,fh=fabric.size;fabric=fabric.crop((int(fw*.13),int(fh*.47),int(fw*.82),int(fh*.95)))
fabric=ImageOps.grayscale(fabric);random.seed(2314);layers='';home=photo(plate('home',True))
for i in range(1,8):
 color=['#657977','#796f58','#797967','#33493b','#465642','#706957','#747c6d'][i-1]
 tex=ImageOps.colorize(fabric,'#1e2d24',color)
 x,y=random.randint(350,1460),random.randint(230,650);scale=2+i*.17;angle=random.randint(-40,40)
 layers+=jacket(x,y,scale,angle,color)
 path='M-83-125Q-105-120-151-103L-201 63Q-168 98-127 83L-88-10-100 172Q-29 183 0 167Q57 189 111 173L88-17 129 84Q178 91 199 59L151-103 75-129 21-116-16-116Z'
 layers+=f'<defs><clipPath id="fabric-{i}"><path d="{path}"/></clipPath></defs><g transform="translate({x} {y}) rotate({angle}) scale({scale})" opacity=".7" clip-path="url(#fabric-{i})"><image x="-210" y="-130" width="420" height="320" href="{encoded(tex)}"/></g>'
 save('cg',f'clothes-{i}',home+layers+f'<rect width="1920" height="1080" fill="#08120c" opacity="{.05+i*.025}"/>')
# Photographs themselves provide the contours in the drawing stages.
tv=Image.new('RGB',(640,440),'#aba78c')
for x,n in [(175,'elder-left.jpg'),(465,'elder-right.jpg')]:
 im=Image.open(root/'assets/source/tv'/n).convert('RGB');w,h=im.size;c=(.22,.10,.76,.49) if n=='elder-left.jpg' else (.22,.015,.72,.51)
 im=im.crop(tuple(round(v*(w if k%2==0 else h)) for k,v in enumerate(c))).resize((150,205));im=ImageOps.colorize(ImageOps.grayscale(im),'#27362a','#c6c3a0');tv.paste(im,(x-75,69))
from PIL import ImageDraw
draw=ImageDraw.Draw(tv)
for x,c in [(175,'#66766d'),(465,'#867b63')]:draw.polygon([(x-100,440),(x-100,280),(x-40,250),(x+40,250),(x+100,280),(x+100,440)],fill=c)
for mode in ['outline','drawing','cartoon']:
 im=ImageOps.posterize(tv,3 if mode=='outline' else 2);edges=ImageOps.invert(tv.convert('L').filter(ImageFilter.FIND_EDGES));edges=ImageOps.autocontrast(edges);edges=edges.point(lambda x:255 if x>100 else 90)
 im=ImageChops.multiply(im,Image.merge('RGB',(edges,edges,edges)))
 if mode=='cartoon':im=ImageEnhance.Contrast(im).enhance(1.35)
 body=f'<image width="640" height="440" href="{encoded(im)}"/>'
 body+='<path d="M101 173Q101 68 175 65Q250 65 250 177L232 248 176 276 108 246ZM392 173Q382 58 465 65Q541 63 542 175L527 246 465 275 400 245Z" stroke="#36452e" stroke-width="3" fill="none" opacity=".6"/>'
 (out/'tv'/(mode+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" viewBox="0 0 640 440">'+body+'</svg>',encoding='utf-8')
pet='''<defs><radialGradient id="fur"><stop stop-color="#809082"/><stop offset=".6" stop-color="#4c6556"/><stop offset="1" stop-color="#263f32"/></radialGradient><linearGradient id="muzzle" x2="0" y2="1"><stop stop-color="#96a58a"/><stop offset="1" stop-color="#5b745f"/></linearGradient><filter id="f"><feTurbulence type="fractalNoise" baseFrequency=".13" numOctaves="3" seed="32"/><feComposite operator="in" in2="SourceGraphic"/><feBlend in="SourceGraphic" mode="soft-light"/></filter><filter id="s"><feDropShadow dx="3" dy="6" stdDeviation="5" flood-opacity=".4"/></filter></defs>
<ellipse cx="250" cy="371" rx="187" ry="13" fill="#071810" opacity=".45"/>
<g filter="url(#s)"><path d="M133 227C105 267 128 321 96 356L79 367Q100 380 124 367L164 318Q205 333 263 318L316 366Q344 377 357 365L341 345 313 268C313 226 360 221 349 185Q344 159 318 173L287 216Z" fill="url(#fur)"/>
<path d="M307 265C350 277 364 258 395 244C439 227 452 286 414 306C393 316 347 310 336 288" stroke="#435c49" stroke-width="28" fill="none" stroke-linecap="round"/>
<path d="M132 145L98 70Q79 28 123 40L173 103M290 100L334 38Q367 24 350 76L330 155" fill="#344c3b" stroke="#1d3327" stroke-width="5"/>
<path d="M118 62L149 112 117 131M330 58L309 112 336 130" stroke="#a5ac8b" stroke-opacity=".3" stroke-width="12"/>
<path d="M121 163C115 110 169 86 224 94C271 82 336 116 334 173C328 235 277 266 217 249C165 255 127 220 121 163Z" fill="url(#fur)"/>
<path d="M181 177Q223 163 267 182L275 222Q234 250 182 216Z" fill="url(#muzzle)"/>
<path d="M203 187Q225 177 241 189L229 204 216 204Z" fill="#20352a"/>
<path d="M226 205V221M226 218Q207 233 193 218M226 218Q245 232 256 220" stroke="#354d37" stroke-width="3" fill="none"/>
<path d="M154 154Q174 139 189 153M263 150Q282 138 299 152" stroke="#263d2c" stroke-width="5" fill="none"/><ellipse cx="174" cy="157" rx="6" ry="9" fill="#0c2518"/><ellipse cx="282" cy="157" rx="6" ry="9" fill="#0c2518"/>
<path d="M156 224Q201 247 199 276M301 225Q265 249 267 279M99 359L109 349M110 363L120 352M324 359L333 350M339 364L344 354" stroke="#a4ad8c" stroke-opacity=".3" stroke-width="2" fill="none"/>
<path d="M111 187L70 179M120 201L76 210M315 188L359 175M315 204L361 214" stroke="#6d866b" stroke-width="2" opacity=".7"/></g>'''
random.seed(27)
for n in range(85):
 x=random.randint(136,313);y=random.randint(121,240)
 pet+=f'<path d="M{x} {y}l{random.randint(-4,4)} {random.randint(4,9)}" stroke="#b4b998" stroke-opacity=".08" stroke-width="1"/>'
for name,wound in [('mugi',False),('mugi-wounded',True)]:
 extra='<path d="M154 284Q207 311 268 281" stroke="#362721" stroke-width="9" fill="none"/><path d="M202 300L210 343 227 340" fill="#594536"/>' if wound else ''
 (out/'characters'/(name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="400" viewBox="0 0 480 400">'+pet+extra+'</svg>',encoding='utf-8')
print('Photographic scenes, clothing fabric, TV drawing transitions and detailed pet rebuilt')
