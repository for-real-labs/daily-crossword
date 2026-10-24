"""Compose original fal.ai artwork with untouched, cropped native app captures."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import json, hashlib
ROOT=Path(__file__).resolve().parents[2]
DESIGN=ROOT/'app-store/design'
FONTS=ROOT/'node_modules/@expo-google-fonts/dm-sans'
INK='#213E34'; GREEN='#45664E'; LIME='#D8ED9D'
def font(size,bold=False):
    return ImageFont.truetype(str(FONTS/('700Bold/DMSans_700Bold.ttf' if bold else '400Regular/DMSans_400Regular.ttf')),size)
def fit_text(draw,text,max_width,size,bold=True):
    while draw.textlength(text,font=font(size,bold))>max_width: size-=1
    return font(size,bold)
def card(canvas,path,box,x,y,width):
    src=Image.open(path).convert('RGB').crop(box)
    height=round(src.height*width/src.width)
    src=src.resize((width,height),Image.Resampling.LANCZOS)
    radius=round(width*.045)
    shadow=Image.new('RGBA',canvas.size)
    d=ImageDraw.Draw(shadow); d.rounded_rectangle((x,y+22,x+width,y+height+22),radius,fill=(25,50,40,65))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(22)))
    mask=Image.new('L',src.size);ImageDraw.Draw(mask).rounded_rectangle((0,0,width-1,height-1),radius,fill=255)
    canvas.paste(src,(x,y),mask)
    ImageDraw.Draw(canvas).rounded_rectangle((x,y,x+width-1,y+height-1),radius,outline=(255,255,255,220),width=5)
HEADLINES=[('100% free.','Zero ads.','Just daily crosswords.'),('One puzzle.','Every day.','A little space to think.'),('Your pace.','Your progress.','Pick up where you left off.')]
manifest=[]
for device,w,h in [('iphone',1320,2868),('ipad',2064,2752)]:
    backdrop=ImageOps.fit(Image.open(DESIGN/'generated/quiet-studio.jpg').convert('RGB'),(w*3,h),method=Image.Resampling.LANCZOS)
    previews=[]
    for i,(a,b,c) in enumerate(HEADLINES):
        panel=backdrop.crop((i*w,0,(i+1)*w,h)).convert('RGBA')
        d=ImageDraw.Draw(panel);margin=round(w*.075)
        d.text((margin,110),'CROSSWORD: NO ADS',font=font(34 if device=='iphone' else 43,True),fill=INK)
        d.text((w-margin-58,110),f'0{i+1}',font=font(32),fill=GREEN)
        y=285 if device=='iphone' else 260
        size=124 if device=='iphone' else 160
        for j,line in enumerate((a,b)):
            d.text((margin,y+j*(size+20)),line,font=fit_text(d,line,w-2*margin,size),fill=INK if j==0 else GREEN)
        d.text((margin,y+2*(size+20)+45),c,font=fit_text(d,c,w-2*margin,43 if device=='iphone' else 54,False),fill=INK)
        shots=ROOT/'app-store/screenshots'/device
        if device=='iphone':
            names=['01-home.png','02-puzzle.png','03-continue.png']
            boxes=[(0,230,1320,1810),(0,200,1320,1950),(0,230,1320,1830)]
            cw=1120 if i==1 else 1080
            cy=885 if i==1 else 955
        else:
            names=['01-home.png','02-puzzle.png','01-home.png']
            boxes=[(400,80,1664,1120),(390,120,1674,1500),(400,80,1664,1400)]
            cw=1500 if i==1 else 1450
            cy=850
        path=DESIGN/'sources/ipad-new.png' if device=='ipad' and i==0 else shots/names[i]
        card(panel,path,boxes[i],(w-cw)//2,cy,cw)
        d=ImageDraw.Draw(panel)
        footer=['NO ADS. NO PURCHASES.','3,000 UNIQUE PUZZLES.','SAVED AS YOU PLAY.'][i]
        fw=d.textlength(footer,font=font(30 if device=='iphone' else 38,True))
        d.rounded_rectangle((margin-20,h-150,margin+fw+20,h-78),22,fill='#F7F6F0')
        d.text((margin,h-140),footer,font=font(30 if device=='iphone' else 38,True),fill=INK)
        for j in range(3):
            x=w-margin-95+j*32
            d.ellipse((x,h-125,x+10,h-115),fill=INK if j==i else '#A8B5A0')
        out=ROOT/'app-store/feature-images'/device/f'{i+1:02d}-{["free","daily","progress"][i]}.png'
        panel.convert('RGB').save(out,optimize=True)
        previews.append(panel.convert('RGB').resize((440,round(h*440/w)),Image.Resampling.LANCZOS))
        manifest.append({'file':str(out.relative_to(ROOT)),'size':[w,h],'source':str(path.relative_to(ROOT)),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'crop':boxes[i]})
    sheet=Image.new('RGB',(1320,previews[0].height))
    for i,img in enumerate(previews):sheet.paste(img,(440*i,0))
    sheet.save(ROOT/'app-store/feature-images'/f'preview-{device}.jpg',quality=94)
(DESIGN/'capture-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Rendered six store images and two contact sheets.')
