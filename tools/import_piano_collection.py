#!/usr/bin/env python3
"""Import full public-domain/CC piano performances from Wikimedia Commons."""
import hashlib,json,pathlib,shutil,subprocess,tempfile,urllib.request,urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[1]
WEB=ROOT/'src/MichelsLife/frontend/assets/audio/classical'
RAW=ROOT/'android/app/src/main/res/raw'
SOURCES=json.loads("[{\"id\":\"debussy_clair_de_lune\",\"title\":\"Clair de Lune\",\"composer\":\"Claude Debussy\",\"performer\":\"Laurens Goedhart\",\"license\":\"CC BY 3.0\",\"license_url\":\"https://creativecommons.org/licenses/by/3.0/\",\"file\":\"Clair_de_lune_(Claude_Debussy)_Suite_bergamasque.ogg\",\"seconds\":304},{\"id\":\"chopin_nocturne_op9\",\"title\":\"Nocturne Op. 9 No. 2\",\"composer\":\"Frédéric Chopin\",\"performer\":\"Peter Johnston / Musopen\",\"license\":\"CC0 1.0\",\"license_url\":\"https://creativecommons.org/publicdomain/zero/1.0/\",\"file\":\"Chopin_Nocturne_No._2_in_E_Flat_Major,_Op._9.ogg\",\"seconds\":259},{\"id\":\"satie_gymnopedie_1\",\"title\":\"Gymnopédie No. 1\",\"composer\":\"Erik Satie\",\"performer\":\"Robin Alciatore / Musopen\",\"license\":\"Public domain\",\"license_url\":\"https://creativecommons.org/publicdomain/mark/1.0/\",\"file\":\"Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg\",\"seconds\":184,\"sha1\":\"96b2343c81047abd9723488d8540b5a2af688233\"},{\"id\":\"bach_prelude_bwv846\",\"title\":\"Prelude in C major, BWV 846\",\"composer\":\"Johann Sebastian Bach\",\"performer\":\"Kimiko Ishizaka\",\"license\":\"CC0 1.0\",\"license_url\":\"https://creativecommons.org/publicdomain/zero/1.0/\",\"file\":\"Kimiko_Ishizaka_-_Bach_-_Well-Tempered_Clavier,_Book_1_-_01_Prelude_No._1_in_C_major,_BWV_846.ogg\",\"seconds\":163}]")
def duration(path):
    data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
    if not any(s['codec_type']=='audio' for s in data['streams']): raise ValueError('not audio')
    return float(data['format']['duration'])
def main():
    records=[]
    with tempfile.TemporaryDirectory() as tmp:
        tmp=pathlib.Path(tmp)
        for item in SOURCES:
            name=item['file'];h=hashlib.md5(name.encode()).hexdigest();encoded=urllib.parse.quote(name)
            url='https://upload.wikimedia.org/wikipedia/commons/'+h[0]+'/'+h[:2]+'/'+encoded
            source_page='https://commons.wikimedia.org/wiki/File:'+encoded
            original=tmp/(item['id']+'.ogg');target=tmp/(item['id']+'.mp3')
            request=urllib.request.Request(url,headers={'User-Agent':'MichelsLife/1.0 (licensed piano import; https://github.com/michels-lab/michel-s-life)'})
            with urllib.request.urlopen(request,timeout=120) as response:
                if not response.geturl().startswith('https://upload.wikimedia.org/'): raise ValueError('unexpected origin')
                data=response.read(40000001)
                if not 100000<len(data)<=40000000: raise ValueError('invalid media length')
                original.write_bytes(data)
            if item.get('sha1') and hashlib.sha1(data).hexdigest()!=item['sha1']: raise ValueError('unexpected recording hash')
            seconds=duration(original)
            if abs(seconds-item['seconds'])>4: raise ValueError('unexpected full duration')
            subprocess.run(['ffmpeg','-v','error','-i',str(original),'-map','0:a:0','-c:a','libmp3lame','-b:a','128k','-ar','44100','-metadata','title='+item['title'],'-metadata','artist='+item['performer'],'-metadata','composer='+item['composer'],'-metadata','copyright='+item['license']+' '+item['license_url'],str(target)],check=True)
            if abs(duration(target)-seconds)>.5: raise ValueError('truncated track')
            record={**item,'url':url,'source_page':source_page,'source_sha256':hashlib.sha256(data).hexdigest(),'asset_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'duration_seconds':duration(target),'modifications':'MP3 codec conversion only; full performance; no synthesis or edits'}
            records.append(record);print('VERIFIED',item['id'],seconds,record['asset_sha256'],flush=True)
        for item in records:
            id=item['id'];shutil.copy2(tmp/(id+'.mp3'),WEB/(id+'.mp3'));shutil.copy2(tmp/(id+'.mp3'),RAW/('mlv_focus_'+id+'.mp3'))
        (WEB/'PIANO.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
