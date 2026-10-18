require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const compression = require("compression");
const { createJsonCache } = require("../lib/jsonCache");
const { connectDatabase } = require("../lib/connectDatabase");
const fs = require("fs");
// const { connect } = require("./db/connection");
const questionRouter = require("../routes/questionRouter");
const scoreRouter = require("../routes/scoreRouter");
const userRouter = require("../routes/user");
const wordRouter = require("../routes/wordRoute");
const lessonRouter = require("../routes/lessonsRoute");
const tutorRouter = require("../routes/TutorRouter");
const hskWordRouter = require("../routes/hskWordRouter");
const workbookRouter = require("../routes/workbook");
// const hskGeneratorRouter = require("../routes/hskGeneratorRouter");

const path = require("path");
const morgan = require("morgan");
const fileUpload = require("express-fileupload");
require("dotenv").config();

// connect();

const database = connectDatabase(mongoose, process.env.MONGODB_URL);

// initializing directories
// if (!fs.existsSync("./public")) {
//   fs.mkdirSync("./public");
// }

// if (!fs.existsSync("./public/profile")) {
//   fs.mkdirSync("./public/profile");
// }

// if (!fs.existsSync("./public/others")) {
//   fs.mkdirSync("./public/others");
// }

// if (!fs.existsSync("./public/ocr")) {
//   fs.mkdirSync("./public/ocr");
// }

// Configure CORS
// app.use(cors({
//   origin: [
//     'http://localhost:3000',
//     // 'https://whsk.vercel.app',
//     'https://whsk-git-main-batis1s-projects.vercel.app',
//     // 'http://localhost:5000'
//   ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
//   credentials: true
// }));
app.use(cors());
app.use(compression({ level: 4, filter: (req, res) => !req.headers.range && compression.filter(req, res) }));
app.use(express.json());

app.use(['/user', '/score', '/questions', '/words', '/lessons', '/tutors', '/hsk-words', '/auth'], async (req, res, next) => {
  await database.ready();
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'The database is temporarily unavailable. Please try again.' });
  next();
});

app.use(morgan("dev"));
// if (
//   process.env.NODE_ENV === "production" ||
//   process.env.NODE_ENV === "staging"
// ) {
//   app.use(express.static("frontend/build"));
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname + "/frontend/build/index.html"));
//   });
// }

app.get("/", (req, res) => {
  res.send("working");
});

app.get("/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.set("Cache-Control", "no-store").status(ready ? 200 : 503).json({ ready });
});

app.use("/workbook/hsk5", express.static(path.join(__dirname, "../public/workbook/hsk5"), { maxAge: "1d", redirect: false }));
app.use(express.static(path.join(__dirname, "../public"), { redirect: false }));
// app.use(fileUpload());
// // Upload Endpoint
// app.post("/upload", (req, res) => {
//   console.log(req.files);
//   console.log(req.body);
//   if (req.files === null) {
//     return res.status(400).json({ msg: "No file uploaded" });
//   }

//   const file = req.files.file;

//   file.mv(`${__dirname}/public/profile${file.name}`, (err) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send(err);
//     }

//     res.json({ fileName: file.name, filePath: `/uploads/${file.name}` });
//   });
// });

// axios.post("/score/signup"   )
app.use('/auth', (req, res, next) => require('../routes/auth')(req, res, next));
app.use("/user", userRouter);
app.use("/score", scoreRouter);
const questionCache = createJsonCache({ ttl: 30000 });
const dictionaryCache = createJsonCache({ ttl: 300000 });
app.use("/questions", questionCache.invalidateOnWrite, questionCache.middleware, questionRouter);
app.use("/words", wordRouter);
app.use("/lessons", lessonRouter);
app.use("/tutors", tutorRouter);
app.use("/ocr", (req, res, next) => require('../routes/ocrRoute')(req, res, next));
app.use("/hsk-words", dictionaryCache.invalidateOnWrite, dictionaryCache.middleware, hskWordRouter);
app.use("/workbook", workbookRouter);
// app.use("/hskgenerator", hskGeneratorRouter);

app.get('/api/test', (req, res) => {
  try {
    res.json({ 
      message: 'Test route working',
      env: process.env.NODE_ENV,
      mongoUrl: process.env.MONGODB_URL ? 'MongoDB URL is set' : 'MongoDB URL is missing'
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
// const PORT = 5000;

if (require.main === module) app.listen(PORT, (err) => {
  if (err) {
    console.log("error", err);
  } else {
    console.log("Online");
    // console.log(PORT);
  }
});

// "backend": "cross-env NODE_ENV=dev nodemon index.js",
// "frontend": "cd frontend && npm start",
// "dev": "concurrently \"npm run backend\" \"npm run frontend\""
// const capturedImage = async (req, res, next) => {
//     try {
//         const path = './storage/ocr_image.jpeg'     // destination image path
//         let imgdata = req.body.img;                 // get img as base64
//         const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');     // convert base64
//         fs.writeFileSync(path, base64Data,  {encoding: 'base64'});                  // write img file

//         Tesseract.recognize(
//             'http://localhost:5000/img/ocr_image.jpeg',
//             'eng',
//             { logger: m => console.log(m) }
//         )
//         .then(({ data: { text } }) => {
//             console.log(text)
//             return res.send({
//                 image: imgdata,
//                 path: path,
//                 text: text
//             });
//         })

//     } catch (e) {
//         next(e);
//     }
// }
// app.post('/capture', capturedImage)

module.exports = app;
