"""Extract local workbook text without changing the supplied PDFs or recordings."""
import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
import json
from pathlib import Path
import time

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".local" / "workbook-ocr"
PAGES = ROOT / "whsk-backend" / "public" / "workbook" / "hsk5"
ENGINE = None


def recognize(task):
    global ENGINE
    from PIL import Image
    from rapidocr_onnxruntime import RapidOCR
    volume, page, model = task
    cache = CACHE if model == "v4" else ROOT / ".local/workbook-ocr-v5"
    cache.mkdir(parents=True, exist_ok=True)
    output = cache / f"{volume}-{page}.json"
    if output.exists():
        return volume, page, "cached"
    if ENGINE is None:
        options = {"rec_model_path": str(ROOT / ".local/ocr-models/ch_PP-OCRv5_rec_mobile.onnx")} if model == "v5" else {}
        ENGINE = RapidOCR(intra_op_num_threads=2, inter_op_num_threads=1,
                          use_cls=False, det_limit_side_len=960, text_score=0.45, **options)
    source = PAGES / volume / f"{page}.webp"
    image = Image.open(source)
    prior = CACHE / f"{volume}-{page}.json"
    if model == "v5" and prior.exists():
        import numpy as np
        old = json.loads(prior.read_text(encoding="utf-8"))
        boxes = [np.array(line["box"], dtype=np.float32) for line in old["lines"]]
        crops = ENGINE.get_crop_img_list(ENGINE.load_img(str(source)), boxes)
        recognized, _ = ENGINE.text_rec(crops)
        result = [(box.tolist(), row[0], row[1]) for box, row in zip(boxes, recognized)]
    else:
        result, _ = ENGINE(str(source))
    lines = []
    for box, text, score in result or []:
        lines.append({"box": box, "text": text, "confidence": round(float(score), 4)})
    value = {"volume": volume, "page": page, "model": model, "width": image.width,
             "height": image.height, "lines": lines}
    output.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    return volume, page, len(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lessons", nargs="*", type=int)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--model", choices=["v4", "v5"], default="v5")
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    course = json.loads((ROOT / "whsk-backend/data/hsk5-course.json").read_text(encoding="utf-8"))
    tasks = []
    for section in course["sections"]:
        for lesson in section["lessons"]:
            if args.lessons and lesson["number"] not in args.lessons:
                continue
            tasks += [(lesson["volume"], page, args.model) for activity in lesson["activities"] for page in activity["pages"]]
    tasks = list(dict.fromkeys(tasks))
    started = time.monotonic()
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        for index, future in enumerate(as_completed([pool.submit(recognize, task) for task in tasks]), 1):
            volume, page, count = future.result()
            if index <= 8 or index % 12 == 0 or index == len(tasks):
                print(f"{index}/{len(tasks)}: {volume} page {page}: {count}; {time.monotonic() - started:.1f}s", flush=True)


if __name__ == "__main__":
    main()
