#!/usr/bin/env python3
"""Pure-stdlib PNG sample decoder for native Android16 screen evidence.

Validate actual pixels, not just a PNG container with correct CRC/hash.
Screenshots originate only from the synthetic, signed-public-APK CI emulator.
This deliberately supports canonical 8-bit noninterlaced RGB/RGBA/grayscale
and fails closed on unsupported formats rather than guessing image content.
"""
import hashlib
import struct
import zlib
from pathlib import Path

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
SAMPLE_COLS = 32
SAMPLE_ROWS = 28
MAX_INFLATED = 96 * 1024 * 1024


def _paeth(left, above, upper_left):
    p = left + above - upper_left
    a, b, c = abs(p - left), abs(p - above), abs(p - upper_left)
    if a <= b and a <= c:
        return left
    if b <= c:
        return above
    return upper_left


def visual_grid(path):
    """Return decoded RGB center-grid samples and a privacy-safe digest.

    PNG image dimensions and chunk CRC must *also* pass the caller's png_shape
    gate. Row reconstruction handles all five PNG filter algorithms.
    """
    data = Path(path).read_bytes()
    if data[:8] != PNG_SIGNATURE:
        raise ValueError("PNG signature absent")
    chunks = []
    offset = 8
    width = height = depth = color = interlace = None
    found_end = False
    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError("truncated PNG")
        n = struct.unpack(">I", data[offset:offset + 4])[0]
        end = offset + n + 12
        if n > 32 * 1024 * 1024 or end > len(data):
            raise ValueError("oversized/truncated PNG chunk")
        typ = data[offset + 4:offset + 8]
        payload = data[offset + 8:end - 4]
        if typ == b"IHDR":
            if width is not None or len(payload) != 13:
                raise ValueError("malformed PNG IHDR")
            width, height, depth, color, comp, filt, interlace = struct.unpack(">IIBBBBB", payload)
            if comp != 0 or filt != 0:
                raise ValueError("unsupported PNG compression/filter method")
        elif typ == b"IDAT":
            chunks.append(payload)
        elif typ == b"IEND":
            found_end = True
        offset = end
    if not found_end or not chunks or width is None:
        raise ValueError("PNG image data missing")
    channels = {0: 1, 2: 3, 4: 2, 6: 4}.get(color)
    if channels is None or depth != 8 or interlace != 0:
        raise ValueError("unsupported PNG pixel encoding (not 8-bit noninterlaced RGB/RGBA/gray)")
    row_bytes = width * channels
    total_bytes = (row_bytes + 1) * height
    if total_bytes > MAX_INFLATED or width < 300 or height < 400:
        raise ValueError("PNG inflated geometry outside safe bounds")
    compressed = b"".join(chunks)
    inflater = zlib.decompressobj()
    raw = inflater.decompress(compressed, total_bytes + 1)
    if (len(raw) != total_bytes or not inflater.eof or inflater.unconsumed_tail or
            inflater.unused_data or inflater.flush()):
        raise ValueError("PNG decompressed scanlines incomplete or oversized")

    sample_x = [min(width-1, ((i * 2 + 1) * width) // (SAMPLE_COLS * 2))
                for i in range(SAMPLE_COLS)]
    # Avoid the changing Android status/navigation bars. Inspect the visible
    # center 12%-86%, where actual app UI is expected to appear.
    sample_y = [min(height-1, (height * (12 * (SAMPLE_ROWS - 1 - i) +
                    86 * i)) // (100 * (SAMPLE_ROWS - 1))) for i in range(SAMPLE_ROWS)]
    previous = bytearray(row_bytes)
    grid = []
    pointer = 0
    sample_index = 0
    for y in range(height):
        filter_type = raw[pointer]
        row = bytearray(raw[pointer + 1:pointer + 1 + row_bytes])
        pointer += row_bytes + 1
        if filter_type > 4:
            raise ValueError("unknown PNG row filter")
        if filter_type != 0:
            for pos in range(row_bytes):
                left = row[pos-channels] if pos >= channels else 0
                above = previous[pos]
                upper = previous[pos-channels] if pos >= channels else 0
                if filter_type == 1:
                    predictor = left
                elif filter_type == 2:
                    predictor = above
                elif filter_type == 3:
                    predictor = (left + above) // 2
                else:
                    predictor = _paeth(left, above, upper)
                row[pos] = (row[pos] + predictor) & 0xff
        if sample_index < len(sample_y) and sample_y[sample_index] == y:
            for x in sample_x:
                i = x * channels
                if color == 0:
                    rgb = (row[i], row[i], row[i])
                elif color == 4:
                    v, a = row[i], row[i + 1]
                    rgb = (v * a // 255,) * 3
                elif color == 2:
                    rgb = tuple(row[i:i+3])
                else:
                    red, green, blue, alpha = row[i:i+4]
                    rgb = (red * alpha // 255, green * alpha // 255,
                           blue * alpha // 255)
                grid.append(rgb)
            sample_index += 1
        previous = row
    if len(grid) != SAMPLE_COLS * SAMPLE_ROWS:
        raise ValueError("PNG grid was not completely sampled")
    unique = len(set(grid))
    luminances = [(r * 299 + g * 587 + b * 114) // 1000
                  for r, g, b in grid]
    contrast = max(luminances) - min(luminances)
    if unique < 8 or contrast < 20:
        raise ValueError("empty, flat or black/white native screen (no rendered UI)")
    payload = bytes(v for rgb in grid for v in rgb)
    return {
        "colors": unique,
        "luminance_range": contrast,
        "grid_sha256": hashlib.sha256(payload).hexdigest(),
        "pixel_count": len(grid),
        "grid": grid,
    }


def changed_grid_fraction(reference, candidate, channel_threshold=24):
    if len(reference) != len(candidate) or not reference:
        raise ValueError("native screenshot comparison grid sizes differ")
    changed = sum(max(abs(a[i] - b[i]) for i in range(3)) > channel_threshold
                  for a, b in zip(reference, candidate))
    return round(changed / len(reference), 4)
