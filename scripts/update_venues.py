import json,re,urllib.request,datetime,pathlib,html
from zoneinfo import ZoneInfo
URL='https://www.boatrace.jp/owpc/pc/site/index.html'
VENUES=['桐生','戸田','江戸川','平和島','多摩川','浜名湖','蒲郡','常滑','津','三国','びわこ','住之江','尼崎','鳴門','丸亀','児島','宮島','徳山','下関','若松','芦屋','福岡','唐津','大村']
now=datetime.datetime.now(ZoneInfo('Asia/Tokyo'))
today=now.date().isoformat()
out=pathlib.Path('data/today.json')
def write(status,venues,reason=''):
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(dict(status=status,date=today,venues=venues,updated_at=now.isoformat(),source=URL,reason=reason),ensure_ascii=False,indent=2)+'\n')
try:
    req=urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0 (compatible; VenueCheck/1.0)'})
    with urllib.request.urlopen(req,timeout=25) as r:
        raw=r.read().decode('utf-8','replace')
    raw=html.unescape(raw)
    plain=re.sub(r'<[^>]+>',' ',raw)
    plain=re.sub(r'\s+',' ',plain)
    date_pattern=rf'{now.year}年\s*0?{now.month}月\s*0?{now.day}日'
    if not re.search(date_pattern,plain):
        raise ValueError('Official page date did not match Japan today')
    section=plain.split('主なレース日程')[0]
    found=[]
    for i,name in enumerate(VENUES):
        following=VENUES[i+1] if i+1<len(VENUES) else None
        pattern=re.escape(name)+r'\s*(初日|最終日|[０-９0-9]+日目|-)'
        matches=re.findall(pattern,section)
        if len(matches)!=1: raise ValueError('Ambiguous venue: '+name)
        if matches[0]!='-':found.append(name)
    if not found: raise ValueError('No venues found')
    write('verified',found)
    print('Verified',today,len(found),found)
except Exception as e:
    write('unverified',[],str(e))
    print('Not verified:',e)
