"""Build the local course from the supplied scans; never modify the originals."""
import json
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Workbook"
DEST = ROOT / "whsk-backend" / "public" / "workbook" / "hsk5"
DATA = ROOT / "whsk-backend" / "data"

SECTIONS = [
    ("了解生活", ["爱的细节", "留串钥匙给父母", "人生有选择，一切可改变"]),
    ("谈古说今", ["子路背米", "济南的泉水", "除夕的由来"]),
    ("倾听故事", ["成语故事两则", "“朝三暮四”的古今义", "别样鲁迅"]),
    ("走近科学", ["争论的奇迹", "闹钟的危害", "海外用户玩儿微信"]),
    ("放眼世界", ["锯掉生活的“筐底”", "北京的四合院", "纸上谈兵"]),
    ("修养身心", ["体重与节食", "在最美好的时刻离开", "抽象艺术美不美"]),
    ("交流文化", ["家乡的萝卜饼", "小人书摊", "汉字叔叔：一个美国人的汉字情缘"]),
    ("体会教育", ["阅读与思考", "放手", "支教行动"]),
    ("感受人生", ["给自己加满水", "你属于哪一种“忙”", "下棋"]),
    ("关注经济", ["最受欢迎的毕业生", "培养对手", "竞争让市场更高效"]),
    ("观察社会", ["登门槛效应", "身边的环保", "以堵治堵——缓解交通有妙招"]),
    ("亲近自然", ["鸟儿的护肤术", "植物会出汗", "老舍与养花"]),
]
ACTIVITIES = [
    ("listening-1", "Listening · Part 1", [0], 1, 6, "listening", 1),
    ("listening-2", "Listening · Part 2", [1], 7, 14, "listening", 2),
    ("reading-1", "Reading · Part 1", [2], 15, 18, "reading", None),
    ("reading-2", "Reading · Part 2", [3], 19, 22, "reading", None),
    ("reading-3", "Reading · Part 3", [4, 5], 23, 28, "reading", None),
    ("writing", "Writing", [6], 29, 32, "writing", None),
]

def prepare():
    from PIL import Image
    DEST.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    catalog = {"id": "hsk5-standard-workbook-v1", "hskLevel": "HSK5", "title": "HSK 5 Standard Course", "sections": [], "volumes": {}}
    for volume, marker, offset in [("upper", "上", 7), ("lower", "下", 8)]:
        pdf = next(SOURCE.glob(f"*{marker}*.pdf"))
        doc = fitz.open(pdf)
        folder = DEST / volume
        folder.mkdir(exist_ok=True)
        # Keep source-page fidelity, including pictures and the original Chinese.
        for page_index in range(len(doc)):
            target = folder / f"{page_index + 1}.webp"
            if not target.exists():
                pix = doc[page_index].get_pixmap(matrix=fitz.Matrix(1.8, 1.8))
                Image.frombytes("RGB", [pix.width, pix.height], pix.samples).save(target, quality=88)
        catalog["volumes"][volume] = {"file": str(pdf.relative_to(ROOT)), "pageCount": len(doc), "hasAnswerKey": volume == "lower"}
        for local in range(1, 19):
            number = local if volume == "upper" else local + 18
            section_index = (number - 1) // 3
            if len(catalog["sections"]) <= section_index:
                catalog["sections"].append({"number": section_index + 1, "title": SECTIONS[section_index][0], "volume": volume, "lessons": []})
            printed = 2 + (local - 1) * 7 + (local - 1) // 3
            first = printed + offset
            lesson = {"number": number, "title": SECTIONS[section_index][1][(number - 1) % 3], "volume": volume, "printedPage": printed, "firstPage": first, "activities": [], "answerPages": [161 + (local - 1) * 3, 162 + (local - 1) * 3, 163 + (local - 1) * 3] if volume == "lower" else []}
            for key, title, pages, start, end, kind, track in ACTIVITIES:
                activity = {"id": f"{number}-{key}", "title": title, "kind": kind, "pages": [first + p for p in pages], "questions": list(range(start, end + 1))}
                if track:
                    activity["audioFile"] = f"{number:02d}-{track}.mp3"
                lesson["activities"].append(activity)
            catalog["sections"][section_index]["lessons"].append(lesson)
        doc.close()
    # Resolve only the HSK 5 folders. HSK 6 directories nested in the download are excluded.
    media = {}
    for volume, marker in [("upper", "上"), ("lower", "下")]:
        candidates = [p for p in SOURCE.rglob("*.mp3") if "hsk 6" not in str(p).lower() and p.parent.name == f"hsk 5 {marker} workbook audios"]
        media[volume] = {}
        for file in candidates:
            if file.stem[:2].isdigit() and "-" in file.stem:
                media[volume][file.name] = str(file.relative_to(ROOT))
    for section in catalog["sections"]:
        for lesson in section["lessons"]:
            for activity in lesson["activities"]:
                if activity.get("audioFile") not in media[lesson["volume"]] and activity.get("audioFile"):
                    raise ValueError(f"Missing audio: {activity['id']}")
    if (DATA / "hsk5-answers.json").exists():
        from workbook_answers import add_answer_metadata
        add_answer_metadata(catalog, json.loads((DATA / "hsk5-answers.json").read_text(encoding="utf-8")))
    (DATA / "hsk5-course.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "hsk5-media.json").write_text(json.dumps(media, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Prepared 12 sections, 36 lessons, 216 activities and 72 verified audio paths.")

if __name__ == "__main__":
    prepare()
