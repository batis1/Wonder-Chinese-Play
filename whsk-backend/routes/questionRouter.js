const mongoose = require("mongoose");
const express = require("express");
const { Question } = require("../models/Question");
const { HSK_LEVEL } = require("../config/course");
const router = express.Router();

const QUESTIONS_RETURNED = 100;

router.post("/", async (req, res) => {
  console.log(req.body);
  const newQuestion = new Question(req.body);
  try {
    const doc = await newQuestion.save();

    res.json({
      status: "success",
      message: "question added successfully",
      doc,
    });
  } catch (error) {
    res.status(500).json({
      status: "fall",
      message: "something went wrong while saving the question",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Question.deleteOne({ _id: req.params.id });

    res.json({
      status: "success",
      message: "question deleted successfully",
      // doc,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "fall",
      message: "something went wrong while saving the question",
    });
  }
});
// router.get("/:id", async (req, res) => {
//   try {
//     const doc = await Question.findOne({ _id: req.params.id });

//     res.json({
//       status: "success",
//       message: "question founded",
//       doc,
//     });
    
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: "fall",
//       message: "something went wrong to get the question",
//     });
//   }
// });
router.get("/", async (req, res) => {
  const { category, level, hskLevel } = req.query;
  const queryObject = { hskLevel: HSK_LEVEL };

  if (category) {
    queryObject.category = category;
  }
  if (level) {
    queryObject.level = level;
  }
  if (hskLevel) { // Add this condition
    queryObject.hskLevel = HSK_LEVEL;
  }

  try {
    const docs = await Question.find(queryObject).lean();
    res.send(docs);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "fail",
      message: "Failed to retrieve questions",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const doc = await Question.findOne({ _id: req.params.id });

    // res.json({
    //   status: "success",
    //   message: "question founded",,
    // });
    // doc.category = req.body.category;
    // doc.type = req.body.type;
    // doc.difficulty = req.body.difficulty;
    // doc.question = req.body.question;
    // doc.correct_answer = req.body.correct_answer;
    // doc.incorrect_answers = req.body.incorrect_answers;

    const paramsUpdated = [
      "category",
      "type",
      "difficulty",
      "question",
      "correct_answer",
      "incorrect_answers",
      "audioUrl",
      "level",
      "hskLevel",
      "audioDescription",
      "popupDescription",
    ];
    for (let index = 0; index < paramsUpdated.length; index++) {
      const element = paramsUpdated[index];
      doc[element] = req.body[element] || doc[element];
    }

    await doc.save();
    res.json({
      status: "success",
      message: "question updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "fall",
      message: "something went wrong to get the question",
    });
  }
});

router.get("/", async (req, res) => {
  // Question.find({}, (err, docs) => {
  //   const questionList = [];
  //   const indexList = [];
  //   while (indexList.length < QUESTIONS_RETURNED) {
  //     let randomNumber = Math.floor(Math.random() * docs.length);
  //     console.log({ randomNumber, c: !indexList.includes(randomNumber) });
  //     // if (!indexList.includes(randomNumber)) {
  //     questionList.push(docs[randomNumber]);
  //     indexList.push(randomNumber);
  //     // }
  //   }
  //   res.send(questionList);
  // });
  const { category, level } = req.query;
  const queryObject = {};

  if (category) {
    queryObject.category = category;
  }

  if (level) {
    queryObject.level = level;
  }
  const docs = await Question.find(queryObject);

  res.send(docs);
});

module.exports = router;
