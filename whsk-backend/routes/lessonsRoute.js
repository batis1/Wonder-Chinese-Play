const mongoose = require("mongoose");
const express = require("express");
const { Lesson } = require("../models/LessonModel");
const { Word } = require("../models/WordModel");
const { HSK_LEVEL } = require("../config/course");
const router = express.Router();

// router.get("/", async (req, res) => {
//   try {
//     const { withWords } = req.query;
//     const objectQuery = {};

//     const docs = await Lesson.find(objectQuery);

//     if (docs.length === 0) {
//       return res.status(404).send({
//         status: "fall",
//         message: "lesson id not exists",
//       });
//     }

//     let updateDocs = docs;
//     if (withWords) {
//       for (let index = 0; index < docs.length; index++) {
//         const lesson = docs[index];

//         const wordDocs = await Word.find({ lessonId: lesson._id });

//         docs[index] = { ...lesson._doc, words: wordDocs };
//       }
//     }

//     // console.log({ docs });

//     res.send({ resultLength: docs.length, message: "working", docs });
//   } catch (error) {
//     res
//       .status(500)
//       .send({ status: "fall", message: "something went wrong in the server" });
//   }
// });
router.get("/", async (req, res) => {
  try {
    const { withWords, hskLevel } = req.query;
    const objectQuery = { hskLevel: HSK_LEVEL };

    const docs = await Lesson.find(objectQuery).lean();
    if (withWords && docs.length) {
      const words = await Word.find({ lessonId: { $in: docs.map(lesson => lesson._id) } }).lean();
      const grouped = new Map();
      words.forEach(word => {
        const key = String(word.lessonId);
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(word);
      });
      docs.forEach(lesson => { lesson.words = grouped.get(String(lesson._id)) || []; });
    }

    res.send({ resultLength: docs.length, message: "working", docs });
  } catch (error) {
    res
      .status(500)
      .send({ status: "fall", message: "something went wrong in the server" });
  }
});
router.post("/", async (req, res) => {
  const newLesson = new Lesson(req.body);

  const doc = await newLesson.save();

  res.send({ message: "working", doc });
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedParams = ["title", "iconName", "grammarsUrl"];

    const word = await Lesson.findById(id);

    for (let index = 0; index < updatedParams.length; index++) {
      const param = updatedParams[index];

      word[param] = req.body[param] ? req.body[param] : word[param];
    }

    const doc = await word.save();

    res.send({ message: "working", doc });
  } catch (error) {
    console.log("here");
    if (error.message.includes("ObjectId"))
      return res.status(404).send({
        status: "fall",
        message: "lesson id not exists",
      });

    res
      .status(500)
      .send({ status: "fall", message: "something went wrong in the server" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const word = await Lesson.findById(id);

    const doc = await word.save();

    res.send({ message: "working", doc });
  } catch (error) {
    console.log("here");
    if (error.message.includes("ObjectId"))
      return res.status(404).send({
        status: "fall",
        message: "lesson id not exists",
      });

    res
      .status(500)
      .send({ status: "fall", message: "something went wrong in the server" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Lesson.deleteOne({ _id: id });
    await Word.deleteMany({ lessonId: id });

    res.send({ message: "delete successfully" });
  } catch (error) {
    console.log("here");
    if (error.message.includes("ObjectId"))
      return res.status(404).send({
        status: "fall",
        message: "lesson id not exists",
      });

    res
      .status(500)
      .send({ status: "fall", message: "something went wrong in the server" });
  }
});
module.exports = router;
