"""Rebuild the renamed OFL UI font from Debian fonts-noto-cjk 2.004.
Requires fontTools[woff]; source font is never modified in place.
"""
from pathlib import Path
from fontTools.ttLib import TTCollection
from fontTools import subset
chars=set(range(0x20,0x100))|set(range(0x2000,0x2070))|set(range(0x3000,0x3040))|set(range(0xff00,0xffef))
for p in Path('src').rglob('*'):
    if p.suffix in ['.ts','.css']: chars.update(map(ord,p.read_text()))
for weight in ['Regular','Bold']:
    font=TTCollection(f'/usr/share/fonts/opentype/noto/NotoSansCJK-{weight}.ttc').fonts[2]
    options=subset.Options();options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*']
    worker=subset.Subsetter(options);worker.populate(unicodes=chars);worker.subset(font)
    for record in font['name'].names:
        value={1:'Golf UI Sans',2:weight,3:f'GolfUISans-2.004-{weight}',4:f'Golf UI Sans {weight}',6:f'GolfUISans-{weight}',16:'Golf UI Sans',17:weight}.get(record.nameID)
        if value is not None: record.string=value.encode(record.getEncoding(),errors='replace')
    if 'CFF ' in font:
        cff=font['CFF '].cff;cff.fontNames=[f'GolfUISans-{weight}'];top=cff.topDictIndex[0];top.FamilyName='Golf UI Sans';top.FullName=f'Golf UI Sans {weight}'
    font.flavor='woff2';dest=Path(f'public/fonts/golf-ui/GolfUISans-{weight}.woff2');font.save(dest)
    print(dest,dest.stat().st_size)
