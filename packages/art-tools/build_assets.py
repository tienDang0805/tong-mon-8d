import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ASSETS_DIR = ROOT / "assets"
MAPS_DIR = ROOT / "maps"


def chroma_key_extract(src_path: Path, crop_box: tuple[int, int, int, int] | None = None) -> Image.Image:
    img = Image.open(src_path).convert("RGBA")
    if crop_box is not None:
        img = img.crop(crop_box)
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 155 and b > 140 and g < min(r, b) - 35:
                px[x, y] = (0, 0, 0, 0)
            elif r < 28 and g < 28 and b < 28 and (x < 6 or x >= w - 6 or y < 6 or y >= h - 6):
                px[x, y] = (0, 0, 0, 0)
            elif r > 130 and b > 120 and g < min(r, b) - 20:
                nr = min(r, g + 18)
                nb = min(b, g + 18)
                px[x, y] = (nr, g, nb, 210)
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img


def quadrant_box(img_size: tuple[int, int], q: str, margin: int = 18) -> tuple[int, int, int, int]:
    w, h = img_size
    mx, my = w // 2, h // 2
    if q == "tl":
        return (margin, margin, mx - margin, my - margin)
    if q == "tr":
        return (mx + margin, margin, w - margin, my - margin)
    if q == "bl":
        return (margin, my + margin, mx - margin, h - margin)
    return (mx + margin, my + margin, w - margin, h - margin)


def save_normalized_portrait(extracted: Image.Image, out_path: Path) -> None:
    target_h = 76
    target_w = max(1, int(round(extracted.width * (target_h / max(1, extracted.height)))))
    if target_w > 76:
        target_w = 76
        target_h = max(1, int(round(extracted.height * (76 / max(1, extracted.width)))))
    small = extracted.resize((target_w, target_h), Image.Resampling.NEAREST)
    up = small.resize((target_w * 2, target_h * 2), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ox = (160 - up.width) // 2
    oy = 160 - up.height - 4
    canvas.alpha_composite(up, (ox, max(0, oy)))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path)


def normalize_to_sprite_base(extracted: Image.Image, max_w: int = 40, max_h: int = 50) -> Image.Image:
    ew, eh = max(1, extracted.width), max(1, extracted.height)
    scale = min(max_w / ew, max_h / eh)
    nw = max(12, int(round(ew * scale)))
    nh = max(16, int(round(eh * scale)))
    resized = extracted.resize((nw, nh), Image.Resampling.NEAREST)
    base = Image.new("RGBA", (48, 64), (0, 0, 0, 0))
    ox = (48 - nw) // 2
    oy = 58 - nh
    base.alpha_composite(resized, (ox, oy))
    return base


def make_back_view(base: Image.Image, back_col: tuple[int, int, int, int], hair_col: tuple[int, int, int, int]) -> Image.Image:
    out = base.copy()
    px = out.load()
    for y in range(8, 36):
        for x in range(12, 36):
            r, g, b, a = px[x, y]
            if a > 128 and r > 175 and g > 130 and b > 105 and (r - b) > 20:
                px[x, y] = hair_col if y < 28 else back_col
    return out


def animate_sprite_frame(
    base: Image.Image,
    direction: int,
    state: str,
    frame_idx: int,
    accent_col: tuple[int, int, int, int],
    back_col: tuple[int, int, int, int],
    hair_col: tuple[int, int, int, int]
) -> Image.Image:
    frame = Image.new("RGBA", (48, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    draw.ellipse((12, 54, 36, 60), fill=(10, 14, 22, 135))

    oriented = base
    if direction == 1:
        oriented = base.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    elif direction == 2:
        oriented = base.copy()
    elif direction == 3:
        oriented = make_back_view(base, back_col, hair_col)

    upper = oriented.crop((0, 0, 48, 43))
    lower_l = oriented.crop((0, 43, 24, 64))
    lower_r = oriented.crop((24, 43, 48, 64))

    bob = 0
    dx = 0
    leg_l_dy = 0
    leg_r_dy = 0
    leg_l_dx = 0
    leg_r_dx = 0

    if state == "idle":
        bob = [0, -1, -2, -1][frame_idx % 4]
    elif state == "walk":
        cycle_l = [-2, -1, 1, 2, 1, -1]
        cycle_r = [2, 1, -1, -2, -1, 1]
        bob_cycle = [-1, 0, -1, -1, 0, -1]
        leg_l_dy = cycle_l[frame_idx % 6]
        leg_r_dy = cycle_r[frame_idx % 6]
        bob = bob_cycle[frame_idx % 6]
        if direction in (1, 2):
            leg_l_dx = leg_l_dy // 2
            leg_r_dx = leg_r_dy // 2
    elif state == "attack":
        lunge = [0, 2, 1, 0][frame_idx % 4]
        bob = -1 if frame_idx in (1, 2) else 0
        if direction == 0:
            bob += lunge
        elif direction == 3:
            bob -= lunge
        elif direction == 1:
            dx = -lunge
        elif direction == 2:
            dx = lunge
    elif state == "cast":
        bob = [-1, -2, -3, -1][frame_idx % 4]

    frame.alpha_composite(lower_l, (max(0, leg_l_dx + dx), max(0, 43 + leg_l_dy)))
    frame.alpha_composite(lower_r, (min(24, max(0, 24 + leg_r_dx + dx)), max(0, 43 + leg_r_dy)))
    frame.alpha_composite(upper, (max(-4, min(4, dx)), max(0, bob)))

    if state == "idle":
        spark_y = 14 + (frame_idx % 3) * 2
        spark_x = 38 if frame_idx % 2 == 0 else 10
        draw.point((spark_x, spark_y), fill=accent_col)
    elif state == "attack" and frame_idx in (1, 2):
        if direction == 0:
            draw.arc((5, 34, 43, 62), start=15, end=165, fill=accent_col, width=3)
        elif direction == 3:
            draw.arc((5, 4, 43, 32), start=195, end=345, fill=accent_col, width=3)
        elif direction == 1:
            draw.arc((2, 16, 28, 54), start=105, end=255, fill=accent_col, width=3)
        elif direction == 2:
            draw.arc((20, 16, 46, 54), start=285, end=75, fill=accent_col, width=3)
    elif state == "cast" and frame_idx in (1, 2, 3):
        rad = 13 + frame_idx * 2
        draw.ellipse((24 - rad, 44 - rad // 2, 24 + rad, 59), outline=accent_col, width=2)

    return frame


def build_portraits_and_sprites() -> tuple[list[dict], list[dict], list[dict]]:
    c_dir = ASSETS_DIR / "concepts"
    p_dir = ASSETS_DIR / "portraits"
    s_dir = ASSETS_DIR / "sprites"
    prop_dir = ASSETS_DIR / "props"
    p_dir.mkdir(parents=True, exist_ok=True)
    s_dir.mkdir(parents=True, exist_ok=True)
    prop_dir.mkdir(parents=True, exist_ok=True)

    g1 = c_dir / "overworld_cast_grid_1.jpg"
    g2 = c_dir / "overworld_cast_grid_2.jpg"
    g3 = c_dir / "overworld_cast_grid_3.jpg"
    g1_size = Image.open(g1).size
    g2_size = Image.open(g2).size
    g3_size = Image.open(g3).size

    cast_sources = {
        "hero_kiem_tu": (g1, quadrant_box(g1_size, "tl"), (110, 235, 255, 245), (36, 88, 156, 255), (32, 38, 52, 255), "character_spritesheet"),
        "phi_de": (g1, quadrant_box(g1_size, "tr"), (255, 215, 80, 245), (32, 28, 42, 255), (22, 20, 28, 255), "character_spritesheet"),
        "chatdvt": (g1, quadrant_box(g1_size, "bl"), (90, 255, 210, 245), (38, 168, 134, 255), (28, 138, 108, 255), "creature_spritesheet"),
        "merchant_truong": (g1, quadrant_box(g1_size, "br"), (255, 200, 95, 245), (138, 78, 42, 255), (225, 230, 236, 255), "character_spritesheet"),
        "hoa_tran": (g2, quadrant_box(g2_size, "tl"), (135, 235, 145, 245), (72, 124, 82, 255), (96, 104, 102, 255), "character_spritesheet"),
        "dam_lon_tien_tu": (g2, quadrant_box(g2_size, "tr"), (255, 165, 210, 245), (218, 112, 158, 255), (38, 24, 36, 255), "character_spritesheet"),
        "truc_lang": (g2, quadrant_box(g2_size, "bl"), (255, 115, 85, 245), (42, 88, 62, 255), (28, 58, 42, 255), "creature_spritesheet"),
        "thanh_lan_xa": (g2, quadrant_box(g2_size, "br"), (95, 255, 165, 245), (28, 154, 144, 255), (18, 98, 92, 255), "creature_spritesheet"),
        "rmt_de": (g3, quadrant_box(g3_size, "tl"), (255, 226, 92, 245), (168, 122, 28, 255), (28, 24, 32, 255), "character_spritesheet"),
        "vaal_de": (g3, quadrant_box(g3_size, "tr"), (255, 72, 92, 245), (138, 28, 48, 255), (32, 18, 28, 255), "character_spritesheet"),
        "anh_7": (g3, quadrant_box(g3_size, "bl"), (135, 225, 255, 245), (58, 84, 112, 255), (62, 38, 28, 255), "character_spritesheet"),
        "ngoc_tam": (g3, quadrant_box(g3_size, "br"), (192, 138, 255, 245), (88, 56, 122, 255), (34, 26, 48, 255), "character_spritesheet")
    }

    extracted_map: dict[str, Image.Image] = {}
    for cid, (src_file, qbox, *_rest) in cast_sources.items():
        extracted_map[cid] = chroma_key_extract(src_file, qbox)

    phi_portrait_raw = c_dir / "capability_proof_phi_de.jpg"
    if phi_portrait_raw.exists():
        save_normalized_portrait(chroma_key_extract(phi_portrait_raw, None), p_dir / "portrait_phi_de.png")
    else:
        save_normalized_portrait(extracted_map["phi_de"], p_dir / "portrait_phi_de.png")

    hc_raw = c_dir / "portraits_hero_chatdvt_raw.jpg"
    if hc_raw.exists():
        im = Image.open(hc_raw)
        mid = im.width // 2
        save_normalized_portrait(chroma_key_extract(hc_raw, (0, 0, mid - 8, im.height)), p_dir / "portrait_hero_kiem_tu.png")
        save_normalized_portrait(chroma_key_extract(hc_raw, (mid + 8, 0, im.width, im.height)), p_dir / "portrait_chatdvt.png")

    mh_raw = c_dir / "portraits_merchant_hoatran_raw.jpg"
    if mh_raw.exists():
        im = Image.open(mh_raw)
        mid = im.width // 2
        save_normalized_portrait(chroma_key_extract(mh_raw, (0, 0, mid - 8, im.height)), p_dir / "portrait_merchant_truong.png")
        save_normalized_portrait(chroma_key_extract(mh_raw, (mid + 8, 0, im.width, im.height)), p_dir / "portrait_hoa_tran.png")

    for extra_pid in ("dam_lon_tien_tu", "rmt_de", "vaal_de", "anh_7", "ngoc_tam"):
        save_normalized_portrait(extracted_map[extra_pid], p_dir / f"portrait_{extra_pid}.png")

    portrait_entries: list[dict] = []
    for pid in ("phi_de", "hero_kiem_tu", "chatdvt", "merchant_truong", "hoa_tran", "dam_lon_tien_tu", "rmt_de", "vaal_de", "anh_7", "ngoc_tam"):
        portrait_entries.append({
            "assetId": f"portrait_{pid}",
            "file": f"assets/portraits/portrait_{pid}.png",
            "category": "portrait",
            "characterId": pid,
            "source": "Antigravity image-generator subagent + packages/art-tools/build_assets.py chroma-key normalization",
            "license": "Original AI-Assisted Project Asset",
            "status": "approved",
            "width": 160,
            "height": 160,
            "requiresTransparency": True
        })

    states = [("idle", 4), ("walk", 6), ("attack", 4), ("cast", 4)]
    sprite_entries: list[dict] = []

    for cid, (_src_file, _qbox, accent_col, back_col, hair_col, category) in cast_sources.items():
        max_w = 42 if cid in ("truc_lang", "thanh_lan_xa", "chatdvt") else 38
        max_h = 46 if cid in ("truc_lang", "thanh_lan_xa", "chatdvt") else 50
        base = normalize_to_sprite_base(extracted_map[cid], max_w=max_w, max_h=max_h)
        sheet = Image.new("RGBA", (48 * 6, 64 * 16), (0, 0, 0, 0))
        for s_idx, (state_name, f_count) in enumerate(states):
            for dir_idx in range(4):
                row = s_idx * 4 + dir_idx
                for f_idx in range(6):
                    cell = animate_sprite_frame(
                        base,
                        dir_idx,
                        state_name,
                        f_idx % f_count,
                        accent_col,
                        back_col,
                        hair_col
                    )
                    sheet.alpha_composite(cell, (f_idx * 48, row * 64))
        out_file = s_dir / f"{cid}.png"
        sheet.save(out_file)
        sprite_entries.append({
            "assetId": f"sprite_{cid}",
            "file": f"assets/sprites/{cid}.png",
            "category": category,
            "characterId": cid,
            "source": "Antigravity image-generator overworld grid + packages/art-tools/build_assets.py",
            "license": "Original AI-Assisted Project Asset",
            "status": "approved",
            "width": 288,
            "height": 1024,
            "frameWidth": 48,
            "frameHeight": 64,
            "anchor": {"x": 0.5, "y": 0.9},
            "animations": {
                "idle": {"rows": [0, 1, 2, 3], "framesPerRow": 4},
                "walk": {"rows": [4, 5, 6, 7], "framesPerRow": 6},
                "attack": {"rows": [8, 9, 10, 11], "framesPerRow": 4},
                "cast": {"rows": [12, 13, 14, 15], "framesPerRow": 4}
            }
        })

    lm_grid = c_dir / "xianxia_landmarks_grid.jpg"
    env_grid = c_dir / "xianxia_env_grid.jpg"
    lm_size = Image.open(lm_grid).size
    env_size = Image.open(env_grid).size

    prop_specs = [
        ("prop_noodle_stall", lm_grid, quadrant_box(lm_size, "tl"), (128, 128)),
        ("prop_than_dinh", lm_grid, quadrant_box(lm_size, "tr"), (96, 96)),
        ("prop_portal_arch", lm_grid, quadrant_box(lm_size, "bl"), (96, 96)),
        ("prop_bamboo_cluster", lm_grid, quadrant_box(lm_size, "br"), (96, 96)),
        ("prop_temple_pavilion", env_grid, quadrant_box(env_size, "tl"), (160, 128)),
        ("prop_peach_tree", env_grid, quadrant_box(env_size, "tr"), (96, 96)),
        ("prop_stone_lantern", env_grid, quadrant_box(env_size, "bl"), (64, 64)),
        ("prop_spirit_herb", env_grid, quadrant_box(env_size, "br"), (64, 64))
    ]

    prop_entries: list[dict] = []
    for prop_id, src_path, qbox, (pw, ph) in prop_specs:
        raw_prop = chroma_key_extract(src_path, qbox)
        scale = min((pw - 4) / max(1, raw_prop.width), (ph - 4) / max(1, raw_prop.height))
        nw = max(8, int(round(raw_prop.width * scale)))
        nh = max(8, int(round(raw_prop.height * scale)))
        resized = raw_prop.resize((nw, nh), Image.Resampling.NEAREST)
        canvas = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
        canvas.alpha_composite(resized, ((pw - nw) // 2, ph - nh))
        out_prop = prop_dir / f"{prop_id}.png"
        canvas.save(out_prop)
        prop_entries.append({
            "assetId": prop_id,
            "file": f"assets/props/{prop_id}.png",
            "category": "environment_prop",
            "source": "Antigravity image-generator environment sheet + packages/art-tools/build_assets.py",
            "license": "Original AI-Assisted Project Asset",
            "status": "approved",
            "width": pw,
            "height": ph,
            "requiresTransparency": True
        })

    return portrait_entries, sprite_entries, prop_entries


def make_tile(base_rgba: tuple[int, int, int, int]) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    im = Image.new("RGBA", (32, 32), base_rgba)
    return im, ImageDraw.Draw(im)


def stamp_prop_to_tile(prop_name: str) -> Image.Image:
    p_path = ASSETS_DIR / "props" / f"{prop_name}.png"
    if not p_path.exists():
        return Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    im = Image.open(p_path).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if bbox:
        im = im.crop(bbox)
    scale = min(30 / max(1, im.width), 30 / max(1, im.height))
    nw = max(8, int(round(im.width * scale)))
    nh = max(8, int(round(im.height * scale)))
    small = im.resize((nw, nh), Image.Resampling.NEAREST)
    tile = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    tile.alpha_composite(small, ((32 - nw) // 2, 32 - nh))
    return tile


def build_tileset() -> dict:
    ts = Image.new("RGBA", (512, 256), (0, 0, 0, 0))

    def put_tile(gid_one_based: int, tile_img: Image.Image) -> None:
        idx = gid_one_based - 1
        col = idx % 16
        row = idx // 16
        ts.alpha_composite(tile_img, (col * 32, row * 32))

    t1, d = make_tile((72, 132, 68, 255))
    for p in [(4, 6), (18, 12), (25, 22), (10, 26), (14, 5), (28, 9)]:
        d.rectangle((p[0], p[1], p[0] + 2, p[1] + 1), fill=(94, 162, 88, 255))
        d.point((p[0] + 1, p[1] + 2), fill=(52, 102, 48, 255))
    put_tile(1, t1)

    t2, d = make_tile((68, 126, 64, 255))
    for p in [(6, 8), (20, 18), (12, 24)]:
        d.rectangle((p[0], p[1], p[0] + 2, p[1] + 2), fill=(104, 174, 96, 255))
        d.point((p[0] + 1, p[1] + 1), fill=(255, 232, 128, 255))
    put_tile(2, t2)

    t3, d = make_tile((140, 130, 115, 255))
    d.rectangle((1, 1, 14, 14), fill=(158, 148, 132, 255), outline=(106, 98, 85, 255))
    d.rectangle((16, 1, 30, 14), fill=(150, 140, 124, 255), outline=(106, 98, 85, 255))
    d.rectangle((1, 16, 18, 30), fill=(148, 138, 122, 255), outline=(106, 98, 85, 255))
    d.rectangle((20, 16, 30, 30), fill=(160, 150, 134, 255), outline=(106, 98, 85, 255))
    put_tile(3, t3)

    t4, d = make_tile((156, 146, 130, 255))
    d.rectangle((2, 2, 29, 29), fill=(168, 158, 142, 255), outline=(118, 108, 94, 255))
    d.line((2, 16, 29, 16), fill=(128, 118, 104, 255))
    d.line((16, 2, 16, 29), fill=(128, 118, 104, 255))
    put_tile(4, t4)

    t5, d = make_tile((38, 82, 58, 255))
    for p in [(5, 5), (22, 9), (14, 20), (8, 27), (26, 24)]:
        d.rectangle((p[0], p[1], p[0] + 2, p[1] + 1), fill=(52, 106, 74, 255))
        d.point((p[0], p[1] + 2), fill=(28, 62, 42, 255))
    put_tile(5, t5)

    t6, d = make_tile((40, 85, 60, 255))
    for p in [(7, 10), (19, 14), (11, 25), (24, 20)]:
        d.rectangle((p[0], p[1], p[0] + 3, p[1] + 1), fill=(58, 114, 78, 255))
        d.point((p[0] + 1, p[1]), fill=(82, 148, 98, 255))
    put_tile(6, t6)

    t7, d = make_tile((86, 94, 78, 255))
    d.rectangle((1, 1, 15, 14), fill=(104, 112, 96, 255), outline=(62, 70, 56, 255))
    d.rectangle((17, 2, 30, 15), fill=(98, 106, 90, 255), outline=(62, 70, 56, 255))
    d.rectangle((2, 16, 18, 30), fill=(96, 104, 88, 255), outline=(62, 70, 56, 255))
    d.rectangle((20, 17, 30, 30), fill=(108, 116, 100, 255), outline=(62, 70, 56, 255))
    for mx, my in [(3, 14), (16, 15), (18, 28)]:
        d.rectangle((mx, my, mx + 3, my + 2), fill=(54, 112, 72, 255))
    put_tile(7, t7)

    t8, d = make_tile((38, 148, 168, 255))
    d.line((4, 8, 14, 8), fill=(112, 224, 238, 255), width=2)
    d.line((16, 20, 27, 20), fill=(112, 224, 238, 255), width=2)
    d.line((6, 26, 15, 26), fill=(26, 108, 126, 255), width=2)
    put_tile(8, t8)

    t9, d = make_tile((138, 92, 52, 255))
    for y in range(0, 32, 6):
        d.rectangle((0, y, 31, y + 4), fill=(154, 104, 60, 255), outline=(88, 54, 28, 255))
    d.rectangle((0, 0, 3, 31), fill=(112, 72, 38, 255))
    d.rectangle((28, 0, 31, 31), fill=(112, 72, 38, 255))
    put_tile(9, t9)

    t10, d = make_tile((50, 66, 84, 255))
    for x in range(0, 32, 8):
        d.rectangle((x, 0, x + 6, 31), fill=(62, 82, 104, 255), outline=(28, 38, 52, 255))
    d.rectangle((0, 0, 31, 5), fill=(242, 194, 72, 255), outline=(32, 28, 24, 255))
    put_tile(10, t10)

    t11, d = make_tile((44, 58, 76, 255))
    for x in range(0, 32, 8):
        d.rectangle((x, 0, x + 6, 27), fill=(58, 76, 98, 255), outline=(24, 34, 46, 255))
    d.rectangle((0, 26, 31, 31), fill=(198, 146, 56, 255), outline=(24, 22, 28, 255))
    put_tile(11, t11)

    t12, d = make_tile((218, 206, 186, 255))
    d.rectangle((0, 0, 31, 31), fill=(224, 212, 192, 255), outline=(92, 64, 42, 255))
    d.rectangle((0, 0, 4, 31), fill=(124, 78, 46, 255))
    d.rectangle((27, 0, 31, 31), fill=(124, 78, 46, 255))
    d.rectangle((8, 6, 23, 22), fill=(255, 218, 122, 255), outline=(92, 58, 34, 255))
    d.line((15, 6, 15, 22), fill=(92, 58, 34, 255))
    d.line((8, 14, 23, 14), fill=(92, 58, 34, 255))
    put_tile(12, t12)

    t13, d = make_tile((124, 72, 42, 255))
    d.rectangle((2, 1, 29, 31), fill=(148, 52, 42, 255), outline=(42, 24, 20, 255))
    d.line((16, 1, 16, 31), fill=(42, 24, 20, 255), width=2)
    d.ellipse((10, 14, 14, 18), fill=(245, 198, 72, 255))
    d.ellipse((18, 14, 22, 18), fill=(245, 198, 72, 255))
    put_tile(13, t13)

    t14, d = make_tile((0, 0, 0, 0))
    d.rectangle((4, 10, 28, 15), fill=(142, 98, 56, 255), outline=(48, 32, 18, 255))
    d.rectangle((4, 20, 28, 25), fill=(142, 98, 56, 255), outline=(48, 32, 18, 255))
    d.rectangle((6, 4, 11, 30), fill=(162, 114, 66, 255), outline=(48, 32, 18, 255))
    d.rectangle((21, 4, 26, 30), fill=(162, 114, 66, 255), outline=(48, 32, 18, 255))
    put_tile(14, t14)

    put_tile(15, stamp_prop_to_tile("prop_noodle_stall"))
    put_tile(16, stamp_prop_to_tile("prop_than_dinh"))
    put_tile(17, stamp_prop_to_tile("prop_stone_lantern"))

    peach_full = Image.open(ASSETS_DIR / "props" / "prop_peach_tree.png").convert("RGBA").resize((32, 64), Image.Resampling.NEAREST)
    put_tile(18, peach_full.crop((0, 32, 32, 64)))
    put_tile(19, peach_full.crop((0, 0, 32, 32)))

    bamboo_full = Image.open(ASSETS_DIR / "props" / "prop_bamboo_cluster.png").convert("RGBA").resize((32, 64), Image.Resampling.NEAREST)
    put_tile(20, bamboo_full.crop((0, 32, 32, 64)))
    put_tile(21, bamboo_full.crop((0, 0, 32, 32)))

    t22, d = make_tile((0, 0, 0, 0))
    d.ellipse((3, 21, 29, 31), fill=(16, 22, 26, 140))
    d.ellipse((3, 7, 29, 29), fill=(108, 118, 124, 255), outline=(36, 42, 46, 255))
    d.ellipse((7, 10, 22, 21), fill=(142, 154, 160, 255))
    d.ellipse((9, 8, 18, 14), fill=(72, 148, 88, 255))
    put_tile(22, t22)

    put_tile(23, stamp_prop_to_tile("prop_spirit_herb"))
    put_tile(24, stamp_prop_to_tile("prop_portal_arch"))

    out_path = ASSETS_DIR / "tilesets" / "bat_hoang_tileset.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    ts.save(out_path)

    return {
        "assetId": "tileset_bat_hoang",
        "file": "assets/tilesets/bat_hoang_tileset.png",
        "category": "tileset",
        "source": "Antigravity image-generator environment sheet + packages/art-tools/build_assets.py",
        "license": "Original AI-Assisted Project Asset",
        "status": "approved",
        "width": 512,
        "height": 256,
        "tileWidth": 32,
        "tileHeight": 32,
        "tileCount": 128
    }


def build_vfx_and_contact_sheet() -> list[dict]:
    vfx_dir = ASSETS_DIR / "vfx"
    vfx_dir.mkdir(parents=True, exist_ok=True)

    portal_vfx = Image.new("RGBA", (64 * 4, 64), (0, 0, 0, 0))
    for i in range(4):
        cell = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(cell)
        r_outer = 24 + (i % 2) * 3
        r_inner = 14 + ((i + 1) % 2) * 3
        d.ellipse((32 - r_outer, 32 - r_outer, 32 + r_outer, 32 + r_outer), outline=(255, 212, 92, 235), width=3)
        d.ellipse((32 - r_inner, 32 - r_inner, 32 + r_inner, 32 + r_inner), fill=(52, 232, 204, 160), outline=(172, 255, 242, 255), width=2)
        portal_vfx.alpha_composite(cell, (i * 64, 0))
    portal_vfx.save(vfx_dir / "portal_ring.png")

    blessing_vfx = Image.new("RGBA", (64 * 4, 64), (0, 0, 0, 0))
    for i in range(4):
        cell = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(cell)
        rad = 12 + i * 5
        d.ellipse((32 - rad, 32 - rad, 32 + rad, 32 + rad), outline=(255, 216, 76, 245 - i * 35), width=3)
        d.ellipse((32 - 8, 32 - 8 - i * 3, 32 + 8, 32 + 8 - i * 3), fill=(255, 238, 132, 220))
        blessing_vfx.alpha_composite(cell, (i * 64, 0))
    blessing_vfx.save(vfx_dir / "phi_de_blessing.png")

    cs = Image.new("RGBA", (960, 560), (24, 28, 38, 255))
    csd = ImageDraw.Draw(cs)
    csd.rectangle((8, 8, 951, 551), outline=(245, 194, 66, 255), width=2)

    p_files = [
        "portrait_phi_de.png",
        "portrait_hero_kiem_tu.png",
        "portrait_chatdvt.png",
        "portrait_merchant_truong.png",
        "portrait_hoa_tran.png"
    ]
    for idx, pf in enumerate(p_files):
        pp = ASSETS_DIR / "portraits" / pf
        if pp.exists():
            pim = Image.open(pp).convert("RGBA")
            cs.alpha_composite(pim, (20 + idx * 175, 16))

    s_files = [
        "hero_kiem_tu.png",
        "phi_de.png",
        "chatdvt.png",
        "truc_lang.png",
        "thanh_lan_xa.png",
        "dam_lon_tien_tu.png"
    ]
    for idx, sf in enumerate(s_files):
        sp = ASSETS_DIR / "sprites" / sf
        if sp.exists():
            sim = Image.open(sp).convert("RGBA")
            strip = sim.crop((0, 4 * 64, 48 * 6, 5 * 64))
            cs.alpha_composite(strip, (20 + (idx % 3) * 305, 195 + (idx // 3) * 90))

    prop_preview = [
        "prop_noodle_stall.png",
        "prop_than_dinh.png",
        "prop_portal_arch.png",
        "prop_temple_pavilion.png",
        "prop_peach_tree.png",
        "prop_bamboo_cluster.png"
    ]
    for idx, prf in enumerate(prop_preview):
        prp = ASSETS_DIR / "props" / prf
        if prp.exists():
            prim = Image.open(prp).convert("RGBA")
            prim.thumbnail((96, 96), Image.Resampling.NEAREST)
            cs.alpha_composite(prim, (25 + idx * 150, 395))

    cs.save(ASSETS_DIR / "contact_sheet_preview.png")

    return [
        {
            "assetId": "vfx_portal_ring",
            "file": "assets/vfx/portal_ring.png",
            "category": "vfx_spritesheet",
            "source": "packages/art-tools/build_assets.py",
            "license": "Original Project Asset (MIT/Proprietary)",
            "status": "approved",
            "width": 256,
            "height": 64,
            "frameWidth": 64,
            "frameHeight": 64
        },
        {
            "assetId": "vfx_phi_de_blessing",
            "file": "assets/vfx/phi_de_blessing.png",
            "category": "vfx_spritesheet",
            "source": "packages/art-tools/build_assets.py",
            "license": "Original Project Asset (MIT/Proprietary)",
            "status": "approved",
            "width": 256,
            "height": 64,
            "frameWidth": 64,
            "frameHeight": 64
        },
        {
            "assetId": "contact_sheet_preview",
            "file": "assets/contact_sheet_preview.png",
            "category": "preview_sheet",
            "source": "packages/art-tools/build_assets.py",
            "license": "Original Project Asset (MIT/Proprietary)",
            "status": "approved",
            "width": 960,
            "height": 560
        }
    ]


def build_tiled_maps() -> None:
    MAPS_DIR.mkdir(parents=True, exist_ok=True)

    w1, h1 = 40, 30
    ground1 = [1 if (x + y) % 5 != 0 else 2 for y in range(h1) for x in range(w1)]
    paths1 = [0] * (w1 * h1)
    details1 = [0] * (w1 * h1)
    collision1 = [0] * (w1 * h1)
    interact1 = [0] * (w1 * h1)
    above1 = [0] * (w1 * h1)

    def idx1(x: int, y: int) -> int:
        return y * w1 + x

    for y in range(h1):
        for x in range(w1):
            if x == 0 or x == w1 - 1 or y == 0 or y == h1 - 1:
                collision1[idx1(x, y)] = 22
            if 14 <= y <= 16 and 4 <= x <= 36:
                paths1[idx1(x, y)] = 3
            if 10 <= y <= 20 and 12 <= x <= 24:
                paths1[idx1(x, y)] = 4
            if 24 <= y <= 26 and 2 <= x <= 37:
                ground1[idx1(x, y)] = 8
                if 18 <= x <= 21:
                    paths1[idx1(x, y)] = 9
                else:
                    collision1[idx1(x, y)] = 8

    for bx, by in [(10, 4), (19, 4), (28, 5)]:
        for rx in range(bx, bx + 4):
            paths1[idx1(rx, by + 2)] = 4
            paths1[idx1(rx, by + 3)] = 4
            collision1[idx1(rx, by + 1)] = 4
            collision1[idx1(rx, by + 2)] = 4

    for lx, ly in [(10, 13), (24, 13), (32, 13), (32, 17)]:
        details1[idx1(lx, ly)] = 17

    for tx, ty in [(6, 7), (6, 19), (28, 19), (33, 8)]:
        collision1[idx1(tx, ty)] = 18
        if ty - 1 >= 0:
            above1[idx1(tx, ty - 1)] = 19

    tmj_town = {
        "compressionlevel": -1,
        "height": h1,
        "infinite": False,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.11.0",
        "tileheight": 32,
        "tilewidth": 32,
        "type": "map",
        "version": "1.10",
        "width": w1,
        "tilesets": [
            {
                "columns": 16,
                "firstgid": 1,
                "image": "../assets/tilesets/bat_hoang_tileset.png",
                "imageheight": 256,
                "imagewidth": 512,
                "margin": 0,
                "name": "bat_hoang_tileset",
                "spacing": 0,
                "tilecount": 128,
                "tileheight": 32,
                "tilewidth": 32
            }
        ],
        "layers": [
            {"id": 1, "name": "Ground", "type": "tilelayer", "visible": True, "opacity": 1, "width": w1, "height": h1, "x": 0, "y": 0, "data": ground1},
            {"id": 2, "name": "Paths", "type": "tilelayer", "visible": True, "opacity": 1, "width": w1, "height": h1, "x": 0, "y": 0, "data": paths1},
            {"id": 3, "name": "GroundDetails", "type": "tilelayer", "visible": True, "opacity": 1, "width": w1, "height": h1, "x": 0, "y": 0, "data": details1},
            {"id": 4, "name": "Collision", "type": "tilelayer", "visible": True, "opacity": 1, "width": w1, "height": h1, "x": 0, "y": 0, "data": collision1},
            {"id": 5, "name": "Interactables", "type": "tilelayer", "visible": True, "opacity": 1, "width": w1, "height": h1, "x": 0, "y": 0, "data": interact1},
            {"id": 6, "name": "AbovePlayer", "type": "tilelayer", "visible": True, "opacity": 1, "width": w1, "height": h1, "x": 0, "y": 0, "data": above1},
            {
                "id": 7,
                "name": "Portals",
                "type": "objectgroup",
                "visible": True,
                "opacity": 1,
                "objects": [
                    {
                        "id": 101,
                        "name": "portal_town_to_forest",
                        "type": "portal",
                        "x": 1120,
                        "y": 480,
                        "width": 64,
                        "height": 64,
                        "properties": [
                            {"name": "targetZoneId", "type": "string", "value": "thanh_truc_lam"},
                            {"name": "targetSpawnId", "type": "string", "value": "from_tan_thu_thon"}
                        ]
                    }
                ]
            }
        ]
    }
    (MAPS_DIR / "tan_thu_thon.tmj").write_text(json.dumps(tmj_town, indent=2), encoding="utf-8")

    w2, h2 = 44, 32
    ground2 = [5 if (x * 3 + y) % 4 != 0 else 6 for y in range(h2) for x in range(w2)]
    paths2 = [0] * (w2 * h2)
    details2 = [0] * (w2 * h2)
    collision2 = [0] * (w2 * h2)
    interact2 = [0] * (w2 * h2)
    above2 = [0] * (w2 * h2)

    def idx2(x: int, y: int) -> int:
        return y * w2 + x

    for y in range(h2):
        for x in range(w2):
            if x == 0 or x == w2 - 1 or y == 0 or y == h2 - 1:
                collision2[idx2(x, y)] = 20
            if 14 <= y <= 16 and 3 <= x <= 38:
                paths2[idx2(x, y)] = 7
            if 9 <= y <= 24 and 18 <= x <= 22:
                paths2[idx2(x, y)] = 7

    interact2[idx2(4, 15)] = 24
    for hx, hy in [(14, 11), (26, 12), (24, 21), (32, 18)]:
        interact2[idx2(hx, hy)] = 23

    for bx, by in [
        (8, 6), (12, 7), (16, 6), (25, 6), (31, 7), (36, 8),
        (8, 22), (14, 24), (28, 23), (35, 22), (11, 19), (33, 12)
    ]:
        collision2[idx2(bx, by)] = 20
        if by - 1 >= 0:
            above2[idx2(bx, by - 1)] = 21

    tmj_forest = {
        "compressionlevel": -1,
        "height": h2,
        "infinite": False,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.11.0",
        "tileheight": 32,
        "tilewidth": 32,
        "type": "map",
        "version": "1.10",
        "width": w2,
        "tilesets": [
            {
                "columns": 16,
                "firstgid": 1,
                "image": "../assets/tilesets/bat_hoang_tileset.png",
                "imageheight": 256,
                "imagewidth": 512,
                "margin": 0,
                "name": "bat_hoang_tileset",
                "spacing": 0,
                "tilecount": 128,
                "tileheight": 32,
                "tilewidth": 32
            }
        ],
        "layers": [
            {"id": 1, "name": "Ground", "type": "tilelayer", "visible": True, "opacity": 1, "width": w2, "height": h2, "x": 0, "y": 0, "data": ground2},
            {"id": 2, "name": "Paths", "type": "tilelayer", "visible": True, "opacity": 1, "width": w2, "height": h2, "x": 0, "y": 0, "data": paths2},
            {"id": 3, "name": "GroundDetails", "type": "tilelayer", "visible": True, "opacity": 1, "width": w2, "height": h2, "x": 0, "y": 0, "data": details2},
            {"id": 4, "name": "Collision", "type": "tilelayer", "visible": True, "opacity": 1, "width": w2, "height": h2, "x": 0, "y": 0, "data": collision2},
            {"id": 5, "name": "Interactables", "type": "tilelayer", "visible": True, "opacity": 1, "width": w2, "height": h2, "x": 0, "y": 0, "data": interact2},
            {"id": 6, "name": "AbovePlayer", "type": "tilelayer", "visible": True, "opacity": 1, "width": w2, "height": h2, "x": 0, "y": 0, "data": above2},
            {
                "id": 7,
                "name": "Portals",
                "type": "objectgroup",
                "visible": True,
                "opacity": 1,
                "objects": [
                    {
                        "id": 201,
                        "name": "portal_forest_to_town",
                        "type": "portal",
                        "x": 128,
                        "y": 480,
                        "width": 64,
                        "height": 64,
                        "properties": [
                            {"name": "targetZoneId", "type": "string", "value": "tan_thu_thon"},
                            {"name": "targetSpawnId", "type": "string", "value": "from_thanh_truc_lam"}
                        ]
                    }
                ]
            }
        ]
    }
    (MAPS_DIR / "thanh_truc_lam.tmj").write_text(json.dumps(tmj_forest, indent=2), encoding="utf-8")


def main() -> None:
    portrait_entries, sprite_entries, prop_entries = build_portraits_and_sprites()
    tileset_entry = build_tileset()
    vfx_entries = build_vfx_and_contact_sheet()
    build_tiled_maps()

    manifest = {
        "version": "1.1.0",
        "styleDirection": "Candidate A — Classic Crisp 16/32-bit Xianxia Top-Down RPG",
        "logicalTileGrid": 32,
        "characterFrameSize": {"width": 48, "height": 64},
        "portraitSize": {"width": 160, "height": 160},
        "assets": [
            *portrait_entries,
            *sprite_entries,
            *prop_entries,
            tileset_entry,
            *vfx_entries
        ],
        "maps": [
            {"zoneId": "tan_thu_thon", "file": "maps/tan_thu_thon.tmj", "widthTiles": 40, "heightTiles": 30},
            {"zoneId": "thanh_truc_lam", "file": "maps/thanh_truc_lam.tmj", "widthTiles": 44, "heightTiles": 32}
        ]
    }
    (ASSETS_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
