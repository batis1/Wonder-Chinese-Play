"""Create contact sheets of the original illustration crops for visual review."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
items = {}
for file in sorted((ROOT / "whsk-backend/data/hsk5-exercises").glob("*.json"), key=lambda path: int(path.stem)):
    lesson = json.loads(file.read_text(encoding="utf-8"))
    for question in lesson["questions"].values():
        for image in question.get("illustrations", []):
            items.setdefault(image["src"], (lesson["lesson"], question["number"], image))
entries = list(items.values())
for start in range(0, len(entries), 30):
    subset = entries[start:start+30]
    sheet = Image.new("RGB", (1000, ((len(subset)+4)//5)*200), "white")
    draw = ImageDraw.Draw(sheet)
    for index, (lesson, number, item) in enumerate(subset):
        image = Image.open(ROOT / "whsk-backend/public/workbook/hsk5" / item["src"]).convert("RGB")
        image.thumbnail((180, 166))
        x, y = index % 5 * 200, index // 5 * 200
        sheet.paste(image, (x + (200-image.width)//2, y+24))
        draw.text((x+8, y+5), f"Lesson {lesson} Q{number}: {item['box']}", fill="black")
    sheet.save(ROOT / f"output/workbook-illustrations-{start//30+1}.jpg", quality=94)
print(json.dumps({"uniqueIllustrations": len(entries), "contactSheets": (len(entries)+29)//30}))
