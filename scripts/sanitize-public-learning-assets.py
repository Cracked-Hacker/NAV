#!/usr/bin/env python3
"""One-time, reproducible cleanup of NAV's public learning downloads.

Remove non-NAV employer references from the nutrition PDF and correct a
biomechanics definition consistently in every flashcard delivery format.
Do not delete independent research citations or modify the science atlas.
"""
import csv
import hashlib
import html
import io
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import time
import zipfile

import fitz
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'downloads'
FRONT='Biomechanics: position, displacement, and velocity'
BACK=('Position is a location relative to a reference frame. '
      'Displacement is final minus initial position. Average velocity equals '
      'displacement divided by elapsed time. Instantaneous velocity is the '
      'rate of change of position. State the reference frame and units.')
BAD_FRONT='Position = point in time and space'
BAD_BACK='Motion (velocity) = position over time'

def clean_nutrition():
    path=D/'NAV_Performance_Nutrition_The_Simple_Guide_v1-1.pdf'
    doc=fitz.open(path)
    if len(doc)!=18: raise RuntimeError('Unexpected nutrition-guide page count')
    content='\n'.join(p.get_text() for p in doc)
    if 'EXOS' not in content: return
    assert doc[0].get_text().count('EXOS')==1
    assert doc[17].get_text().count('EXOS')==1
    for page_index,box,copy,fontsize,align in [
        (0,fitz.Rect(40,438,575,469),
         'Published by NAV | Nathan G. Holochwost. Independent educational material.',9.4,1),
        (17,fitz.Rect(38,308,573,350),
         'Published independently by NAV and Nathan G. Holochwost. Research citations identify evidence, not sponsorship or endorsement by the cited organizations.',9.4,0),
    ]:
        page=doc[page_index]
        page.add_redact_annot(box,fill=(1,1,1))
        page.apply_redactions(images=0,graphics=0,text=0)
        result=page.insert_textbox(fitz.Rect(box.x0,box.y0+1,box.x1,box.y1+1),
                copy,fontname='helv',fontsize=fontsize,color=(.067,.094,.153),
                align=align,lineheight=1.35)
        if result<0: raise RuntimeError('PDF text overflow on page '+str(page_index+1))
    meta=doc.metadata
    doc.set_metadata({**meta,'title':'NAV Performance Nutrition - The Simple Guide (Independent Edition)',
        'subject':'General nutrition education; independently published by NAV'})
    dest=path.with_suffix('.clean.pdf')
    doc.save(dest,garbage=4,deflate=True,clean=True)
    doc.close()
    check=fitz.open(dest)
    assert len(check)==18
    assert all('EXOS' not in p.get_text() for p in check)
    assert 'not medical nutrition therapy' in '\n'.join(p.get_text() for p in check).lower()
    check.close()
    os.replace(dest,path)

def read_cards():
    path=D/'NAV_Muscle_Cards.csv'
    with path.open('r',newline='',encoding='utf-8-sig') as f: rows=list(csv.reader(f))
    assert rows[0]==['Front','Back']
    assert len(rows)==380,'Original 379 cards must remain'
    idx=[i for i,r in enumerate(rows) if BAD_FRONT in r[0]]
    if len(idx)==1:
        i=idx[0]
        assert BAD_BACK in rows[i][0]
        rows[i]=[FRONT,BACK]
        with path.open('w',newline='',encoding='utf-8') as f:
            csv.writer(f,lineterminator='\r\n').writerows(rows)
    elif not any(FRONT==r[0] for r in rows): raise RuntimeError('Biomechanics card missing')
    assert len(rows)==380
    return rows[1:]

def write_offline(cards):
    path=D/'NAV_Muscle_Cards_Offline.html'
    def esc(s): return html.escape(s,quote=True)
    pieces=[
        '<!doctype html><html lang="en"><head><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        '<title>Ultimate Muscle Card Set | NAV</title>',
        '<style>body{font:1rem/1.55 system-ui;color:#172e3d;background:#f5f6f0;max-width:54rem;margin:auto;padding:1.2rem}',
        'header,article{background:#fff;border:1px solid #c8d4ce;padding:1rem 1.4rem;border-radius:.7rem;margin-bottom:1rem}',
        'header{background:#172e3d;color:#fff}header a{color:#cbebd6}',
        'h1{font:2.4rem Georgia}h2{font-size:1.12rem}h2,p{white-space:pre-wrap;overflow-wrap:anywhere}',
        'small{color:#416052}summary{cursor:pointer}summary:focus-visible,a:focus-visible{outline:3px solid #508368;outline-offset:4px}</style>',
        '</head><body><main><header><h1>Ultimate Muscle Card Set</h1>',
        '<p>379 text-only cards. Recall the answer, then expand it. Educational study aid; not independently peer reviewed.</p>',
        '</header>'
    ]
    for i,(front,back) in enumerate(cards,1):
        pieces.extend(['<article><small>',f'{i:03d} / 379','</small><h2>',esc(front),
                       '</h2><details><summary>Reveal answer</summary><p>',
                       esc(back),'</p></details></article>'])
    pieces.append('</main></body></html>')
    content=''.join(pieces)
    assert BAD_FRONT not in content and BAD_BACK not in content
    path.write_text(content,encoding='utf-8')

def write_print(cards):
    path=D/'NAV_Muscle_Cards_Print.pdf'
    normal='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    if not (Path(normal).exists() and Path(bold).exists()):
        raise RuntimeError('Missing DejaVu fonts needed for correct anatomy symbols')
    pdfmetrics.registerFont(TTFont('NAV-Sans',normal))
    pdfmetrics.registerFont(TTFont('NAV-Bold',bold))
    front_style=ParagraphStyle('front',fontName='NAV-Bold',fontSize=10.5,leading=15,
                               textColor=colors.HexColor('#002651'),spaceBefore=12,spaceAfter=6,keepWithNext=True)
    back_style=ParagraphStyle('back',fontName='NAV-Sans',fontSize=9,leading=13,spaceAfter=12)
    title_style=ParagraphStyle('title',fontName='NAV-Bold',fontSize=18,leading=23,
                               spaceAfter=12,alignment=TA_CENTER,textColor=colors.HexColor('#002651'))
    dest=path.with_suffix('.new.pdf')
    story=[Paragraph('NAV | Ultimate Muscle Card Set',title_style),
           Paragraph('Printable question-and-answer cards · 379 study prompts · General education only',back_style),
           Spacer(1,12)]
    for i,(front,back) in enumerate(cards,1):
        story.append(Paragraph(str(i)+'. '+html.escape(front).replace('\n','<br/>'),front_style))
        story.append(Paragraph(html.escape(back).replace('\n','<br/>'),back_style))
    def footer(canvas,doc):
        canvas.saveState()
        canvas.setFont('NAV-Sans',8)
        canvas.setFillColor(colors.HexColor('#506070'))
        canvas.drawString(44,27,'NAV · Educational reference; not medical guidance')
        canvas.drawRightString(570,27,str(doc.page))
        canvas.restoreState()
    doc=SimpleDocTemplate(str(dest),pagesize=letter,rightMargin=44,leftMargin=44,
                          topMargin=48,bottomMargin=46,title='NAV Muscle Anatomy - Printable Cards')
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    check=fitz.open(dest)
    full='\n'.join(p.get_text() for p in check)
    assert FRONT in full and BAD_FRONT not in full
    assert len(check)>20
    check.close()
    os.replace(dest,path)

def fix_anki(original):
    with zipfile.ZipFile(io.BytesIO(original)) as z:
        if z.testzip(): raise RuntimeError('Broken Anki ZIP')
        contents={info.filename:z.read(info.filename) for info in z.infolist()}
    if 'collection.anki2' not in contents: raise RuntimeError('Anki collection missing')
    with tempfile.TemporaryDirectory() as tmp:
        name=Path(tmp)/'collection.anki2'
        name.write_bytes(contents['collection.anki2'])
        conn=sqlite3.connect(str(name))
        rows=conn.execute('SELECT id,flds FROM notes').fetchall()
        changed=0
        for note_id,flds in rows:
            fields=flds.split('\x1f')
            if len(fields)>=2 and BAD_FRONT in fields[0]:
                fields[0]=html.escape(FRONT)
                fields[1]=html.escape(BACK)
                new_flds='\x1f'.join(fields)
                csum=int(hashlib.sha1(fields[0].encode()).hexdigest()[:8],16)
                conn.execute('UPDATE notes SET flds=?,sfld=?,csum=?,mod=?,usn=-1 WHERE id=?',
                        (new_flds,FRONT,csum,int(time.time()),note_id))
                changed+=1
        if changed!=1 and not any(FRONT in f for _,f in rows):raise RuntimeError('Anki biomechanics card not found')
        assert conn.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        conn.commit()
        conn.close()
        contents['collection.anki2']=name.read_bytes()
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
        for name,data in contents.items(): z.writestr(name,data)
    with zipfile.ZipFile(io.BytesIO(out.getvalue())) as z:
        assert z.testzip() is None
    return out.getvalue()

def rewrite_text(s):
    # Generic item replacement for the Classroom JSON and Anki TSV in the ZIP.
    if BAD_FRONT in s: return FRONT
    if ('Segment "A" at position "B"' in s
            or ('position and motion relative to?' in s)):return BACK
    return s

def fix_tsv(data):
    rows=list(csv.reader(io.StringIO(data.decode('utf-8-sig')),delimiter='\t'))
    count=0
    for row in rows:
        for i,x in enumerate(row):
            if BAD_FRONT in x:
                row[i]=FRONT;count+=1
                if i+1<len(row):row[i+1]=BACK
    if count!=1 and not any(FRONT in '|'.join(r) for r in rows):raise RuntimeError('TSV card not found')
    output=io.StringIO(newline='')
    csv.writer(output,delimiter='\t',lineterminator='\n').writerows(rows)
    return output.getvalue().encode()

def fix_json(data):
    obj=json.loads(data)
    def walk(v):
        if isinstance(v,str):return rewrite_text(v)
        if isinstance(v,list):return [walk(x) for x in v]
        if isinstance(v,dict):return {k:walk(x) for k,x in v.items()}
        return v
    corrected=json.dumps(walk(obj),ensure_ascii=False,indent=2).encode()
    assert BAD_FRONT.encode() not in corrected
    return corrected

def update_formats(cards):
    # Correct the portable Anki deck as well as the downloadable CSV/HTML/PDF.
    apkg=D/'NAV_Ultimate_Muscle_Card_Set.apkg'
    fixed_apkg=fix_anki(apkg.read_bytes())
    apkg.write_bytes(fixed_apkg)
    zippath=D/'NAV_Ultimate_Muscle_All_Formats_2026-11.zip'
    with zipfile.ZipFile(zippath) as original:
        assert original.testzip() is None
        names=original.namelist()
        items={name:original.read(name) for name in names}
    changes={
        'NAV_Muscle_Cards.csv':(D/'NAV_Muscle_Cards.csv').read_bytes(),
        'NAV_Muscle_Cards_Offline.html':(D/'NAV_Muscle_Cards_Offline.html').read_bytes(),
        'NAV_Muscle_Cards_Print.pdf':(D/'NAV_Muscle_Cards_Print.pdf').read_bytes(),
        'NAV_Ultimate_Muscle_Card_Set.apkg':fixed_apkg,
    }
    for filename,data in changes.items():
        if filename not in items: raise RuntimeError('Expected ZIP entry missing: '+filename)
        items[filename]=data
    if 'NAV_Muscle_Cards_Anki.tsv' in items:
        items['NAV_Muscle_Cards_Anki.tsv']=fix_tsv(items['NAV_Muscle_Cards_Anki.tsv'])
    if 'NAV_Classroom_Muscle_Cards.json' in items:
        items['NAV_Classroom_Muscle_Cards.json']=fix_json(items['NAV_Classroom_Muscle_Cards.json'])
    dest=zippath.with_suffix('.new.zip')
    with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=8) as z:
        for name in names:z.writestr(name,items[name])
    with zipfile.ZipFile(dest) as z:
        assert z.testzip() is None
        assert z.read('NAV_Muscle_Cards.csv')==(D/'NAV_Muscle_Cards.csv').read_bytes()
        assert BAD_FRONT.encode() not in z.read('NAV_Muscle_Cards_Offline.html')
    os.replace(dest,zippath)

def verify():
    for name in ['Human_Sciences_Atlas_2026.pdf',
                 'NAV_Performance_Nutrition_The_Simple_Guide_v1-1.pdf',
                 'NAV_Muscle_Cards_Print.pdf']:
        pdf=fitz.open(D/name)
        text='\n'.join(p.get_text() for p in pdf)
        assert 'EXOS' not in text, 'Branded term in '+name
        assert 'Position Pattern Power' not in text, 'Branded framework in '+name
        assert 'Pillar Prep' not in text, 'Branded prep term in '+name
        pdf.close()
    csv_data=(D/'NAV_Muscle_Cards.csv').read_text()
    assert BAD_FRONT not in csv_data and BAD_BACK not in csv_data
    assert FRONT in csv_data
    assert len(list(csv.reader(io.StringIO(csv_data))))==380
    print('Verified: 379 flashcards, five formats, two PDFs, and retained atlas; forbidden phrases absent')

if __name__=='__main__':
    clean_nutrition()
    cards=read_cards()
    write_offline(cards)
    write_print(cards)
    update_formats(cards)
    verify()
