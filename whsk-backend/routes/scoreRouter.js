const mongoose = require("mongoose");
const express = require("express");
const { request } = require("express");
const { Score } = require("../models/Score");
const { HSK_LEVEL } = require("../config/course");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const scores = await Score.aggregate([
      { $match: { score: { $gt: 0 }, $or: [{ hskLevel: HSK_LEVEL }, { hskLevel: { $exists: false } }] } },
      {
        $lookup: {
          from: "users",
          localField: "userID",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      { $match: { $or: [{ hskLevel: HSK_LEVEL }, { hskLevel: { $exists: false }, "user.hskLevel": HSK_LEVEL }] } },
      { $sort: { score: -1, date: -1, _id: 1 } },
      { $group: { _id: "$userID", best: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$best" } },
      { $sort: { score: -1, userID: 1 } },
      { $limit: 5 },
      {
        $project: {
          username: "$user.username",
          score: 1,
          date: 1,
          userID: 1,
          level: { $ifNull: ["$hskLevel", "$user.hskLevel"] },
          hskLevel: { $ifNull: ["$hskLevel", "$user.hskLevel"] },
          avatar: "$user.avatar"
        }
      }
    ]);

    const mappedScores = scores.map((score, index) => ({
      ...score,
      index: index + 1,
      level: score.level || score.hskLevel || 'N/A',
      username: score.username || 'Unknown User'
    }));

    res.send(mappedScores);
  } catch (err) {
    console.log("There was an error", err);
    res.status(500).send(err);
  }
});

router.get("/:userID", async (req, res) => {
  try {
    const user = await mongoose.model('Users').findById(req.params.userID);
    // Retain the existing profile-level classification for legacy HSK 5 scores.
    const levelFilter = user?.hskLevel === HSK_LEVEL
      ? { $or: [{ hskLevel: HSK_LEVEL }, { hskLevel: { $exists: false } }] }
      : { hskLevel: HSK_LEVEL };
    const query = Score.find({ userID: req.params.userID, ...levelFilter })
      .sort({ score: -1 })
      .limit(10);

    if (!req.query.isAdmin) {
      query.limit(10);
    }

    const scores = await query.exec();

    const mappedScores = scores.map((score, index) => ({
      ...score.toObject(),
      index: index + 1,
      level: HSK_LEVEL,
      username: user?.username || 'Unknown User'
    }));

    res.send(mappedScores);
  } catch (err) {
    console.log("There was an error", err);
    res.status(500).send(err);
  }
});

router.post("/", (req, res) => {
  const newScore = { ...req.body, hskLevel: HSK_LEVEL };
  console.log(newScore);
  Score.create(newScore)
    .then((obj) => {
      console.log("New score is created", obj);
      res.status(200).send({ message: "You're score is saved" });
    })
    .catch((err) => {
      console.log("There was an error", err);
      res.status(500).send(err);
    });
});

module.exports = router;
