import com.michelslab.michelslife.DirectUpdatePolicy;
import static com.michelslab.michelslife.DirectUpdatePolicy.Status.*;

public final class DirectUpdatePolicyTest {
    private static int checks=0;
    private static void eq(String label,Object expected,Object got){
        checks++;
        if(!expected.equals(got))
            throw new AssertionError(label+" expected="+expected+" actual="+got);
    }
    private static DirectUpdatePolicy.Status decide(String from, long code,
            String published, long publishedCode, boolean stable,boolean assets,boolean official){
        return DirectUpdatePolicy.compare(from,code,published,publishedCode,
            stable,assets,official);
    }
    public static void main(String[] args){
        String pin=DirectUpdatePolicy.DIRECT_SIGNER_SHA256;
        eq("Permanent signer -> Direct", "android-direct",
            DirectUpdatePolicy.channel(null,false,pin));
        eq("Sideload with foreign signer is NOT Direct", "test",
            DirectUpdatePolicy.channel(null,false,"03f5419fc284c0dc6070ddc4df71e6e102fb440bee16989d53becfd1885f6b25"));
        eq("Debug APK cannot impersonate Direct", "test",
            DirectUpdatePolicy.channel(null,true,pin));
        eq("Play installer wins only for non-debug builds", "google-play",
            DirectUpdatePolicy.channel("com.android.vending",false,"other"));
        eq("Debug APK cannot impersonate Play", "test",
            DirectUpdatePolicy.channel("com.android.vending",true,"other"));
        eq("unknown installer and signer", "test",
            DirectUpdatePolicy.channel("com.unknown.installer",false,""));
        eq("canonical release URL", true, DirectUpdatePolicy.officialReleaseUrl(
            "https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.221","v3.0.221"));
        eq("cannot trust lookalike host", false, DirectUpdatePolicy.officialReleaseUrl(
            "https://github.com.malicious.test/michels-lab/michel-s-life-releases/releases/tag/v3.0.221","v3.0.221"));
        eq("cannot trust altered release URL", false, DirectUpdatePolicy.officialReleaseUrl(
            "https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.221?download=1","v3.0.221"));
        eq("exact official APK URL", true, DirectUpdatePolicy.officialAssetUrl(
            "https://github.com/michels-lab/michel-s-life-releases/releases/download/v3.0.221/MichelsLife-Android-Direct-v0.2.9.apk",
            "v3.0.221","MichelsLife-Android-Direct-v0.2.9.apk"));
        eq("reject foreign APK URL", false, DirectUpdatePolicy.officialAssetUrl(
            "https://github.com/foreign/michel-s-life-releases/releases/download/v3.0.221/MichelsLife-Android-Direct-v0.2.9.apk",
            "v3.0.221","MichelsLife-Android-Direct-v0.2.9.apk"));
        eq("installed current official stable",CURRENT,
            decide("0.2.9",11,"0.2.9",11,true,true,true));
        eq("future Android candidate code wins independent of Windows tag",NEWER,
            decide("0.2.9",11,"0.2.10",12,true,true,true));
        eq("Android versionCode must increase",UNVERIFIED,
            decide("0.2.9",11,"0.2.10",11,true,true,true));
        eq("Android versionName must increase",UNVERIFIED,
            decide("0.2.9",11,"0.2.9",12,true,true,true));
        eq("version downgrade fails closed",UNVERIFIED,
            decide("0.2.9",11,"0.2.8",10,true,true,true));
        eq("prerelease fails closed",UNVERIFIED,
            decide("0.2.9",11,"0.2.10",12,false,true,true));
        eq("APK missing checksum/manifest fails closed",UNVERIFIED,
            decide("0.2.9",11,"0.2.10",12,true,false,true));
        eq("unverified release domain fails closed",UNVERIFIED,
            decide("0.2.9",11,"0.2.10",12,true,true,false));
        eq("unparseable version fails closed",UNVERIFIED,
            decide("0.2.9",11,"latest",12,true,true,true));
        eq("zero versionCode fails closed",UNVERIFIED,
            decide("0.2.9",11,"0.2.10",0,true,true,true));
        eq("natural numeric order .10 > .9",1,
            DirectUpdatePolicy.compareVersion("0.2.10","0.2.9"));
        eq("rollback exact pin not empty",64,pin.length());
        System.out.println("PASS "+checks+"/"+checks+" Android Direct signer/channel/update policy regressions");
    }
}
