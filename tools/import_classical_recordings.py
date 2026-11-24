#!/usr/bin/env python3
"""Acquire full, licensed recorded performances. Never synthesize replacement audio."""
import hashlib, json, pathlib, shutil, subprocess, tempfile, urllib.request, urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[1]
WEB=ROOT/'src/MichelsLife/frontend/assets/audio/classical'
RAW=ROOT/'android/app/src/main/res/raw'
FILENAME='PMLP19418-Tchaikovsky_-_Morning_Prayer_from_Album_for_the_Young_for_piano_performed_by_Ramón_León_Egea.mp3'
h=hashlib.md5(FILENAME.encode()).hexdigest()
encoded=urllib.parse.quote(FILENAME)
SOURCES=[
 dict(id='mozart_k545',title='Sonata K.545 — I. Allegro',performer='Robin Alciatore (recording metadata); Musopen',license='Public domain / attribution',license_url='https://creativecommons.org/publicdomain/mark/1.0/',source_page="https://commons.wikimedia.org/wiki/File:Wolfgang_Amadeus_Mozart_-_sonata_no._16_in_c_major,_k.545_%27sonata_facile%27_-_i._allegro.ogg",url='https://upload.wikimedia.org/wikipedia/commons/3/38/Wolfgang_Amadeus_Mozart_-_sonata_no._16_in_c_major%2C_k.545_%27sonata_facile%27_-_i._allegro.ogg',sha1='5cfa6f8bbc66f151e1f614ede50446b1344e1bb1',seconds=133.88),
 dict(id='tchaikovsky_op39',title='Morning Prayer, Op.39 No.1',performer='Ramón León Egea, piano (2025)',license='CC BY-SA 4.0',license_url='https://creativecommons.org/licenses/by-sa/4.0/',source_page='https://imslp.org/wiki/Album_pour_Enfants,_Op.39_(Tchaikovsky,_Pyotr_Ilyich)',url='https://s9.imslp.org/files/imglnks/usimg/'+h[0]+'/'+h[:2]+'/'+encoded,seconds=119,source_id='IMSLP #977254')
]
def duration(path):
    data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
    assert any(s['codec_type']=='audio' for s in data['streams']), 'not audio'
    return float(data['format']['duration'])
def main():
    manifest=[]
    with tempfile.TemporaryDirectory() as tmp:
        tmp=pathlib.Path(tmp)
        for item in SOURCES:
            original=tmp/(item['id']+'.original')
            req=urllib.request.Request(item['url'],headers={'User-Agent':"MichelsLife/1.0 (licensed public music import; https://github.com/michels-lab/michel-s-life)"})
            with urllib.request.urlopen(req,timeout=90) as response, original.open('wb') as output:
                shutil.copyfileobj(response,output)
            data=original.read_bytes()
            assert 100000<len(data)<20000000,'wrong file size'
            if item.get('sha1'): assert hashlib.sha1(data).hexdigest()==item['sha1'],'unexpected source recording'
            seconds=duration(original)
            assert abs(seconds-item['seconds'])<4,'recording duration mismatch'
            target=tmp/(item['id']+'.mp3')
            subprocess.run(['ffmpeg','-v','error','-i',str(original),'-map','0:a:0','-c:a','libmp3lame','-b:a','160k','-ar','44100','-metadata','title='+item['title'],'-metadata','artist='+item['performer'],'-metadata','copyright='+item['license']+' '+item['license_url'],str(target)],check=True)
            assert abs(duration(target)-seconds)<.5,'full performance was truncated'
            manifest.append({**item,'source_sha256':hashlib.sha256(data).hexdigest(),'asset_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'duration_seconds':duration(target),'modifications':'MP3 codec conversion only; full performance; no synthesis or edits'})
        WEB.mkdir(parents=True,exist_ok=True)
        for item in manifest:
            name=item['id'];shutil.copy2(tmp/(name+'.mp3'),WEB/(name+'.mp3'))
            shutil.copy2(tmp/(name+'.mp3'),RAW/('mlv_focus_'+name+'.mp3'))
            old=RAW/('mlv_focus_'+name+'.wav')
            if old.exists(): old.unlink()
        (WEB/'RECORDINGS.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print('VERIFIED LICENSED FULL RECORDINGS', [(x['id'],x['duration_seconds'],x['asset_sha256']) for x in manifest])
if __name__=='__main__': main()
