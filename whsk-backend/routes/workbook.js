const express = require("express");
const path = require("path");
const fs = require("fs");
const course = require("../data/hsk5-course.json");
const media = require("../data/hsk5-media.json");
const answers = require("../data/hsk5-answers.json");
const router = express.Router();
const workspace = path.resolve(__dirname, "../..");
const publicRoot = path.resolve(__dirname, '../public/workbook/hsk5');
const sourcePath = file => path.join(workspace, ...file.split(/[\\/]/));
function sendMedia(res, relative, original, options) {
  const bundled = path.join(publicRoot, relative);
  return res.sendFile(fs.existsSync(bundled) ? bundled : sourcePath(original), options);
}

router.get("/hsk5", (req, res) => {
  res.json(course);
});

router.get("/hsk5/lesson/:number", (req, res) => {
  if (!/^(?:[1-9]|[12]\d|3[0-6])$/.test(req.params.number)) return res.status(404).json({ message: "Workbook lesson not found." });
  const content = require(`../data/hsk5-exercises/${req.params.number}.json`);
  const key = answers.lessons[req.params.number];
  res.set("Cache-Control", "no-cache").json({ ...content, answerKey: key.questions, answerSource: { volume: key.volume, firstPage: key.firstPage, answerPage: key.answerPage } });
});

router.get("/hsk5/answers/:volume", (req, res) => {
  const source = answers.sources[req.params.volume];
  if (!source || !["upper", "lower"].includes(req.params.volume)) return res.status(404).json({ message: "Answer booklet not found." });
  res.type('pdf');
  sendMedia(res, path.join('answers', req.params.volume), source.file, { maxAge: "1h" });
});

router.get("/hsk5/audio/:volume/:file", (req, res) => {
  const file = media[req.params.volume]?.[req.params.file];
  if (!file) return res.status(404).json({ message: "Workbook audio not found." });
  // Express sendFile supports range requests for the audio player's seek control.
  sendMedia(res, path.join('audio', req.params.volume, req.params.file), file, { maxAge: "1d" });
});

router.get("/hsk5/book/:volume", (req, res) => {
  const volume = course.volumes[req.params.volume];
  if (!volume) return res.status(404).json({ message: "Workbook not found." });
  res.type('pdf');
  sendMedia(res, path.join('book', req.params.volume), volume.file, { maxAge: "1h" });
});

module.exports = router;
