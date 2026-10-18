const express = require("express");
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require("cors");
require("dotenv").config();
const cloudinary = require('cloudinary').v2;

// CORS configuration for this specific route
router.use(cors({
  origin: [
    'http://localhost:3000',
    'https://whsk.vercel.app',
    'https://whsk-git-main-batis1s-projects.vercel.app',
    'http://localhost:5000'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  credentials: true
}));

// Add Cloudinary configuration after other configurations
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Replace disk storage with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('pdf');

// Update TEST_CONFIG to reflect the parts structure
const TEST_CONFIG = {
  sectionTimes: {
    listening: 45 * 60,  // 45 minutes in seconds
    reading: 45 * 60,
    writing: null
  },
  questionCounts: {
    listeningPart1: 20,
    listeningPart2: 25,
    reading: 30,
    writing: null
  }
};

// Helper function to parse HSK Level 5 PDF content
async function parsePDFContent(pdfBuffer) {
  try {
    // Validate buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Empty or invalid PDF buffer received');
    }

    console.log('Starting PDF parsing with buffer size:', pdfBuffer.length);
    const data = await pdf(pdfBuffer);
    
    if (!data || !data.text) {
      throw new Error('PDF parsing failed: No text content extracted');
    }
    
    // Log first part of content for debugging
    console.log('First 500 characters:', data.text.substring(0, 500));

    // Check for HSK 5 title markers
    const hasHSKTitle = data.text.includes('新汉语水平考试') || data.text.includes('HSK');
    const hasLevel5 = data.text.includes('HSK (五级)') || data.text.includes('HSK（五级）');
    const hasHanban = data.text.includes('国家汉办') || data.text.includes('Hanban');

    if (!hasHSKTitle || !hasLevel5) {
      throw new Error('Invalid PDF format: Not a HSK Level 5 test paper');
    }

    if (!hasHanban) {
      console.warn('Warning: Could not find Hanban/官方 marker in the document');
    }

    console.log('PDF validation successful - Found HSK Level 5 test paper');
    
    // Return basic metadata for now
    const validationResults = {
      isValid: true,
      title: 'HSK Level 5 Test',
      hasOfficial: hasHanban,
      validationDetails: {
        hasHSKTitle,
        hasLevel5,
        hasHanban
      }
    };

    const contentPreview = data.text.substring(0, 100);

    console.log('Starting to parse questions...');
    
    // Extract listening section questions - Part 1 (1-20)
    const listeningPart1 = Array(20).fill(null).map((_, index) => {
      const questionNumber = index + 1;
      
      console.log(`Processing listening part 1 question ${questionNumber}`);
      
      const options = ['A', 'B', 'C', 'D'].map(optionKey => {
        const text = getOptionText(data.text, questionNumber, optionKey);
        console.log(`Question ${questionNumber}, Option ${optionKey}:`, text);
        return { key: optionKey, text };
      });

      return {
        id: `listening-part1-${questionNumber}`,
        questionNumber: questionNumber,
        text: `第${questionNumber}题`,
        part: 1,
        totalParts: 2,
        options,
        correctAnswer: getCorrectAnswer(data.text, questionNumber, '听力')
      };
    });

    // Extract listening section questions - Part 2 (21-45)
    const listeningPart2 = Array(25).fill(null).map((_, index) => {
      const questionNumber = index + 21;
      
      console.log(`Processing listening part 2 question ${questionNumber}`);
      
      const options = ['A', 'B', 'C', 'D'].map(optionKey => {
        const text = getOptionText(data.text, questionNumber, optionKey);
        console.log(`Question ${questionNumber}, Option ${optionKey}:`, text);
        return { key: optionKey, text };
      });

      return {
        id: `listening-part2-${questionNumber}`,
        questionNumber: questionNumber,
        text: `第${questionNumber}题`,
        part: 2,
        totalParts: 2,
        options,
        correctAnswer: getCorrectAnswer(data.text, questionNumber, '听力')
      };
    });

    // Log verification
    console.log('First question parsed:', listeningPart1[0]);
    console.log('Question 13 parsed:', listeningPart1[12]);
    console.log('Last question parsed:', listeningPart1[19]);

    // Extract reading section questions
    const readingQuestions = [];
    
    // Part 1 (46-60) - Questions are grouped by passages
    const part1Match = data.text.match(/第一部分[\s\S]*?第46-60题[\s\S]*?(?=第二部分|$)/);
    if (part1Match) {
      const part1Text = part1Match[0];
      
      // Define the question groups
      const questionGroups = [
        { start: 46, end: 48 },
        { start: 49, end: 52 },
        { start: 53, end: 56 },
        { start: 57, end: 60 }
      ];

      // Process each group
      questionGroups.forEach(group => {
        // Match the passage and questions for this group
        const groupPattern = new RegExp(`${group.start}-${group.end}[．.](\\s*[\\s\\S]*?)(?=${group.end + 1}-|第二部分|$)`);
        const groupMatch = part1Text.match(groupPattern);
        
        if (groupMatch) {
          const groupText = groupMatch[1];
          // Extract the passage (text before the first question number)
          const passageMatch = groupText.match(/([\s\S]*?)(?=\d{2}[．.])/);
          const passageText = passageMatch ? passageMatch[1].trim() : '';

          // Process each question in the group
          for (let qNum = group.start; qNum <= group.end; qNum++) {
            const questionPattern = new RegExp(`${qNum}[．.]\\s*([A-D]\\s*[^\\n]+\\s*){4}`);
            const questionMatch = groupText.match(questionPattern);
            
            if (questionMatch) {
              const optionMatches = questionMatch[0].matchAll(/([A-D])\s*([^\nA-D]+)/g);
              const options = Array.from(optionMatches).map(([_, key, text]) => ({
                key,
                text: text.trim()
              }));

              readingQuestions.push({
                id: `reading-${qNum}`,
                questionNumber: qNum,
                groupStart: group.start,
                groupEnd: group.end,
                passageText: passageText,
                text: `第${qNum}题`,
                options,
                part: 1,
                totalParts: 3
              });
            }
          }
        }
      });
    }

    // Part 2 (61-70) - Each question has its own passage
    const part2Match = data.text.match(/第二部分[\s\S]*?第61-70题[\s\S]*?(?=第三部分|$)/);
    if (part2Match) {
      const part2Text = part2Match[0];
      
      // Match each question block (includes passage and options)
      const questionBlocks = part2Text.matchAll(/(\d{2})[．.]\s*([\s\S]*?)(?=\d{2}[．.]|第三部分|$)/g);
      
      for (const [_, numStr, block] of questionBlocks) {
        const questionNumber = parseInt(numStr);
        
        // Split passage from options
        const passageEndIndex = block.search(/[A-D]\s/);
        const passageText = block.slice(0, passageEndIndex).trim();
        const optionsText = block.slice(passageEndIndex);
        
        // Extract options
        const optionMatches = optionsText.matchAll(/([A-D])\s*([^\nA-D]+)/g);
        const options = Array.from(optionMatches).map(([_, key, text]) => ({
          key,
          text: text.trim()
        }));

        readingQuestions.push({
          id: `reading-${questionNumber}`,
          questionNumber,
          passageText,
          text: `第${questionNumber}题`,
          options,
          part: 2,
          totalParts: 3
        });
      }
    }

    return {
      metadata: {
        isValid: true,
        title: 'HSK Level 5 Test',
        hasOfficialHeader: hasHanban,
        validationDetails: validationResults,
        contentPreview: contentPreview + '...',
        sectionTimes: TEST_CONFIG.sectionTimes,
        questionCounts: TEST_CONFIG.questionCounts
      },
      listening: {
        part1: listeningPart1,
        part2: listeningPart2
      },
      reading: readingQuestions.sort((a, b) => a.questionNumber - b.questionNumber)
    };

  } catch (error) {
    console.error('Error in parsePDFContent:', error);
    throw error;
  }
}

// Helper function to extract option text for a given question and option
function getOptionText(pdfText, questionNumber, option) {
  try {
    // Split text into pages and clean each page
    const pages = pdfText.split(/H51003 -/).map(page => 
      page.replace(/第[一二三四五]部分/g, '').trim()
    );

    // For question 13 and beyond, focus on later pages
    const relevantPages = questionNumber >= 13 ? pages.slice(2) : pages;
    const cleanText = relevantPages.join(' ');

    // Add word boundaries and be more specific with number matching
    const questionPattern = questionNumber < 10 
      ? `\\b${questionNumber}\\b[.\\s]` 
      : `\\b${questionNumber}\\b[.]`;

    // Create patterns with exact number matching
    const patterns = [
      // Primary pattern with word boundaries
      new RegExp(`${questionPattern}\\s*${option}\\s*([^\\nABCD]+)`),
      // Pattern for options that might be on a new line
      new RegExp(`${questionPattern}[\\s\\S]*?${option}\\s*([^\\nABCD]+)`),
      // Backup pattern for different formatting
      new RegExp(`${option}\\s*([^\\nABCD]+)`)
    ];

    // First try to find the question block
    const blockPattern = new RegExp(
      `${questionPattern}([\\s\\S]*?)(?=\\b(?:${questionNumber + 1}|${questionNumber + 2})\\b\\.|$)`,
      'g'
    );
    const questionBlock = blockPattern.exec(cleanText);

    if (questionBlock) {
      // Try to find the option within the question block
      for (const pattern of patterns) {
        const match = pattern.exec(questionBlock[1]);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }

    // If still not found, try the patterns on the full text
    for (const pattern of patterns) {
      const match = pattern.exec(cleanText);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // For debugging
    console.log(`Failed to find option ${option} for question ${questionNumber}`);
    console.log('Question pattern:', questionPattern);
    console.log('Relevant pages:', relevantPages.length);
    
    return `Option ${option}`; // Fallback
  } catch (error) {
    console.error(`Error parsing option ${option} for question ${questionNumber}:`, error);
    return `Option ${option}`;
  }
}

// Helper function to get correct answer from the answer key section
function getCorrectAnswer(pdfText, questionNumber, section) {
  try {
    // Look for the answer key section (卷答案)
    const answerSection = pdfText.match(/卷答案[\s\S]*?$/);
    if (answerSection) {
      // Look for the specific answer pattern, handle both single and double-digit numbers
      const answerPattern = new RegExp(`${questionNumber}\\s*\\.\\s*([A-D])`, 'g');
      const match = answerPattern.exec(answerSection[0]);
      if (match) {
        return match[1];
      }
    }
    
    // For debugging
    console.log(`Failed to find answer for question ${questionNumber}`);
    return 'A'; // Default fallback
  } catch (error) {
    console.error(`Error finding answer for question ${questionNumber}:`, error);
    return 'A';
  }
}

// Update the upload route
router.get('/test', (req, res) => {
  res.json({ message: 'HSK Generator router is working' });
});
router.post('/upload', (req, res) => {
  upload(req, res, async function (err) {
    try {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          details: err.message
        });
      } else if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          error: 'Invalid file',
          details: err.message
        });
      }

      // Check if file exists
      if (!req.file) {
        console.error('No file provided');
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          details: 'Please select a PDF file to upload'
        });
      }

      try {
        // Log file details for debugging
        console.log('File details:', {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        });

        // Parse PDF content
        const testData = await parsePDFContent(req.file.buffer);

        return res.json({
          success: true,
          message: 'HSK Level 5 test generated successfully',
          data: testData
        });

      } catch (processingError) {
        console.error('PDF Processing Error:', processingError);
        return res.status(400).json({
          success: false,
          error: 'Error processing PDF file',
          details: processingError.message
        });
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({
        success: false,
        error: 'Unexpected server error',
        details: error.message
      });
    }
  });
});


module.exports = router; 