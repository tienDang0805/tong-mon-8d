import json
import sys


def main() -> int:
    payload = {
        "status": "BLOCKED_LEGACY_PROCEDURAL_GENERATOR",
        "code": "NATIVE_IMAGE_GENERATION_REQUIRED",
        "argv": sys.argv[1:],
        "writesPerformed": 0,
        "message": (
            "packages/art-tools/build_assets.py is permanently disabled because it contained "
            "procedural ImageDraw tileset/VFX synthesis and monolithic manifest/map rewrites. "
            "Resolve active visual masters and profiles from assets/corekit/v01b/catalog.json "
            "and use the host native image-generator subagent workflow instead."
        ),
        "historicalArchive": "packages/art-tools/legacy/build_assets.py",
    }
    sys.stderr.write(json.dumps(payload, ensure_ascii=False) + "\n")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
