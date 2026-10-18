"""Turn cached local OCR into numbered exercises; fail on incomplete answer choices."""
import argparse
import json
from pathlib import Path
import re
import statistics
from difflib import SequenceMatcher

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "whsk-backend/data"
PUBLIC = ROOT / "whsk-backend/public/workbook/hsk5"
DEST = DATA / "hsk5-exercises"
NUMBER = re.compile(r"^\s*(\d{1,2})\s*[.．。､、]\s*(.*)$")
LISTEN_NUMBER = re.compile(r"^\s*(\d{1,2})\s*[.．。､、]?\s*A\s*(.*)$")
RANGE = re.compile(r"^\s*\d+\s*[-—–~]\s*\d+")
V4_CHARACTERS = None


def reconcile_text(original, newer):
    global V4_CHARACTERS
    if V4_CHARACTERS is None:
        import importlib.util
        import onnxruntime as ort
        package = Path(importlib.util.find_spec("rapidocr_onnxruntime").origin).parent
        options = ort.SessionOptions()
        options.intra_op_num_threads = 1
        session = ort.InferenceSession(str(package / "models/ch_PP-OCRv4_rec_infer.onnx"), sess_options=options, providers=["CPUExecutionProvider"])
        V4_CHARACTERS = set(session.get_modelmeta().custom_metadata_map["character"].splitlines())
    a, b = original["text"], newer["text"]
    pieces = []
    for operation, a0, a1, b0, b1 in SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        old, new = a[a0:a1], b[b0:b1]
        unsupported = any("\u3400" <= character <= "\u9fff" and character not in V4_CHARACTERS for character in new)
        if operation == "insert":
            pieces.append(new if unsupported or (len(new) <= 2 and all("\u3400" <= character <= "\u9fff" for character in new)) else "")
        elif operation == "replace" and (unsupported or (original["confidence"] < .94 and newer["confidence"] > .98)):
            pieces.append(new)
        else:
            pieces.append(old)
    return "".join(pieces)


def clean(text):
    return text.strip().translate(str.maketrans("ＡＢＣＤ", "ABCD"))


def read_page(volume, page, require_v5):
    file = ROOT / f".local/workbook-ocr-v5/{volume}-{page}.json"
    if not file.exists() and not require_v5:
        file = ROOT / f".local/workbook-ocr/{volume}-{page}.json"
    raw = json.loads(file.read_text(encoding="utf-8"))
    old_file = ROOT / f".local/workbook-ocr/{volume}-{page}.json"
    if "workbook-ocr-v5" in str(file) and old_file.exists():
        old = json.loads(old_file.read_text(encoding="utf-8"))
        by_box = {tuple(coordinate for point in row["box"] for coordinate in point): row for row in raw["lines"]}
        for row in old["lines"]:
            newer = by_box.get(tuple(coordinate for point in row["box"] for coordinate in point))
            if newer:
                row["text"] = reconcile_text(row, newer)
        raw = old
    lines = []
    for item in raw["lines"]:
        box = item["box"]
        x, y = min(point[0] for point in box), min(point[1] for point in box)
        right, bottom = max(point[0] for point in box), max(point[1] for point in box)
        if x > raw["width"] * .90 or y > raw["height"] * .98 or (y > raw["height"] * .85 and re.fullmatch(r"\d{1,3}", item["text"].strip())):
            continue
        lines.append({"x": x, "y": y, "right": right, "bottom": bottom,
                      "text": clean(item["text"]), "confidence": item["confidence"]})
    raw["items"] = lines
    return raw


def rows(lines):
    groups = []
    for line in sorted(lines, key=lambda item: (item["y"], item["x"])):
        center = (line["y"] + line["bottom"]) / 2
        found = next((group for group in reversed(groups[-3:]) if abs(group["center"] - center) < 11), None)
        if found is None:
            groups.append({"center": center, "items": [line]})
        else:
            found["items"].append(line)
    result = []
    for group in groups:
        items = sorted(group["items"], key=lambda item: item["x"])
        result.append({"x": items[0]["x"], "y": min(item["y"] for item in items),
                       "bottom": max(item["bottom"] for item in items), "items": items,
                       "text": "".join(item["text"] for item in items)})
    return sorted(result, key=lambda row: row["y"])


def option_parts(text):
    text = clean(text)
    if not re.match(r"^[ABCD](?![A-Z])", text):
        return []
    matches = list(re.finditer(r"([ABCD])(?=[^A-Z]|$)", text))
    return [(match.group(1), text[match.end():matches[index + 1].start() if index + 1 < len(matches) else len(text)].strip(" .．、")) for index, match in enumerate(matches)]


def add_options(question, text):
    parts = option_parts(text)
    if parts:
        for letter, value in parts:
            question["options"].setdefault(letter, "")
            question["options"][letter] += value
        return True
    return False


def paragraph_text(lines):
    paragraphs = []
    current = ""
    left = min((row["x"] for row in lines), default=0)
    for row in lines:
        text = row["text"]
        if not text:
            continue
        if current and row["x"] > left + 30 and current[-1] in "。！？””":
            paragraphs.append(current)
            current = ""
        current += text
    if current:
        paragraphs.append(current)
    return "\n\n".join(paragraphs)


def parse_listening(raw, numbers):
    anchors = [line for line in raw["items"] if (m := LISTEN_NUMBER.match(line["text"])) and int(m[1]) in numbers]
    split = (min(line["x"] for line in anchors) + max(line["x"] for line in anchors)) / 2
    questions = {}
    for column in [False, True]:
        active = None
        for row in rows([line for line in raw["items"] if (line["x"] > split) == column]):
            match = LISTEN_NUMBER.match(row["text"])
            if match and int(match[1]) in numbers:
                number = int(match[1])
                active = {"number": number, "type": "choice", "instruction": "听录音，选择正确答案。", "options": {"A": match[2]}, "sourcePage": raw["page"]}
                questions[number] = active
            elif active:
                if not add_options(active, row["text"]):
                    active["options"][next(reversed(active["options"]))] += row["text"]
    return questions


def parse_cloze(raw, numbers):
    ordered = rows(raw["items"])
    anchors = [row for row in ordered if (match := LISTEN_NUMBER.match(row["text"])) and int(match[1]) in numbers]
    if not anchors:
        raise ValueError("No cloze choice rows")
    first_y = anchors[0]["y"]
    instruction = next((row for row in ordered if "第15" in row["text"]), None)
    body = [row for row in ordered if (instruction["bottom"] if instruction else raw["height"] * .22) < row["y"] < first_y - 5]
    passage = paragraph_text(body)
    for number in numbers:
        passage = re.sub(rf"_*(?<!\d){number}(?!\d)_*", f"[[{number}]]", passage)
    questions, active = {}, None
    for row in ordered:
        match = LISTEN_NUMBER.match(row["text"])
        if match and int(match[1]) in numbers:
            number = int(match[1])
            active = {"number": number, "type": "cloze", "instruction": f"选择合适的词语，填入第{number}空。", "passage": passage, "options": {}, "sourcePage": raw["page"]}
            questions[number] = active
            add_options(active, "A" + match[2])
        elif active and row["y"] >= first_y:
            add_options(active, row["text"])
    return questions


def parse_reading(raw, numbers, shared):
    ordered = rows(raw["items"])
    questions, active = {}, None
    body, prose = [], []
    for row in ordered:
        match = NUMBER.match(row["text"])
        if match and int(match[1]) in numbers:
            number = int(match[1])
            printed_number = number
            if number in questions:
                number = next((item for item in numbers if item > max(questions) and item not in questions), number)
            active = {"number": number, "type": "choice", "instruction": "阅读短文，选择正确答案。" if shared else "选择与短文内容一致的一项。", "prompt": match[2] if shared else "", "options": {}, "sourcePage": raw["page"], "_rows": []}
            if printed_number != number:
                active["printedNumber"] = printed_number
            questions[number] = active
            if not shared:
                active["_rows"].append({**row, "text": match[2]})
        elif active:
            if not add_options(active, row["text"]):
                if active["options"]:
                    active["options"][next(reversed(active["options"]))] += row["text"]
                else:
                    active["_rows"].append(row)
        elif row["y"] > raw["height"] * .07:
            if ("部分" in row["text"] and len(row["text"]) < 8) or re.match(r"^第\s*\d", row["text"]) or RANGE.match(row["text"]):
                continue
            if row["text"].startswith("标准教程") or row["text"] == "HSK":
                continue
            body.append(row)
    if shared:
        passage = paragraph_text(body)
        for question in questions.values():
            question["passage"] = passage
            question.pop("_rows")
    else:
        for question in questions.values():
            question["passage"] = paragraph_text(question.pop("_rows"))
    return questions


def parse_writing(raw, numbers):
    ordered = rows(raw["items"])
    questions = {}
    for row in ordered:
        match = NUMBER.match(row["text"])
        if not match or int(match[1]) not in numbers:
            continue
        number = int(match[1])
        if number < 32:
            tokens = [NUMBER.sub(lambda value: value[2], item["text"]) if index == 0 else item["text"] for index, item in enumerate(row["items"])]
            questions[number] = {"number": number, "type": "sentence", "instruction": "用下面的词语完成句子。", "wordBank": tokens, "sourcePage": raw["page"]}
        else:
            later = [item for item in ordered if item["y"] > row["bottom"] and item["y"] < raw["height"] * .90]
            prompt = match[2]
            continuation = []
            while later and later[0]["y"] - (row["bottom"] if not continuation else continuation[-1]["bottom"]) < 18:
                continuation.append(later.pop(0))
            prompt += "".join(item["text"] for item in continuation)
            question = {"number": number, "type": "composition", "instruction": prompt, "targetLength": 80, "sourcePage": raw["page"]}
            if "词语" in prompt:
                words = re.split(r"[、，,]", "".join(item["text"] for item in later))
                question["wordBank"] = [word.strip(" 。") for word in words if word.strip(" 。")]
            questions[number] = question
    return questions


def extract_figures(raw):
    import cv2
    import numpy as np
    from PIL import Image
    source = PUBLIC / raw["volume"] / f"{raw['page']}.webp"
    image = Image.open(source).convert("RGB")
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
    mask = (gray < 225).astype(np.uint8) * 255
    for line in raw["lines"]:
        points = np.array(line["box"], dtype=np.int32)
        x, y, width, height = cv2.boundingRect(points)
        mask[max(0, y-3):y+height+3, max(0, x-3):x+width+3] = 0
    mask[:int(raw["height"] * .10)] = 0
    mask[int(raw["height"] * .92):] = 0
    mask[:, :int(raw["width"] * .08)] = 0
    mask[:, int(raw["width"] * .92):] = 0
    joined = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(joined)
    figures = []
    folder = PUBLIC / "illustrations"
    folder.mkdir(exist_ok=True)
    for x, y, width, height, area in stats[1:]:
        if width < 70 or height < 65 or area < 2500 or area / (width * height) < .10:
            continue
        if width > raw["width"] * .80 or height > raw["height"] * .55:
            continue
        rect = [max(0, int(x)-5), max(0, int(y)-5), min(raw["width"], int(x+width)+5), min(raw["height"], int(y+height)+5)]
        name = f"{raw['volume']}-{raw['page']}-{len(figures)+1}.webp"
        image.crop(rect).save(folder / name, quality=92)
        figures.append({"src": f"illustrations/{name}", "box": rect})
    return figures


def attach_figures(raw, activity, questions):
    if activity["kind"] == "listening":
        return
    figures = extract_figures(raw)
    anchors = {int(match[1]): row["y"] for row in rows(raw["items"]) if (match := NUMBER.match(row["text"])) and int(match[1]) in questions}
    first = min(anchors.values(), default=raw["height"])
    for number, question in questions.items():
        selected = []
        for figure in figures:
            center = (figure["box"][1] + figure["box"][3]) / 2
            if activity["kind"] == "writing":
                relevant = number == 32 and center > anchors.get(32, raw["height"] * .55)
            elif activity["id"].endswith(("reading-1", "reading-3")):
                relevant = center < first
            else:
                relevant = anchors.get(number, 0) < center < anchors.get(number + 1, raw["height"])
            if relevant:
                selected.append({**figure, "alt": f"Original workbook illustration, lesson {activity['id'].split('-')[0]}, question {number}"})
        if selected:
            question["illustrations"] = selected


def assemble(lesson, require_v5):
    questions = {}
    for activity in lesson["activities"]:
        numbers = activity["questions"]
        for page in activity["pages"]:
            raw = read_page(lesson["volume"], page, require_v5)
            if activity["kind"] == "listening":
                parsed = parse_listening(raw, numbers)
            elif activity["kind"] == "writing":
                parsed = parse_writing(raw, numbers)
            elif activity["id"].endswith("reading-1"):
                parsed = parse_cloze(raw, numbers)
            else:
                parsed = parse_reading(raw, numbers, activity["id"].endswith("reading-3"))
            attach_figures(raw, activity, parsed)
            questions.update(parsed)
    # Verified against workbook page 139 and the supplied official answer sheet.
    if lesson["number"] == 18:
        questions[31]["wordBank"] = [word.replace("点晴", "点睛") for word in questions[31]["wordBank"]]
    errors = []
    for number in range(1, 33):
        question = questions.get(number)
        if not question:
            errors.append(f"Question {number}: missing")
            continue
        if number <= 28:
            options = question["options"]
            if set(options) != set("ABCD") or any(not value for value in options.values()):
                errors.append(f"Question {number}: choices {options}")
            question["options"] = [{"id": letter, "text": options.get(letter, "")} for letter in "ABCD"]
        if 15 <= number <= 28 and not question.get("passage"):
            errors.append(f"Question {number}: missing passage")
        if 29 <= number <= 31 and len(question.get("wordBank", [])) < 3:
            errors.append(f"Question {number}: word bank {question.get('wordBank')}")
    result = {"lesson": lesson["number"], "volume": lesson["volume"], "source": "HSK 5 Standard Course workbook", "questions": {str(number): question for number, question in sorted(questions.items())}}
    return result, errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lessons", nargs="*", type=int)
    parser.add_argument("--require-v5", action="store_true")
    args = parser.parse_args()
    DEST.mkdir(parents=True, exist_ok=True)
    course = json.loads((DATA / "hsk5-course.json").read_text(encoding="utf-8"))
    audit = []
    for section in course["sections"]:
        for lesson in section["lessons"]:
            if args.lessons and lesson["number"] not in args.lessons:
                continue
            try:
                value, errors = assemble(lesson, args.require_v5)
                (DEST / f"{lesson['number']}.json").write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
                audit.append({"lesson": lesson["number"], "questions": len(value["questions"]), "errors": errors})
            except Exception as error:
                audit.append({"lesson": lesson["number"], "errors": [str(error)]})
    (ROOT / "output/workbook-text-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False), flush=True)
    if any(item["errors"] for item in audit):
        raise SystemExit(1)


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    main()
