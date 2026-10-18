const express = require("express");
const router = express.Router();
const { HskWord } = require("../models/HskWord");

// Get words by HSK version and level
router.get("/", async (req, res) => {
  try {
    const { version, level, combined, compact } = req.query;
    let queryObject = {};

    if (combined === 'true' && level) {
      // If combined is true, get words from both versions for the specified level
      queryObject.level = Number(level);
    } else {
      // Original behavior - get words from specific version and level
      if (version) queryObject.version = version;
      if (level) queryObject.level = Number(level);
    }

    let query = HskWord.find(queryObject);
    if (compact === 'true') query = query.select('hanzi pinyin english part_of_speech level version -_id');
    const words = await query.lean();
    
    // If combined, organize words by version
    if (combined === 'true') {
      const organizedWords = {
        "2.0": words.filter(word => word.version === "2.0"),
        "3.0": words.filter(word => word.version === "3.0")
      };
      
      res.json({
        status: "success",
        data: organizedWords
      });
    } else {
      res.json({
        status: "success",
        data: words
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "fail",
      message: "Failed to retrieve HSK words"
    });
  }
});

// Add new word
router.post("/", async (req, res) => {
  try {
    const newWord = new HskWord(req.body);
    const savedWord = await newWord.save();
    res.json({
      status: "success",
      data: savedWord
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "fail",
      message: "Failed to add HSK word"
    });
  }
});

// Bulk import words
router.post("/bulk", async (req, res) => {
  try {
    const { words, level, version } = req.body;
    const formattedWords = words.map(word => ({
      ...word,
      level,
      version
    }));

    await HskWord.insertMany(formattedWords);
    res.json({
      status: "success",
      message: `Successfully imported ${words.length} words for HSK ${version} level ${level}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "fail",
      message: "Failed to bulk import HSK words"
    });
  }
});

module.exports = router;
