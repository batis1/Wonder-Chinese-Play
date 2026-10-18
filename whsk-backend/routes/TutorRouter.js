const express = require("express");
const { Tutor } = require("../models/TutorModel");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const newDoc = new Tutor(req.body);

    const doc = await newDoc.save();

    res.send({ message: "Tutor Added", doc });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "fail" });
  }
});

router.put("/:tutorId", async (req, res) => {
  try {
    console.log(req.params.tutorId);

    let doc = await Tutor.findById(req.params.tutorId);

    if (!doc) return res.status(404).send("tutor with that id doesn't exist");

    const updateFields = [
      "hskLevel",
      "educationalBackground",
      "teachingPeriod",
      "teachingTime",
      "zoomRoomID",
      "status",
    ];

    for (let index = 0; index < updateFields.length; index++) {
      const field = updateFields[index];
      doc[field] = req.body[field] ? req.body[field] : doc[field];
    }

    const docUpdate = await doc.save();

    res.send({ message: "working", doc: docUpdate });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "fail" });
  }
});

router.delete("/:tutorId", async (req, res) => {
  try {
    const { tutorId } = req.params;

    console.log(tutorId);

    await Tutor.deleteOne({ _id: tutorId });

    res.send({ message: "delete successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "fail" });
  }
});

router.get("/:tutorId", async (req, res) => {
  try {
    const doc = await Tutor.findById(req.params.tutorId).populate("userId");

    res.send({ doc });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "fail" });
  }
});
router.get("/", async (req, res) => {
  try {
    const { status, userId } = req.query;

    const queryObject = {};

    if (status) queryObject.status = status;
    if (userId) queryObject.userId = userId;

    const docs = await Tutor.find(queryObject).populate("userId");

    res.send({ resultLength: docs.length, docs });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "fail" });
  }
});

module.exports = router;
