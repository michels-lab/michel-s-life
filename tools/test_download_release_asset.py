#!/usr/bin/env python3
from download_release_asset import select_release_asset


def test_skips_newer_unrelated_release():
    releases = [
        {
            "tag_name": "louderme-v0.1.5",
            "draft": False,
            "assets": [{"name": "LouderMe-v0.1.5-sideload.apk"}],
        },
        {
            "tag_name": "v3.0.215",
            "draft": False,
            "assets": [
                {"name": "AppBundle.zip", "browser_download_url": "https://example/bundle"}
            ],
        },
    ]
    match = select_release_asset(releases, "AppBundle.zip", "v")
    assert match is not None
    release, asset = match
    assert release["tag_name"] == "v3.0.215"
    assert asset["name"] == "AppBundle.zip"


def test_skips_draft_and_wrong_prefix():
    releases = [
        {
            "tag_name": "v3.0.216",
            "draft": True,
            "assets": [{"name": "AppBundle.zip"}],
        },
        {
            "tag_name": "other-v9",
            "draft": False,
            "assets": [{"name": "AppBundle.zip"}],
        },
        {
            "tag_name": "v3.0.215",
            "draft": False,
            "assets": [{"name": "AppBundle.zip"}],
        },
    ]
    match = select_release_asset(releases, "AppBundle.zip", "v")
    assert match is not None
    assert match[0]["tag_name"] == "v3.0.215"


if __name__ == "__main__":
    test_skips_newer_unrelated_release()
    test_skips_draft_and_wrong_prefix()
    print("Release asset resolver tests passed.")
