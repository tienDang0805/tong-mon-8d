import argparse
import json
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image


HERO_CRISP_PALETTE = np.array(
    [
        [13, 17, 23],
        [24, 32, 44],
        [34, 46, 62],
        [52, 68, 88],
        [92, 108, 128],
        [148, 164, 182],
        [208, 220, 232],
        [236, 243, 249],
        [250, 253, 255],
        [38, 24, 16],
        [64, 42, 28],
        [94, 62, 42],
        [132, 88, 60],
        [196, 138, 102],
        [232, 176, 138],
        [248, 206, 170],
        [254, 228, 202],
        [22, 84, 78],
        [34, 122, 112],
        [48, 162, 148],
        [74, 196, 178],
        [112, 224, 206],
        [172, 244, 230],
        [128, 88, 28],
        [178, 128, 42],
        [224, 174, 72],
        [248, 214, 118],
        [254, 242, 178],
        [176, 44, 44],
        [228, 74, 68],
        [52, 142, 220],
        [108, 196, 250],
    ],
    dtype=np.float32,
)


def key_magenta_rgba(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
    r = arr[:, :, 0].astype(int)
    g = arr[:, :, 1].astype(int)
    b = arr[:, :, 2].astype(int)
    is_mag = (r > 135) & (b > 135) & (g < 122) & ((r + b) - 2 * g > 110)
    out = arr.copy()
    out[is_mag, 3] = 0
    alpha = out[:, :, 3] > 0
    spill = alpha & (r > g + 20) & (b > g + 20)
    out[spill, 0] = np.minimum(out[spill, 0], out[spill, 1] + 6)
    out[spill, 2] = np.minimum(out[spill, 2], out[spill, 1] + 10)
    edge_dark = alpha & ((r + b) - 2 * g > 58) & (g < 102)
    out[edge_dark, 0] = 13
    out[edge_dark, 1] = 17
    out[edge_dark, 2] = 23
    return Image.fromarray(out)


def key_slate_exterior_rgba(im: Image.Image, tol: float = 19.5) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
    h, w, _ = arr.shape
    border_pixels = np.concatenate(
        [arr[0, :, :3], arr[-1, :, :3], arr[:, 0, :3], arr[:, -1, :3]], axis=0
    )
    bg_rgb = np.median(border_pixels, axis=0)
    dist = np.sqrt(np.sum((arr[:, :, :3].astype(float) - bg_rgb) ** 2, axis=2))
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    is_outline = lum < 29.0
    can_traverse = (dist < tol) & (~is_outline)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if can_traverse[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if can_traverse[h - 1, x]:
            visited[h - 1, x] = True
            q.append((h - 1, x))
    for y in range(h):
        if can_traverse[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if can_traverse[y, w - 1]:
            visited[y, w - 1] = True
            q.append((y, w - 1))
    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and can_traverse[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    out = arr.copy()
    out[visited, 3] = 0
    return Image.fromarray(out)


def clear_enclosed_underarm_slate_gaps(crop_im: Image.Image) -> Image.Image:
    arr = np.array(crop_im.convert("RGBA"))
    h, w, _ = arr.shape
    y0, y1 = int(h * 0.30), int(h * 0.62)
    sub = arr[y0:y1, :, :]
    r = sub[:, :, 0].astype(float)
    g = sub[:, :, 1].astype(float)
    b = sub[:, :, 2].astype(float)
    dist_slate = np.sqrt((r - 40.0) ** 2 + (g - 49.0) ** 2 + (b - 65.0) ** 2)
    sh, sw, _ = sub.shape
    visited = np.zeros((sh, sw), dtype=bool)
    for sy in range(sh):
        for sx in range(sw):
            if not visited[sy, sx] and sub[sy, sx, 3] > 0 and dist_slate[sy, sx] < 5.5:
                comp = []
                q = deque([(sy, sx)])
                visited[sy, sx] = True
                while q:
                    cy, cx = q.popleft()
                    comp.append((cy, cx))
                    for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                        if 0 <= ny < sh and 0 <= nx < sw and not visited[ny, nx]:
                            if sub[ny, nx, 3] > 0 and dist_slate[ny, nx] < 6.5:
                                visited[ny, nx] = True
                                q.append((ny, nx))
                if 6 <= len(comp) <= 260:
                    xs_c = [p[1] for p in comp]
                    cx_mean = sum(xs_c) / len(xs_c)
                    if cx_mean < w * 0.34 or cx_mean > w * 0.66:
                        for cy, cx in comp:
                            sub[cy, cx, 3] = 0
    arr[y0:y1, :, :] = sub
    return Image.fromarray(arr)


def seal_boot_interior_rgba(crop_im: Image.Image) -> Image.Image:
    arr = np.array(crop_im.convert("RGBA"))
    h, w, _ = arr.shape
    y_start = int(h * 0.76)
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    dark_wall = (arr[:, :, 3] > 0) & (lum < 44.0)
    for y in range(y_start, h - 2):
        wall_xs = np.where(dark_wall[y, :])[0]
        if len(wall_xs) < 2:
            continue
        for i in range(len(wall_xs) - 1):
            x0, x1 = int(wall_xs[i]), int(wall_xs[i + 1])
            gap = x1 - x0 - 1
            if 1 <= gap <= int(w * 0.16):
                seg_a = arr[y, x0 + 1 : x1, 3]
                if np.any(seg_a == 0):
                    above_a = arr[max(0, y - 4) : y, x0 + 1 : x1, 3]
                    below_a = arr[y + 1 : min(h, y + 5), x0 + 1 : x1, 3]
                    if np.mean(above_a > 0) > 0.35 or np.mean(below_a > 0) > 0.35:
                        for gx in range(x0 + 1, x1):
                            if arr[y, gx, 3] == 0:
                                arr[y, gx] = (24, 32, 44, 255)
    return Image.fromarray(arr)


def find_runs_1d(mask_1d: np.ndarray, min_len: int = 8) -> list[tuple[int, int]]:
    runs: list[tuple[int, int]] = []
    in_run = False
    start = 0
    for i, val in enumerate(mask_1d):
        if val and not in_run:
            in_run = True
            start = i
        elif not val and in_run:
            in_run = False
            if i - start >= min_len:
                runs.append((start, i))
    if in_run and len(mask_1d) - start >= min_len:
        runs.append((start, len(mask_1d)))
    return runs


def split_by_valleys(proj_1d: np.ndarray, count: int, min_len: int = 8) -> list[tuple[int, int]]:
    runs = find_runs_1d(proj_1d > 0, min_len=min_len)
    if len(runs) == count:
        return runs
    n = len(proj_1d)
    step = n / float(count)
    cuts = [0]
    for i in range(1, count):
        center = int(round(i * step))
        win = max(8, int(step * 0.22))
        lo = max(cuts[-1] + min_len, center - win)
        hi = min(n - min_len, center + win)
        if lo < hi:
            best_idx = lo + int(np.argmin(proj_1d[lo:hi]))
            cuts.append(best_idx)
        else:
            cuts.append(center)
    cuts.append(n)
    out_runs: list[tuple[int, int]] = []
    for i in range(count):
        s, e = cuts[i], cuts[i + 1]
        nz = np.where(proj_1d[s:e] > 0)[0]
        if len(nz) > 0:
            out_runs.append((s + int(nz.min()), s + int(nz.max()) + 1))
        else:
            out_runs.append((s, e))
    return out_runs


def extract_pose_grid(
    im: Image.Image,
    expected_rows: int | None = None,
    expected_cols: int | None = None,
    min_row_h: int = 40,
    min_col_w: int = 20,
) -> list[list[Image.Image]]:
    arr = np.array(im)
    alpha = arr[:, :, 3] > 0
    row_proj = np.sum(alpha, axis=1)
    if expected_rows is not None:
        row_runs = split_by_valleys(row_proj, expected_rows, min_len=min_row_h)
    else:
        row_runs = find_runs_1d(row_proj > 0, min_len=min_row_h)
    rows_out: list[list[Image.Image]] = []
    for y0, y1 in row_runs:
        row_alpha = alpha[y0:y1, :]
        col_proj = np.sum(row_alpha, axis=0)
        if expected_cols is not None:
            col_runs = split_by_valleys(col_proj, expected_cols, min_len=min_col_w)
        else:
            col_runs = find_runs_1d(col_proj > 0, min_len=min_col_w)
        row_crops: list[Image.Image] = []
        for x0, x1 in col_runs:
            sub = arr[y0:y1, x0:x1].copy()
            ys, xs = np.where(sub[:, :, 3] > 0)
            if len(xs) > 0:
                crop = sub[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
                row_crops.append(Image.fromarray(crop))
        if row_crops:
            rows_out.append(row_crops)
    return rows_out


def prune_alpha_orphans(arr: np.ndarray, min_component_size: int = 4) -> np.ndarray:
    out = arr.copy()
    alpha = out[:, :, 3] > 0
    h, w = alpha.shape
    visited = np.zeros((h, w), dtype=bool)
    for y in range(h):
        for x in range(w):
            if alpha[y, x] and not visited[y, x]:
                comp = []
                q = deque([(y, x)])
                visited[y, x] = True
                while q:
                    cy, cx = q.popleft()
                    comp.append((cy, cx))
                    for ny in range(max(0, cy - 1), min(h, cy + 2)):
                        for nx in range(max(0, cx - 1), min(w, cx + 2)):
                            if alpha[ny, nx] and not visited[ny, nx]:
                                visited[ny, nx] = True
                                q.append((ny, nx))
                if len(comp) < min_component_size:
                    for cy, cx in comp:
                        out[cy, cx] = (0, 0, 0, 0)
                else:
                    has_hv_neighbor = False
                    for cy, cx in comp:
                        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                            if 0 <= ny < h and 0 <= nx < w and alpha[ny, nx]:
                                has_hv_neighbor = True
                                break
                        if has_hv_neighbor:
                            break
                    if not has_hv_neighbor:
                        for cy, cx in comp:
                            out[cy, cx] = (0, 0, 0, 0)
    for _ in range(3):
        alpha = out[:, :, 3] > 0
        removed = False
        for y in range(h):
            for x in range(w):
                if alpha[y, x]:
                    n_count = 0
                    for ny in range(max(0, y - 1), min(h, y + 2)):
                        for nx in range(max(0, x - 1), min(w, x + 2)):
                            if (ny != y or nx != x) and alpha[ny, nx]:
                                n_count += 1
                    if n_count == 0:
                        out[y, x] = (0, 0, 0, 0)
                        removed = True
        if not removed:
            break
    return out


def crisp_downsample_rgba(crop_im: Image.Image, nw: int, nh: int) -> np.ndarray:
    src = np.array(crop_im.convert("RGBA"))
    src_a = (src[:, :, 3] >= 128).astype(np.float32)
    src_rgb = src[:, :, :3].astype(np.float32)
    src_lum = 0.299 * src_rgb[:, :, 0] + 0.587 * src_rgb[:, :, 1] + 0.114 * src_rgb[:, :, 2]

    src_dark_line = ((src_a > 0.5) & (src_lum < 54.0)).astype(np.float32)
    src_fill = ((src_a > 0.5) & (src_lum >= 54.0)).astype(np.float32)

    pre_all_rgb = src_rgb * src_a[:, :, None]
    pre_fill_rgb = src_rgb * src_fill[:, :, None]

    def box_down(channel_2d: np.ndarray) -> np.ndarray:
        im_c = Image.fromarray(np.clip(channel_2d, 0.0, 255.0).astype(np.uint8))
        return np.array(im_c.resize((nw, nh), Image.Resampling.BOX), dtype=np.float32)

    a_f = box_down(src_a * 255.0) / 255.0
    dark_f = box_down(src_dark_line * 255.0) / 255.0
    fill_f = box_down(src_fill * 255.0) / 255.0

    all_r = box_down(pre_all_rgb[:, :, 0])
    all_g = box_down(pre_all_rgb[:, :, 1])
    all_b = box_down(pre_all_rgb[:, :, 2])

    fill_r = box_down(pre_fill_rgb[:, :, 0])
    fill_g = box_down(pre_fill_rgb[:, :, 1])
    fill_b = box_down(pre_fill_rgb[:, :, 2])

    mask = a_f >= 0.43

    denom_all = np.maximum(a_f, 0.05)[:, :, None]
    rgb_all = np.stack([all_r, all_g, all_b], axis=2) / denom_all

    denom_fill = np.maximum(fill_f, 0.05)[:, :, None]
    rgb_fill = np.stack([fill_r, fill_g, fill_b], axis=2) / denom_fill

    use_clean_fill = fill_f >= 0.22
    rgb = np.where(use_clean_fill[:, :, None], rgb_fill, rgb_all)
    rgb = np.clip(rgb, 0.0, 255.0)

    out = np.zeros((nh, nw, 4), dtype=np.uint8)
    out[mask, :3] = rgb[mask].astype(np.uint8)
    out[mask, 3] = 255

    internal_line = mask & (dark_f >= 0.31)
    out[internal_line, :3] = np.clip(rgb_all[internal_line] * 0.72, 0.0, 255.0).astype(np.uint8)

    deep_line = mask & (dark_f >= 0.42)
    out[deep_line, :3] = (13, 17, 23)

    for y in range(nh):
        for x in range(nw):
            if mask[y, x]:
                is_edge = False
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if ny < 0 or ny >= nh or nx < 0 or nx >= nw or not mask[ny, nx]:
                        is_edge = True
                        break
                if is_edge and dark_f[y, x] >= 0.08:
                    out[y, x, :3] = (13, 17, 23)
    return out


def place_row_coherent(
    crops: list[Image.Image],
    target_h: int = 84,
    frame_w: int = 80,
    frame_h: int = 96,
    foot_x: int = 40,
    foot_y: int = 90,
    y_bounces: list[int] | None = None,
    align_mode: str = "head",
) -> list[Image.Image]:
    sealed_crops = [seal_boot_interior_rgba(c) for c in crops]
    heights = [c.size[1] for c in sealed_crops if c.size[1] > 0]
    ref_h = float(np.median(heights)) if heights else float(target_h)
    row_scale = target_h / max(1.0, ref_h)

    frames_out: list[Image.Image] = []
    for idx, crop_im in enumerate(sealed_crops):
        cw, ch = crop_im.size
        nw = max(1, min(frame_w - 4, int(round(cw * row_scale))))
        nh = max(1, min(frame_h - 4, int(round(ch * row_scale))))
        arr = crisp_downsample_rgba(crop_im, nw, nh)
        arr = prune_alpha_orphans(arr, min_component_size=3)
        ys, xs = np.where(arr[:, :, 3] > 0)
        if len(xs) == 0:
            frames_out.append(Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0)))
            continue

        torso_band = (ys >= int(nh * 0.14)) & (ys <= int(nh * 0.58))
        if np.any(torso_band):
            center_x = int(round(np.median(xs[torso_band])))
        else:
            center_x = int(round(np.median(xs)))

        dy = y_bounces[idx] if y_bounces and idx < len(y_bounces) else 0
        top_y = int(ys.min())
        bottom_y = int(ys.max())

        if align_mode == "head":
            head_target_y = (foot_y - target_h) + dy
            paste_y = head_target_y - top_y
            if paste_y + bottom_y > frame_h - 3:
                paste_y = (frame_h - 3) - bottom_y
            if paste_y + top_y < 2:
                paste_y = 2 - top_y
        else:
            paste_y = max(1, min(frame_h - nh - 1, foot_y - bottom_y + dy))

        paste_x = max(1, min(frame_w - nw - 1, foot_x - center_x))
        canvas = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        canvas.paste(Image.fromarray(arr), (paste_x, paste_y))
        frames_out.append(canvas)

    return frames_out


def snap_sheet_to_crisp_palette(sheet: Image.Image) -> Image.Image:
    arr = np.array(sheet.convert("RGBA"))
    arr = prune_alpha_orphans(arr, min_component_size=4)
    mask = arr[:, :, 3] >= 128
    pixels = arr[mask, :3].astype(np.float32)
    diffs = pixels[:, None, :] - HERO_CRISP_PALETTE[None, :, :]
    weights = np.array([0.30, 0.59, 0.11], dtype=np.float32)
    lum_p = np.sum(pixels * weights, axis=1, keepdims=True)
    lum_pal = np.sum(HERO_CRISP_PALETTE * weights, axis=1)[None, :]
    dist2 = np.sum(diffs ** 2, axis=2) + 0.55 * ((lum_p - lum_pal) ** 2)
    nearest_idx = np.argmin(dist2, axis=1)
    snapped_rgb = HERO_CRISP_PALETTE[nearest_idx].astype(np.uint8)

    out = np.zeros_like(arr)
    out[mask, :3] = snapped_rgb
    out[mask, 3] = 255
    out = prune_alpha_orphans(out, min_component_size=4)
    return Image.fromarray(out)


def export_atlas_and_previews(sheet: Image.Image, root_dir: Path, character_id: str) -> None:
    frame_w, frame_h = 80, 96
    cols, rows = 6, 20
    frames_dir = root_dir / "assets" / "atlases" / character_id / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    atlas_frames: dict[str, dict] = {}
    state_defs = [
        ("idle", 0, 4, 4, 5),
        ("walk", 4, 4, 6, 10),
        ("attack", 8, 4, 4, 10),
        ("cast", 12, 4, 4, 10),
        ("hurt", 16, 4, 4, 10),
    ]
    dirs = ["down", "left", "right", "up"]
    state_gifs: dict[str, list[Image.Image]] = {s[0]: [] for s in state_defs}
    all_gif_frames: list[Image.Image] = []

    for state_name, start_row, row_count, frames_per_row, _ in state_defs:
        for d_idx in range(row_count):
            dir_name = dirs[d_idx]
            r = start_row + d_idx
            for c in range(frames_per_row):
                x0, y0 = c * frame_w, r * frame_h
                f_im = sheet.crop((x0, y0, x0 + frame_w, y0 + frame_h))
                f_name = f"{character_id}_{state_name}_{dir_name}_{c:02d}.png"
                f_im.save(frames_dir / f_name, "PNG")
                atlas_frames[f_name] = {
                    "frame": {"x": x0, "y": y0, "w": frame_w, "h": frame_h},
                    "rotated": False,
                    "trimmed": False,
                    "spriteSourceSize": {"x": 0, "y": 0, "w": frame_w, "h": frame_h},
                    "sourceSize": {"w": frame_w, "h": frame_h},
                    "anchor": {"x": 0.5, "y": 0.9167},
                }
                state_gifs[state_name].append(f_im)
                all_gif_frames.append(f_im)

    atlas_png_path = root_dir / "assets" / "atlases" / f"{character_id}_atlas.png"
    atlas_json_path = root_dir / "assets" / "atlases" / f"{character_id}_atlas.json"
    sheet.save(atlas_png_path, "PNG")
    atlas_meta = {
        "frames": atlas_frames,
        "meta": {
            "app": "tong-mon-8d-standard-character-packager",
            "version": "2.2.0",
            "image": f"{character_id}_atlas.png",
            "format": "RGBA8888",
            "size": {"w": cols * frame_w, "h": rows * frame_h},
            "scale": "1",
        },
    }
    atlas_json_path.write_text(json.dumps(atlas_meta, indent=2) + "\n", encoding="utf-8")

    previews_dir = root_dir / "assets" / "previews"
    previews_dir.mkdir(parents=True, exist_ok=True)
    for state_name, frames in state_gifs.items():
        if frames:
            frames[0].save(
                previews_dir / f"{character_id}_{state_name}.gif",
                save_all=True,
                append_images=frames[1:],
                duration=110,
                loop=0,
                disposal=2,
            )
    if all_gif_frames:
        all_gif_frames[0].save(
            previews_dir / f"{character_id}_all_states.gif",
            save_all=True,
            append_images=all_gif_frames[1:],
            duration=100,
            loop=0,
            disposal=2,
        )

    ba_canvas = Image.new("RGBA", (640, 320), (14, 22, 34, 255))
    sample_positions = [
        (0, 0, 20, 24),
        (4, 0, 110, 24),
        (5, 0, 200, 24),
        (5, 2, 290, 24),
        (6, 0, 380, 24),
        (6, 2, 470, 24),
        (7, 1, 550, 24),
        (8, 1, 60, 160),
        (9, 1, 180, 160),
        (10, 1, 300, 160),
        (12, 2, 420, 160),
        (16, 0, 540, 160),
    ]
    for r, c, px, py in sample_positions:
        f_im = sheet.crop((c * frame_w, r * frame_h, (c + 1) * frame_w, (r + 1) * frame_h))
        ba_canvas.alpha_composite(f_im, (px, py))
    ba_canvas.save(previews_dir / f"{character_id}_before_after.png", "PNG")


def build_hero_kiem_tu(root_dir: Path) -> None:
    sa = root_dir / "assets" / "source_ai"
    h04 = extract_pose_grid(
        clear_enclosed_underarm_slate_gaps(
            key_slate_exterior_rgba(Image.open(sa / "source_h04_native_down_idle_walk_v01b.png"), tol=20.0)
        )
    )
    h05 = extract_pose_grid(
        clear_enclosed_underarm_slate_gaps(
            key_slate_exterior_rgba(Image.open(sa / "source_h05_native_up_idle_walk_v01b.png"), tol=16.5)
        )
    )
    h06 = extract_pose_grid(
        key_slate_exterior_rgba(Image.open(sa / "source_h06_native_right_idle_walk_v01b.png"), tol=20.0)
    )
    h07 = extract_pose_grid(
        key_slate_exterior_rgba(Image.open(sa / "source_h07_native_left_idle_walk_v01b.png"), tol=20.0)
    )
    h08 = extract_pose_grid(
        key_slate_exterior_rgba(Image.open(sa / "source_h08_native_4dir_attack_v01b.png"), tol=19.5)
    )
    h09 = extract_pose_grid(
        key_slate_exterior_rgba(Image.open(sa / "source_h09_native_4dir_cast_v01b.png"), tol=19.5)
    )
    h10 = extract_pose_grid(
        key_slate_exterior_rgba(Image.open(sa / "source_h10_native_4dir_hurt_v01b.png"), tol=18.0)
    )
    h13 = extract_pose_grid(
        key_magenta_rgba(Image.open(sa / "source_h13_native_hero_idle_cast_magenta_v01b.png")),
        expected_rows=4,
        expected_cols=4,
    )
    h18 = extract_pose_grid(
        key_magenta_rgba(Image.open(sa / "source_h18_native_hero_lr_walk_smooth_v01b.png")),
        expected_rows=2,
        expected_cols=6,
    )

    sheet = Image.new("RGBA", (480, 1920), (0, 0, 0, 0))

    def put_row(
        row_idx: int,
        crops: list[Image.Image],
        target_h: int = 84,
        foot_y: int = 90,
        y_bounces: list[int] | None = None,
        align_mode: str = "head",
    ) -> None:
        cells = place_row_coherent(
            crops,
            target_h=target_h,
            foot_y=foot_y,
            y_bounces=y_bounces,
            align_mode=align_mode,
        )
        for col_idx, cell in enumerate(cells):
            sheet.paste(cell, (col_idx * 80, row_idx * 96))

    put_row(0, h04[0][:4], target_h=84, foot_y=90, y_bounces=[0, 0, -1, 0], align_mode="foot")
    put_row(1, h07[0][:4], target_h=84, foot_y=90, y_bounces=[0, 0, -1, 0], align_mode="foot")
    put_row(2, h06[0][:4], target_h=84, foot_y=90, y_bounces=[0, 0, -1, 0], align_mode="foot")
    put_row(3, h05[0][:4], target_h=84, foot_y=90, y_bounces=[0, 0, -1, 0], align_mode="foot")

    put_row(4, h04[1][:6], target_h=84, foot_y=90, y_bounces=[0, 1, 0, 0, 1, 0], align_mode="head")

    walk_left_crops = [
        h18[0][3],
        h18[0][1],
        h18[0][5],
        h18[0][4],
        h18[0][1],
        h18[0][5],
    ]
    put_row(5, walk_left_crops, target_h=84, foot_y=90, y_bounces=[0, 1, 0, 0, 0, -1], align_mode="head")

    walk_right_crops = [
        h18[1][0],
        h18[1][1],
        h18[1][2],
        h18[1][3],
        h18[1][4],
        h18[1][2],
    ]
    put_row(6, walk_right_crops, target_h=84, foot_y=90, y_bounces=[0, 1, 0, 0, 1, -1], align_mode="head")

    put_row(7, h05[1][:6], target_h=84, foot_y=90, y_bounces=[0, 1, 0, 0, 1, 0], align_mode="head")

    put_row(8, h08[0][:4], target_h=84, foot_y=90, align_mode="foot")
    put_row(9, h08[1][:4], target_h=84, foot_y=90, align_mode="foot")
    put_row(10, h08[2][:4], target_h=84, foot_y=90, align_mode="foot")
    put_row(11, h08[3][:4], target_h=86, foot_y=90, align_mode="foot")

    put_row(12, h13[3][:4], target_h=84, foot_y=90, align_mode="foot")
    put_row(13, h09[1][:4], target_h=84, foot_y=90, align_mode="foot")
    put_row(14, h09[2][:4], target_h=84, foot_y=90, align_mode="foot")
    put_row(15, h09[3][:4], target_h=86, foot_y=90, align_mode="foot")

    put_row(16, h10[0][:4], target_h=84, foot_y=90, align_mode="foot")
    put_row(17, h10[1][:4], target_h=84, foot_y=90, align_mode="foot")
    put_row(18, h10[2][:4], target_h=84, foot_y=90, align_mode="foot")
    put_row(19, h10[3][:4], target_h=84, foot_y=90, align_mode="foot")

    snapped = snap_sheet_to_crisp_palette(sheet)
    out_sprite = root_dir / "assets" / "sprites" / "hero_kiem_tu.png"
    snapped.save(out_sprite, "PNG")
    export_atlas_and_previews(snapped, root_dir, "hero_kiem_tu")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--character", default="hero_kiem_tu")
    args = parser.parse_args()
    root_dir = Path(__file__).resolve().parent.parent
    if args.character == "hero_kiem_tu":
        build_hero_kiem_tu(root_dir)
    else:
        raise SystemExit(f"Unsupported character: {args.character}")


if __name__ == "__main__":
    main()
