"""Deterministic SVG placeholder plates; replace paths without changing story."""
from pathlib import Path
import random

ROOT = Path(__file__).resolve().parents[1] / 'assets/generated'
for folder in ['bg', 'characters', 'tv', 'cg', 'sfx', 'music', 'ui']:
    (ROOT / folder).mkdir(parents=True, exist_ok=True)

DEFS = '''<defs>
<linearGradient id="wall" x2="0" y2="1"><stop stop-color="#cecab5"/><stop offset="1" stop-color="#a7a895"/></linearGradient>
<linearGradient id="floor" x2="0" y2="1"><stop stop-color="#736e59"/><stop offset="1" stop-color="#3f463d"/></linearGradient>
<radialGradient id="light"><stop stop-color="#faf0c1" stop-opacity=".4"/><stop offset="1" stop-color="#eddaaa" stop-opacity="0"/></radialGradient>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" seed="7"/><feColorMatrix type="saturate" values="0"/></filter>
<pattern id="paper" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 4H8" stroke="#5d6652" stroke-opacity=".06"/></pattern>
</defs>'''

def svg(body, width=1920, height=1080, texture=True):
    return f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="0 0 {width} {height}">{DEFS}{body}' + (f'<rect width="{width}" height="{height}" filter="url(#grain)" opacity=".055"/>' if texture else '') + '</svg>'

def put(folder, name, body, **kw):
    (ROOT / folder / (name + '.svg')).write_text(svg(body, **kw), encoding='utf-8')

def cloth(x, y, color='#627066', scale=1, rotate=0):
    return f'<g transform="translate({x} {y}) rotate({rotate}) scale({scale})"><path d="M-105-64L-160-12-124 27-89 3-75 117H75L89 3 124 27 160-12 105-64 42-90Q0-52-42-90Z" fill="{color}" stroke="#292f2b" stroke-width="3"/><path d="M-42-90L0-48 42-90M0-48V113M-68 30Q0 5 68 30M-68 88Q0 61 68 88" fill="none" stroke="#bbc0a8" opacity=".25" stroke-width="4"/></g>'

def photo(x=1010, y=160, missing=False, draw=False):
    heads = ''.join(f'<g transform="translate({40+i*50} 55)"><path d="M-23 45Q-22 6 0 4Q22 6 23 45" fill="#575e4f"/><ellipse cy="-7" rx="12" ry="17" fill="#bbb6a3"/></g>' for i in range(4 if missing else 5))
    if draw:
        heads += '<path d="M84 27L115 13 119 58 80 69 100 19 123 66M91 32L110 43" stroke="#3d433a" fill="none" stroke-width="4"/>'
    return f'<g transform="translate({x} {y})"><rect width="325" height="150" fill="#68614b"/><rect x="12" y="12" width="301" height="126" fill="#b4b49c"/>{heads}</g>'

def living(missing=False, blood=False, night=False):
    body = '''<rect width="1920" height="1080" fill="url(#wall)"/>
<path d="M0 0L250 100V700L0 1080Z" fill="#9b9f8c"/><path d="M1720 100L1920 0V1080L1720 700Z" fill="#939984"/>
<path d="M0 1080L250 700H1720L1920 1080Z" fill="url(#floor)"/>
<path d="M0 970H1920M90 860H1845M176 766H1777M430 700L155 1080M730 700L610 1080M1090 700L1170 1080M1400 700L1690 1080" stroke="#2e3d34" opacity=".26" stroke-width="3"/>
<path d="M250 100H1720V700H250Z" fill="url(#paper)"/>
<g><rect x="290" y="150" width="410" height="395" fill="#606b5d"/><rect x="305" y="164" width="380" height="364" fill="#c6d3bd"/>
<path d="M494 164V528M305 346H685" stroke="#7e8773" stroke-width="8"/><path d="M285 140Q340 325 287 562H350L385 140ZM623 140L644 562H711Q655 350 719 140Z" fill="#ddd6bf"/><ellipse cx="510" cy="280" rx="330" ry="300" fill="url(#light)"/></g>
<rect x="1370" y="145" width="280" height="555" fill="#737967"/><rect x="1402" y="169" width="221" height="530" fill="#4a5447"/><path d="M1402 200L1619 266M1402 276L1619 342M1402 352L1619 418M1402 428L1619 494M1402 504L1619 570M1402 580L1619 646" stroke="#9b9f86" stroke-width="15"/>
<g fill="#5e6957" stroke="#414c3f" stroke-width="5"><rect x="831" y="454" width="445" height="213" rx="37"/><rect x="855" y="531" width="396" height="109" rx="22"/><rect x="794" y="526" width="72" height="140" rx="18"/><rect x="1250" y="526" width="64" height="140" rx="18"/></g>
<path d="M650 720L1068 680 1270 828 742 899Z" fill="#8d8065" stroke="#645e4b" stroke-width="6"/><path d="M752 889V1000M1226 828V962" stroke="#5a5946" stroke-width="20"/>
<ellipse cx="936" cy="782" rx="62" ry="25" fill="#d0c4a5"/><circle cx="922" cy="777" r="15" fill="#b29357"/><circle cx="957" cy="777" r="14" fill="#b29357"/>
<rect x="1780" y="740" width="145" height="199" fill="#585f4f"/>
<g transform="translate(760 212)"><circle r="45" fill="#d9d4bd" stroke="#777866" stroke-width="7"/><path d="M0-30V0L21 3" stroke="#5e6656" stroke-width="4"/></g>'''
    body += photo(missing=missing, draw=missing)
    body += '<g transform="translate(100 564)"><rect width="575" height="145" fill="#56614f"/><path d="M0 0L53-65H470L575 0Z" fill="#626b56"/></g>'
    body += '<rect x="159" y="292" width="474" height="372" rx="24" fill="#69745a"/><rect x="178" y="311" width="436" height="333" rx="13" fill="#303e30"/><path d="M210 327Q415 301 585 338L585 382Q410 360 210 391Z" fill="#b6c4a0" opacity=".04"/>'
    for i in range(2 if missing else 4):
        body += f'<ellipse cx="{1430+i*60}" cy="{800+i%2*30}" rx="22" ry="43" transform="rotate(32 {1430+i*60} {800+i%2*30})" fill="#b2a98b" stroke="#716d58" stroke-width="4"/>'
    if missing:
        body += cloth(1340, 372, '#727e7a', .55)
    if blood:
        body += '<path d="M1160 745Q1080 693 1170 697L1319 696Q1370 689 1373 756L1510 792Q1660 798 1620 857L1480 899 1280 859 1000 929 821 885 1148 832Z" fill="#702f29" opacity=".88"/>'
        body += cloth(1090, 815, '#798b86', .8, 29) + cloth(1460, 785, '#6d6255', .75, -21)
        body += '<path d="M1580 668Q1613 620 1650 634L1656 673Z" fill="#333d34"/><g stroke="#bbc0a3" stroke-width="5" fill="none"><ellipse cx="1257" cy="873" rx="25" ry="13"/><ellipse cx="1317" cy="875" rx="25" ry="13"/><path d="M1282 873H1292"/></g>'
        body += '<path d="M1775 427Q1830 370 1878 430L1899 646H1751Z" fill="#394536"/><ellipse cx="1826" cy="390" rx="39" ry="52" fill="#656e59"/><path d="M1767 505L1700 597 1800 604" stroke="#4c5744" stroke-width="25" fill="none"/><path d="M1660 687Q1738 639 1807 683L1812 706H1657Z" fill="#a5a18a"/>'
    if night:
        body += '<rect width="1920" height="1080" fill="#182921" opacity=".78"/><circle cx="620" cy="651" r="4" fill="#cd452f"/>'
    return body

for name, kwargs in [('living', {}), ('living-repeat', {'missing':True}), ('living-night', {'night':True}), ('living-blood', {'blood':True}), ('living-blood-repeat', {'blood':True,'missing':True})]:
    put('bg', name, living(**kwargs))

guest = '''<rect width="1920" height="1080" fill="#b7bba4"/><path d="M0 1080L230 720H1710L1920 1080" fill="url(#floor)"/>
<rect x="260" y="170" width="355" height="405" fill="#6e7c69"/><rect x="279" y="190" width="317" height="366" fill="#d3dbc1"/><path d="M435 190V556M279 375H596" stroke="#86937a" stroke-width="9"/>
<rect x="1380" y="160" width="270" height="562" fill="#7b8570"/><rect x="1402" y="182" width="226" height="540" fill="#515f4f"/><circle cx="1600" cy="470" r="8" fill="#b4b796"/>
<path d="M550 640H1130L1360 960H378Z" fill="#605f4d"/><path d="M568 654H1109L1278 917H442Z" fill="#b9b698"/>
<path d="M595 665H1038L1120 758H534Z" fill="#d9d6bb"/><path d="M526 788H1170L1278 917H442Z" fill="#7d8a76"/>
<rect x="1120" y="488" width="188" height="215" fill="#7b7960"/><rect x="1140" y="530" width="147" height="140" fill="#8e876c"/>
<rect x="790" y="197" width="300" height="231" fill="#a8ae96"/><path d="M801 410L893 293 939 331 974 252 1073 410Z" fill="#889b83"/>'''
put('bg', 'guest', guest)
put('bg', 'guest-night', guest + '<rect width="1920" height="1080" fill="#15231e" opacity=".78"/>')
stairs = '''<rect width="1920" height="1080" fill="#a7af96"/><path d="M0 0L650 140V800L0 1080Z" fill="#83927c"/><rect x="650" y="140" width="700" height="660" fill="#4b5b4d"/>
<path d="M400 1080L660 370H1280L1540 1080Z" fill="#a29e81"/>
<path d="M647 410H1293M618 490H1322M584 580H1356M548 680H1392M506 794H1434M459 923H1481" stroke="#4d5e4d" stroke-width="21"/>
<path d="M500 0L300 1080M1410 0L1660 1080" stroke="#53684f" stroke-width="24"/>
<path d="M466 190L424 566M421 428L380 831M1455 190L1507 566M1513 428L1567 831" stroke="#53684f" stroke-width="10"/>'''
put('bg','stairs',stairs)
put('bg','stairs-blood',stairs+'<path d="M853 612Q836 553 887 567L903 648 934 725 905 802 963 916 890 991 802 965 846 902 826 760Z" fill="#753b30"/>')
put('bg','photo', living() + '<rect width="1920" height="1080" fill="#253b30" opacity=".7"/>' + photo(465,230).replace('translate(465 230)', 'translate(465 200) scale(3)'))
put('bg','photo-repeat', living(missing=True) + '<rect width="1920" height="1080" fill="#253b30" opacity=".7"/>' + photo(465,230,True,True).replace('translate(465 230)', 'translate(465 200) scale(3)'))
put('bg','kitchen','''<rect width="1920" height="1080" fill="#b8beab"/><path d="M0 740H1920V1080H0Z" fill="url(#floor)"/>
<rect x="210" y="560" width="1500" height="210" fill="#899481"/><rect x="200" y="520" width="1520" height="50" fill="#d1d1b8"/>
<rect x="1250" y="105" width="410" height="650" rx="20" fill="#b3b9a7" stroke="#8f9c87" stroke-width="9"/><path d="M1250 356H1660M1280 233V285M1280 403V460" stroke="#6c7c67" stroke-width="9"/>
<rect x="255" y="138" width="520" height="340" fill="#d6dac5" stroke="#889880" stroke-width="18"/><path d="M510 140V478M255 310H775" stroke="#889880" stroke-width="9"/>
<ellipse cx="985" cy="526" rx="79" ry="25" fill="#5b6657"/><path d="M940 520V460Q985 420 1030 460V520" fill="#83957b"/><path d="M964 454Q970 375 993 401" stroke="#b9c8ab" stroke-width="4" fill="none"/>''')
outside = '''<rect width="1920" height="1080" fill="#c5ccba"/><path d="M0 620H1920V1080H0Z" fill="#939b89"/><path d="M0 860L1920 715V835L0 1030Z" fill="#b2b59c"/>
<path d="M355 690V251L785 62 1235 251V690Z" fill="#b3b7a1" stroke="#687e65" stroke-width="10"/><path d="M270 265L785 36 1310 265" stroke="#5d7360" stroke-width="54" fill="none"/>
<rect x="705" y="439" width="176" height="252" fill="#526d57"/><rect x="461" y="338" width="151" height="135" fill="#899d83"/><rect x="980" y="338" width="151" height="135" fill="#899d83"/>
<path d="M1280 708V369Q1330 312 1376 365V708M1630 731V420Q1660 371 1704 420V730" fill="#71876b"/>
<path d="M0 757L1890 899" stroke="#4d6853" stroke-width="11"/><path d="M172 0L203 814M174 125L1113 0" stroke="#607b61" stroke-width="8"/>
<ellipse cx="1500" cy="290" rx="390" ry="220" fill="url(#light)"/>'''
put('bg','outside',outside)
put('bg','street', outside + '<rect width="1920" height="1080" fill="#456047" opacity=".35"/>')
home = '''<rect width="1920" height="1080" fill="#c3cbbd"/><path d="M0 800H1920V1080H0Z" fill="#849384"/>
<rect x="1370" y="190" width="340" height="610" fill="#82957f"/><rect x="1390" y="211" width="300" height="589" fill="#5c785f"/><path d="M1610 476H1650" stroke="#c5d2bc" stroke-width="10"/>
<rect x="250" y="150" width="500" height="430" fill="#718b78"/><rect x="270" y="169" width="460" height="389" fill="#dce2d0"/><path d="M500 169V558" stroke="#718b78" stroke-width="12"/>
<path d="M240 140L420 140 359 601H240ZM560 140H770V601H627Z" fill="#a4bba9"/>
<path d="M438 682H1040L1290 984H278Z" fill="#708674"/><path d="M478 699H1018L1110 791H403Z" fill="#e2e1cc"/><path d="M398 807H1137L1260 964H308Z" fill="#b4c4af"/>
<rect x="1040" y="522" width="226" height="168" fill="#7a927a"/><rect x="1120" y="441" width="62" height="84" fill="#c3d3a5"/><path d="M1090 442L1120 370H1182L1212 442Z" fill="#e0dfa8"/>'''
put('bg','home',home)
put('bg','home-curtains',home+'<rect x="260" y="157" width="480" height="423" fill="#9cae9f"/><path d="M320 162V580M409 162V580M500 162V580M592 162V580M682 162V580" stroke="#879e8c" stroke-width="4"/>')
put('bg','bathroom','''<rect width="1920" height="1080" fill="#b0c2b5"/><rect x="550" y="108" width="820" height="560" fill="#738a7f"/><rect x="575" y="133" width="770" height="510" fill="#9fac9e"/><path d="M400 730H1520L1400 950H520Z" fill="#d8e0ce"/><ellipse cx="960" cy="770" rx="210" ry="62" fill="#8fafa1"/><path d="M960 731V645Q960 615 1000 624" stroke="#c6d6c5" stroke-width="22" fill="none"/>''')
put('bg','black','<rect width="1920" height="1080" fill="#080d0b"/>', texture=False)

# Separate character art: no baked dialogue and no engine assumptions.
oldman='''<path d="M122 746L150 336Q235 289 320 336L354 746Z" fill="#6b7964" stroke="#394c3b" stroke-width="5"/><path d="M150 355L79 614 144 641M320 355L391 614 326 641" fill="none" stroke="#6b7964" stroke-width="58"/>
<path d="M186 305V339L235 398 284 339V305" fill="#b3b296"/><ellipse cx="235" cy="213" rx="89" ry="115" fill="#c2bea1" stroke="#566447" stroke-width="4"/>
<path d="M145 214Q132 83 235 82Q336 92 326 214L302 152Q235 109 164 156Z" fill="#bcc2ae"/>
<path d="M161 208L205 198M265 198L309 208M213 283Q235 292 259 279M215 239L225 258H245M166 268L198 273M273 273L305 267" fill="none" stroke="#7d8169" stroke-width="5"/>
<ellipse cx="184" cy="224" rx="6" ry="5" fill="#455139"/><ellipse cx="286" cy="224" rx="6" ry="5" fill="#455139"/><path d="M187 351L232 395 281 351M235 400V733" stroke="#a4ad8d" stroke-width="4" fill="none"/>'''
put('characters','uncle',oldman,width=470,height=760,texture=False)
pet='''<path d="M90 181Q10 121 55 70Q109 28 135 138M353 167Q418 86 365 49Q318 40 318 133" fill="#4d5e50"/>
<ellipse cx="229" cy="222" rx="150" ry="121" fill="#899d87" stroke="#3d5742" stroke-width="7"/>
<path d="M115 277L80 367 119 376 157 302M287 300L320 374 362 365 339 276" fill="#6a856f"/>
<ellipse cx="228" cy="151" rx="103" ry="87" fill="#a4b59b" stroke="#3d5742" stroke-width="6"/>
<ellipse cx="196" cy="149" rx="6" ry="10" fill="#354d38"/><ellipse cx="270" cy="149" rx="6" ry="10" fill="#354d38"/>
<path d="M220 171Q232 184 244 171M232 180V194M221 198Q232 211 246 198" stroke="#476049" stroke-width="4" fill="none"/>
<path d="M369 256Q448 182 442 267Q451 323 371 324" stroke="#637e64" stroke-width="27" fill="none"/>'''
put('characters','mugi',pet,width=480,height=400,texture=False)
put('characters','mugi-wounded',pet+'<path d="M145 260Q216 296 294 256" stroke="#73453a" stroke-width="11" fill="none"/><path d="M219 296L212 331 238 333" fill="#804d41"/>',width=480,height=400,texture=False)

# The six TV plates share identical left/right head and body positions.
for mode in ['recording','lowres','still','outline','drawing','cartoon']:
    body='<rect width="640" height="440" fill="#979e87"/><rect y="269" width="640" height="171" fill="#616b56"/>'
    for x,c in [(175,'#6d7975'),(465,'#897e68')]:
        body+=f'<path d="M{x-100} 438V279Q{x} 238 {x+100} 279V438Z" fill="{c}" stroke="#344432" stroke-width="5"/>'
        if mode in ['recording','lowres','still']:
            # Historic public-domain portrait placeholders; embedded by make-tv-photos.py.
            body+=f'<ellipse cx="{x}" cy="172" rx="76" ry="102" fill="#beb99d"/><path d="M{x-70} 175Q{x-85} 62 {x} 62Q{x+85} 68 {x+70} 175" fill="#656c5a"/>'
        else:
            body+=f'<path d="M{x-69} 88L{x+48} 69 {x+80} 148 {x+65} 233 {x+8} 272 {x-68} 237 {x-83} 151Z" fill="'+('#b0b395' if mode=='outline' else '#c0be9e')+f'" stroke="#2d3e2e" stroke-width="{4 if mode=="outline" else 7}"/>'
        body+=f'<path d="M{x-51} 157L{x-18} 154M{x+18} 154L{x+51} 157M{x-16} 233H{x+17}M{x-7} 173L{x-18} 203H{x+8}" stroke="#47553e" stroke-width="5" fill="none"/><ellipse cx="{x-34}" cy="178" rx="7" ry="9" fill="#182b1d"/><ellipse cx="{x+34}" cy="178" rx="7" ry="9" fill="#182b1d"/>'
        if mode=='cartoon':
            body+=f'<path d="M{x-83} 88L{x+57} 62 {x+86} 135M{x-91} 151L{x-85} 240 {x+8} 281 {x+78} 239" stroke="#33422d" stroke-width="3" fill="none"/>'
    body+='<text x="27" y="38" fill="#d6d8bd" font-size="22" font-family="monospace">REC  ▷  14:32</text>'
    put('tv',mode,body,width=640,height=440)

random.seed(42)
layers=''
for i in range(1,8):
    layers+=cloth(random.randint(450,1450),random.randint(250,680),['#6d7975','#897e68','#9a997f','#485e50','#626951','#7d7662','#88907b'][i-1],1.6+i*.16,random.randint(-35,35))
    put('cg',f'clothes-{i}',home+'<rect width="1920" height="1080" fill="#0d1b13" opacity=".76"/>'+layers+f'<rect width="1920" height="1080" fill="#08100b" opacity="{i*.055}"/>')
print('Generated scene plates, characters, six matched TV modes and seven clothing layers')
