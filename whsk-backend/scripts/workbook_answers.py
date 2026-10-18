"""Extract the supplied workbook keys, separately from the textbook exercises."""
import hashlib
import json
from pathlib import Path
import re
import fitz

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "whsk-backend/data"
SOURCES = ROOT / "Workbook/Answers"
RANGES = [(1, 6), (7, 14), (15, 18), (19, 22), (23, 28)]


def clean_page(page):
    return "\n".join(line.strip() for line in page.get_text().splitlines()
                     if not re.fullmatch(r"\s*\d+\s*", line)
                     and "更多资源" not in line and "HSK 标准教程" not in line)


def extract_volume(volume, marker):
    files = sorted(SOURCES.glob(f"*{marker}*练习册*答案*.pdf"), key=lambda file: ("(1)" in file.name, file.name))
    if not files:
        raise ValueError(f"Missing {volume} workbook answer PDF")
    file = files[0]
    digest = hashlib.sha256(file.read_bytes()).hexdigest()
    doc = fitz.open(file)
    lessons = {}
    current = None
    for index, page in enumerate(doc):
        text = clean_page(page)
        heading = re.search(r"第\s*(\d{1,2})\s*课\s*([^\n]+)", text)
        if heading:
            number = int(heading[1])
            if not (1 <= number <= 18 if volume == "upper" else 19 <= number <= 36):
                raise ValueError(f"Unexpected lesson {number} in {file.name}")
            current = str(number)
            if current in lessons:
                raise ValueError(f"Duplicate lesson heading {number}")
            lessons[current] = {"volume": volume, "title": heading[2].strip(), "firstPage": index + 1, "questions": {}}
        # The lower PDF also contains a separate mock exam, outside this course.
        if re.search(r"(?:模拟|模擬).{0,6}(?:试卷|試卷|测试|考)", text):
            current = None
        if "参考答案" not in text or current is None:
            continue
        lesson = lessons[current]
        if lesson.get("answerPage"):
            raise ValueError(f"Duplicate answer sheet for lesson {current}")
        lesson["answerPage"] = index + 1
        answer_text = text.split("参考答案", 1)[1]
        for start, end in RANGES:
            match = re.search(rf"(?m)^\s*{start}\s*[-—–－]\s*{end}\s*[:：]\s*([ABCD\s]+)", answer_text)
            letters = re.sub(r"\s", "", match[1]) if match else ""
            if len(letters) != end - start + 1:
                raise ValueError(f"Lesson {current}: incomplete choices {start}-{end}: {letters!r}")
            for number, letter in zip(range(start, end + 1), letters):
                lesson["questions"][str(number)] = {"kind": "choice", "correct": letter}
        for number in [29, 30, 31, 32]:
            match = re.search(rf"(?ms)^\s*{number}\s*[.．、]\s*(.*?)(?=^\s*{number + 1}\s*[.．、]|\Z)", answer_text)
            if not match:
                raise ValueError(f"Lesson {current}: missing writing answer {number}")
            text = re.sub(r"\s+", "", match[1])
            if number == 32:
                if not re.fullmatch(r"[（(]?略[）)]?[。.]?", text):
                    raise ValueError(f"Review unexpected paragraph reference: lesson {current}: {text}")
                lesson["questions"][str(number)] = {"kind": "open", "reference": None, "sourceNote": "略"}
            else:
                variants = [value for value in re.split(r"[/／]", text) if value]
                if not variants or any(not re.search(r"[\u3400-\u9fff]", value) for value in variants):
                    raise ValueError(f"Invalid sentence: lesson {current}, question {number}")
                lesson["questions"][str(number)] = {"kind": "sentence", "acceptedAnswers": variants}
    expected = range(1, 19) if volume == "upper" else range(19, 37)
    if set(lessons) != {str(number) for number in expected}:
        raise ValueError(f"Wrong {volume} lesson coverage")
    for number, lesson in lessons.items():
        if set(lesson["questions"]) != {str(value) for value in range(1, 33)}:
            raise ValueError(f"Incomplete key for lesson {number}")
    return {"file": file.relative_to(ROOT).as_posix(), "sha256": digest, "pageCount": len(doc)}, lessons


def add_answer_metadata(course, keys):
    for volume, source in keys["sources"].items():
        course["volumes"][volume]["hasAnswerKey"] = True
        course["volumes"][volume]["answerFile"] = source["file"]
    for section in course["sections"]:
        for lesson in section["lessons"]:
            source = keys["lessons"][str(lesson["number"])]
            lesson["answerSource"] = {"volume": source["volume"], "firstPage": source["firstPage"], "answerPage": source["answerPage"]}
    return course


def prepare():
    keys = {"version": 1, "sources": {}, "lessons": {}}
    for volume, marker in [("upper", "上"), ("lower", "下")]:
        source, lessons = extract_volume(volume, marker)
        keys["sources"][volume] = source
        keys["lessons"].update(lessons)
    course_file = DATA / "hsk5-course.json"
    course = add_answer_metadata(json.loads(course_file.read_text(encoding="utf-8")), keys)
    (DATA / "hsk5-answers.json").write_text(json.dumps(keys, ensure_ascii=False, indent=2), encoding="utf-8")
    course_file.write_text(json.dumps(course, ensure_ascii=False, indent=2), encoding="utf-8")
    audit = [{"lesson": int(number), "answerPage": data["answerPage"], "choices": 28, "sentences": 3, "openWriting": "omitted in source"} for number, data in keys["lessons"].items()]
    (ROOT / "output/workbook-answer-audit.json").write_text(json.dumps(audit, indent=2), encoding="utf-8")
    print(json.dumps(audit))

