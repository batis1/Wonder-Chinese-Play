"""Read the actual audio streams, not just their filenames."""
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
media = json.loads((ROOT / "whsk-backend/data/hsk5-media.json").read_text(encoding="utf-8"))
files = [ROOT / relative for volume in media.values() for relative in volume.values()]

def duration(file):
    output = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(file)])
    seconds = float(json.loads(output)["format"]["duration"])
    if seconds <= 0:
        raise ValueError(f"Empty audio: {file.name}")
    return seconds

with ThreadPoolExecutor(max_workers=4) as pool:
    seconds = list(pool.map(duration, files))
print(json.dumps({"verifiedAudioStreams": len(seconds), "shortestSeconds": round(min(seconds), 2), "longestSeconds": round(max(seconds), 2), "totalHours": round(sum(seconds) / 3600, 2)}))
