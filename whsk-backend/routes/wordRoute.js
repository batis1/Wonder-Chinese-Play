const mongoose = require("mongoose");
const express = require("express");
const { Word } = require("../models/WordModel");
const { User } = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
  const { lessonId, userId, query } = req.query;
  const objectQuery = {};

  if (userId) {
    const user = await User.findById(userId);
    const ids = user?.savedWords || [];
    const docs = ids.length ? await Word.find({ _id: { $in: ids } }).lean() : [];
    const byId = new Map(docs.map(word => [String(word._id), word]));
    const words = ids.map(id => byId.get(String(id))).filter(Boolean);
    res.send({ docs: words });

    return;
  }

  if (lessonId) {
    objectQuery.lessonId = lessonId;
  }

  if (query) {
    objectQuery.character = query;
  }

  const docs = await Word.find(objectQuery).lean();

  res.send({ resultLength: docs.length, message: "working", docs });
});

router.post("/", async (req, res) => {
  const newWord = new Word(req.body);

  const doc = await newWord.save();

  res.send({ message: "working", doc });
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const updatedParams = [
    "character",
    "pinyin",
    "englishTranslation",
    "sentence",
  ];

  const word = await Word.findById(id);

  for (let index = 0; index < updatedParams.length; index++) {
    const param = updatedParams[index];

    word[param] = req.body[param] ? req.body[param] : word[param];
  }

  const doc = await word.save();

  res.send({ message: "working", doc });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const doc = await Word.findById(id).lean();

  res.send({ message: "working", doc });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  await Word.deleteOne({ _id: id });

  res.send({ message: "delete successfully" });
});

module.exports = router;
