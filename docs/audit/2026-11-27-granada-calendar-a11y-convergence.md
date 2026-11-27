# Granada — calendar accessibility convergence

Ported the isolated accessibility enhancement from #135 (2e7676ca1e9e42b3ee29e6f7d6130ec6d883771a) into the latest Android layout without replacing subsequent Story/Focus safe-area changes. Localized date names, keyboard selection, focus restoration and polite Journal save announcements. Guard invalid dates, modifier keys and nested interactive controls; do not steal focus from another control. Existing canonical date selection and Journal persistence remain unchanged. Verify browser and physical TalkBack separately; no release.
