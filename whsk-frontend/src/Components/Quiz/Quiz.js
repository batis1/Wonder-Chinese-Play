import React, { lazy, Suspense, useState, useEffect, useRef, useContext, useMemo } from "react";
import { useHistory } from "react-router-dom";
import explode from "./explode";
import Timer from "./../Timer/Timer";
import EndScreen from "../EndScreen/EndScreen";
import Loading from "../Loading/Loading";
import "./Quiz.css";
import Aellipse from "../../Images/Aellipse.svg";
import Bellipse from "../../Images/Bellipse.svg";
import Cellipse from "../../Images/Cellipse.svg";
import Dellipse from "../../Images/Dellipse.svg";
import shuffleOptions from "../../lib/shuffleOptions";
import Replacer from "../../lib/Replacer";
// import { randomSparks } from "./spark";
import { correctAnimation, wrongAnimation } from "./answerAnimation";
import { SkillHeaderContainer } from "../SkillHeaderContainer/SkillHeaderContainer";
import { Typography, Popover } from "antd";
// import QuoteApp from "../DraggableList/MainDraggable";
import {  GlobalContext, actions } from "../../App";
import apiList from "../../lib/apiList";
import { ACTIVE_HSK_LEVEL } from "../../lib/course";
import { cachedGet } from '../../lib/cachedGet';
const DeferredAudioPlayer = lazy(() => import('./AudioPlayer'));
const DeferredQuoteApp = lazy(() => import('../DraggableList/MainDraggable'));
const AudioPlayer = props => <Suspense fallback={<Loading />}><DeferredAudioPlayer {...props} /></Suspense>;
const QuoteApp = props => <Suspense fallback={<Loading />}><DeferredQuoteApp {...props} /></Suspense>;
// import { Popover, Button } from "antd";
const { Text } = Typography;


const time = {
  Easy: 10000,
  easy: 10000,
  Medium: 15000,
  Hard: 20000,
};

const points = {
  Easy: 2,
  Medium: 5,
  Hard: 10,
};

const optionImg = [Aellipse, Bellipse, Cellipse, Dellipse];
const HSK_COLORS = { 1: '#FF8A8A', 2: '#4CAF50', 3: '#3F51B5', 4: '#FF9800', 5: '#9C27B0', 6: '#00BCD4' };

const Quiz = ({ user, reset }) => {
  const { state, dispatch } = useContext(GlobalContext);
  const history = useHistory();
  const location = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  const [currQuestion, setCurrQuestion] = useState(0);
  const [optionChosen, setOptionChosen] = useState();
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState();
  const [options, setOptions] = useState();
  // gameState options [loading, finished,  active, paused]
  const [gameState, setGameState] = useState("loading");
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState();
  const [timer, setTimer] = useState(1000 * 180);
  const [timerState, setTimerState] = useState("idle");
  const [showBomb, setShowBomb] = useState(true);
  const [optionStyles, setOptionStyles] = useState([]);
  const [answerProcessed, setAnswerProcessed] = useState(true);
  const [scoreUploaded, setScoreUploaded] = useState(false);
  const [mouseClick, setMouseClick] = useState();
  const [isOptionsProcessed, setIsOptionsProcessed] = useState(false);
  const [hskWordsData, setHskWordsData] = useState({ "2.0": [] });
  const [selectedText, setSelectedText] = useState("");
  const [hskMatch, setHskMatch] = useState(null);

  const [isGame, setIsGame] = useState(() => {
    const isTutorialPath = location.includes('/tutorial') || location.includes('/lesson');
    const hasCategory = searchParams.get('category');
    const hasLevel = searchParams.get('level');
    return !(isTutorialPath || hasCategory || hasLevel);
  });
  const [category] = useState(() => searchParams.get('category') || state?.category || 'Reading');
  const [level] = useState(() => searchParams.get('level') || state?.level || 'Easy');

  const bombRef = useRef();
  const timerRef = useRef();

  // Add click counter state
  const [clickCount, setClickCount] = useState(0);
  const clickTimeout = useRef(null);

  // Add these new state variables
  const [showTranslation, setShowTranslation] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // Add function to handle triple click
  const handleQuestionClick = () => {
    if (clickCount === 3) {
      // If popover is showing, hide it with a single click
      setClickCount(0);
    } else {
      // Count clicks for showing the popover
      setClickCount(prev => prev + 1);
      
      // Reset click count after 500ms if we haven't reached 3 clicks
      clearTimeout(clickTimeout.current);
      clickTimeout.current = setTimeout(() => {
        setClickCount(0);
      }, 500);
    }
  };

  useEffect(() => {
    const newSearchParams = new URLSearchParams(window.location.search);
    const isTutorialPath = location.includes('/tutorial') || location.includes('/lesson');
    const hasCategory = newSearchParams.get('category');
    const hasLevel = newSearchParams.get('level');
    const shouldBeGameMode = !(isTutorialPath || hasCategory || hasLevel);
    
    if (shouldBeGameMode !== isGame) {
      setIsGame(shouldBeGameMode);
      setGameState("loading");
      setTimer(1000 * 5);
      setTimerState("idle");
      setShowBomb(true);
      setScore(0);
      setCurrQuestion(0);
      setAnswerProcessed(true);
      setIsOptionsProcessed(false);
      setScoreUploaded(false);
      setOptions(null);
      setOptionStyles([]);
      setOptionChosen(null);
      
      clearTimeout(timerRef.current);
    }
  }, [location, window.location.search]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        let currentUser = user;
        if (!currentUser) {
          const sessionUser = JSON.parse(window.sessionStorage.getItem("currentUser"));
          if (!sessionUser) {
            history.push('/login');
            return;
          }
          currentUser = sessionUser;
          dispatch({
            type: actions.SET_USER,
            payload: { user: sessionUser._doc },
          });
        }

        const userHskLevel = ACTIVE_HSK_LEVEL;
        if (!userHskLevel) {
          console.warn("No HSK level available");
          history.push('/login');
          return;
        }

        const fetchUrl = isGame 
          ? `${apiList.questions}?hskLevel=${userHskLevel}`
          : `${apiList.questions}?category=${category}&hskLevel=${userHskLevel}&level=${level}`;
        
        const data = await cachedGet(fetchUrl, 30000);

        if (!data || (!data.questions && !Array.isArray(data))) {
          setGameState("error");
          return;
        }

        let questions = Array.isArray(data) ? data : data.questions;
        
        if (!questions || questions.length === 0) {
          setQuestions([]);
          setGameState("error");
          return;
        }

        if (isGame) {
          questions = questions.filter(q => q.type !== "writing");
        } else {
          questions = questions.filter(q => q.category === category);
        }

        const finalQuestions = isGame 
          ? [...questions].sort(() => Math.random() - 0.5)
          : questions;

        setQuestions(finalQuestions);
        setGameState("active");
        if (isGame) {
          setTimerState("active");
        }
        setCurrQuestion(0);
        setAnswerProcessed(true);

      } catch (error) {
        console.error("Error fetching questions:", error);
        setGameState("error");
      }
    };

    fetchQuestions();
  }, [isGame, user, category, level, history, dispatch]);

  useEffect(() => {
    // console.log("Game state updated:", {
    //   gameState,
    //   questionsLoaded: questions?.length || 0,
    //   currentQuestion: currQuestion,
    //   timerState
    // });
  }, [gameState, questions, currQuestion, timerState]);

  useEffect(() => {
    if (isGame) {
      try {
        const bombPosition =
          bombRef.current.children[1].getBoundingClientRect();
        const y =
          bombPosition.y +
          bombPosition.height / 2 -
          window.innerHeight / 2 +
          window.scrollY -
          70;
        // randomSparks.tune({ x: 85, y: y });
        // console.log(y);
        if (timerState === "active") {
          // console.log("spark");

          // randomSparks.play();
        } else {
          // randomSparks.stop();
        }
      } catch {
        // console.log("caught");
      } finally {
        return () => {
          // randomSparks.stop();
        };
      }
    }
  }, [timerState, currQuestion]);

  // after the game is over save user score
  useEffect(() => {
    if (gameState === "finished" && !scoreUploaded) {
      const payload = {
        username: user.username,
        userID: user.id,
        score,
        hskLevel: ACTIVE_HSK_LEVEL,
        date: Date.now(),
      };
      // console.log({ payload });
      fetch(apiList.score, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((res) => {
        if (res.status === 200) {
          // console.log("score saved");
          setScoreUploaded(true);
        } else {
          // console.log("unable to save score");
        }
      });
    }
  }, [gameState, scoreUploaded]);

  // show questions one by one
  useEffect(() => {
    // console.log("in create question useEffect", { gameState, answerProcessed });
    
    if (gameState !== "loading") {
      if (answerProcessed && !isOptionsProcessed) {
        setIsOptionsProcessed(true);
        setAnswerProcessed(false);
        
        const currentQuestion = questions[currQuestion];
        
        if (!currentQuestion) {
          console.error("❌ No current question found!");
          return;
        }

        // Add validation for required question properties
        if (!currentQuestion.correct_answer || !currentQuestion.incorrect_answers) {
          console.error("Question missing required properties:", currentQuestion);
          return;
        }

        // Validate incorrect_answers is an array with content
        if (!Array.isArray(currentQuestion.incorrect_answers) || 
            currentQuestion.incorrect_answers.length === 0) {
          console.error("Invalid incorrect_answers:", currentQuestion.incorrect_answers);
          return;
        }

        // Only treat as True/False if it's explicitly that type AND not a Listening question
        const isTrueFalseQuestion = 
          currentQuestion.type === "True and False" && 
          currentQuestion.category !== "Listening";

        if (isTrueFalseQuestion) {
          const truefalseOptions = ["True", "False"];
          const correctIndex = currentQuestion.correct_answer.toLowerCase() === "true" ? 0 : 1;
          
          setOptions(truefalseOptions);
          setCorrectAnswerIndex(correctIndex);
        } else {
          // For all other questions (including Listening True/False), use normal option processing
          const [answers, correctIndex] = shuffleOptions(
            currentQuestion.correct_answer,
            currentQuestion.incorrect_answers
          );

          // Validate shuffled results
          if (!Array.isArray(answers) || answers.length < 2) {
            console.error("Shuffling produced invalid results:", { answers, correctIndex });
            return;
          }

          setOptions(answers);
          setCorrectAnswerIndex(correctIndex);
        }
      }
    }
  }, [gameState, currQuestion, answerProcessed, questions, isOptionsProcessed]);

  // Debug useEffect for options
  useEffect(() => {
    // console.log("🎯 Options state changed:", {
    //   options,
    //   correctAnswerIndex,
    //   gameState,
    //   isOptionsProcessed
    // });
  }, [options, correctAnswerIndex, gameState, isOptionsProcessed]);

  // after select an answer show only the correct answer
  useEffect(() => {
    // console.log("options style useEffect", options);
    if (options) {
      // Validate options before setting styles
      if (!Array.isArray(options) || options.length < 2) {
        console.error("Invalid options array:", options);
        return;
      }
      setOptionStyles(options.map(() => ({ opacity: "100%" })));
    }
  }, [options]);

  // for change the timer
  useEffect(() => {
    if (isGame) {
      // console.log("in timer useEffect");
      try {
        if (timerState === "active") {
          // when the timer is over
          if (timer === 0) {
            setTimerState("idle");
            const bombPosition =
              bombRef.current.children[1].getBoundingClientRect();
            const y =
              10 +
              bombPosition.y +
              bombPosition.height / 2 -
              window.innerHeight / 2 +
              window.scrollY;
            // const x = bombPosition.x + bombPosition.width / 2;
            explode(0, y);
            setTimeout(() => {
              setShowBomb(false);
              setGameState("finished");
            }, 1000);
          }
          // for change the timer
          else {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              setTimer((prevState) => Math.max(0, prevState - 1000));
            }, 1000);
          }
        } else if (timerState === "paused") {
          clearTimeout(timerRef.current);
        }
      } catch {
        // console.log("caught");
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [timer, timerState, isGame]);

  // Update the useEffect that handles answers with debug logging
  useEffect(() => {
    if (gameState === "active" && optionChosen !== undefined && optionChosen !== null) {
      const currentQuestion = questions[currQuestion];
      console.log("Processing answer:", {
        type: currentQuestion.type,
        optionChosen,
        isWriting: currentQuestion.type === "writing",
        difficulty: currentQuestion.difficulty
      });
      
      // Handle both multiple choice and writing questions
      const isCorrect = (currentQuestion.type === "writing" && optionChosen === true) || 
                       (currentQuestion.type !== "writing" && optionChosen === correctAnswerIndex);

      if (isCorrect) {
        console.log("Correct answer! Adding points and time:", {
          points: points[currentQuestion.difficulty],
          timeBonus: time[currentQuestion.difficulty]
        });
        
        // Add points based on difficulty
        setScore(prevState => prevState + points[currentQuestion.difficulty]);
        
        // Increase timer based on difficulty (only in game mode)
        if (isGame) {
          setTimer(prevState => {
            const newTime = prevState + time[currentQuestion.difficulty];
            console.log("Updating timer:", { oldTime: prevState, newTime });
            return newTime;
          });
        }
      }
      
      // Clear HSK word popover states
      setHskMatch(null);
      setSelectedText("");
      window.getSelection().removeAllRanges();
      
      setOptionChosen(null);

      if (questions[currQuestion + 1]) {
        setCurrQuestion(currQuestion + 1);
      } else {
        setGameState("finished");
      }
      
      setIsOptionsProcessed(false);
      setAnswerProcessed(true);
    }
  }, [optionChosen, gameState, questions, currQuestion, correctAnswerIndex, isGame]);

  // const [correctOrder, setCorrectOrder] = useState(false);

  const handleAnswer = (event, answerIndex, isCorrectOrder) => {
    // For reorder questions
    if (questions[currQuestion]?.type === "reorder") {
      setTimerState("paused");
      setGameState("paused");

      if (isCorrectOrder !== null) {
        if (isCorrectOrder) {
          const checkAnimation = correctAnimation({
            x: event.getBoundingClientRect().x - window.innerWidth / 2,
            y: event.getBoundingClientRect().y - window.innerHeight / 2,
          });
          checkAnimation.play();

          setScore((prevState) => prevState + points[questions[currQuestion].difficulty]);
          setTimer((prevState) => prevState + time[questions[currQuestion].difficulty]);
        } else {
          const crossAnimation = wrongAnimation({
            x: event.getBoundingClientRect().x - window.innerWidth / 2,
            y: event.getBoundingClientRect().y - window.innerHeight / 2,
          });
          crossAnimation.play();
        }
        
        setTimeout(() => {
          if (questions[currQuestion + 1]) {
            setCurrQuestion(currQuestion + 1);
            setAnswerProcessed(true);
            setIsOptionsProcessed(false);
          } else {
            setGameState("finished");
          }
          setTimerState("active");
          setGameState("active");
        }, isCorrectOrder ? 1000 : 2000);
      }
      return;
    }

    // For writing questions
    if (questions[currQuestion]?.type === "writing") {
      setTimerState("paused");
      setGameState("paused");
      
      if (isCorrectOrder) {
        const checkAnimation = correctAnimation({
          x: event.pageX - window.innerWidth / 2,
          y: event.pageY - window.innerHeight / 2,
        });
        checkAnimation.play();
      } else {
        const crossAnimation = wrongAnimation({
          x: event.pageX - window.innerWidth / 2,
          y: event.pageY - window.innerHeight / 2,
        });
        crossAnimation.play();
      }

      setTimeout(() => {
        setOptionChosen(isCorrectOrder);
        setTimerState("active");
        setGameState("active");
      }, 1000);
      return;
    }

    // Original handling for regular questions
    setTimerState("paused");
    setGameState("paused");
  
    if (answerIndex === correctAnswerIndex) {
      const checkAnimation = correctAnimation({
        x: event.pageX - window.innerWidth / 2,
        y: event.pageY - window.innerHeight / 2,
      });
      checkAnimation.play();
    } else {
      const crossAnimation = wrongAnimation({
        x: event.pageX - window.innerWidth / 2,
        y: event.pageY - window.innerHeight / 2,
      });
      crossAnimation.play();
    }
  
    setOptionStyles(
      options.map((o, index) => ({
        opacity: index === correctAnswerIndex ? "100%" : "0%",
      }))
    );
  
    setTimeout(() => {
      setOptionChosen(answerIndex);
      setTimerState("active");
      setGameState("active");
    }, 1000);
  };

  // Add this useEffect to fetch HSK words
  useEffect(() => {
    const fetchHskWords = async () => {
      try {
        const url = `${apiList.hskWords}?version=2.0&compact=true`;
        const data = await cachedGet(url, 300000);
        
        if (data.status === "success") {
          setHskWordsData({ "2.0": data.data });
        }
      } catch (error) {
        console.error("Error fetching HSK words:", error);
      }
    };

    fetchHskWords();
  }, []);

  const hskWordMap = useMemo(() => {
    const wordsToUse = hskWordsData["2.0"] || [];
    const wordMap = new Map();
    
    wordsToUse.forEach(word => {
      if (!word || !word.hanzi) return;
      wordMap.set(word.hanzi, {
        ...word,
        color: HSK_COLORS[word.level] || '#757575'
      });
    });

    return wordMap;
  }, [hskWordsData]);
  const findHSKMatch = text => text ? hskWordMap.get(text) : null;

  // Add function to detect if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Add handler for document-wide touch events
  useEffect(() => {
    const handleDocumentTouch = (e) => {
      // If there's a match shown and the touch is outside the popover and selected text
      if (hskMatch) {
        const selection = window.getSelection();
        const touchTarget = document.elementFromPoint(
          e.touches[0].clientX,
          e.touches[0].clientY
        );
        
        // Check if touch is outside popover and selected text
        const isOutsidePopover = !touchTarget.closest('.ant-popover');
        const isOutsideSelection = selection.toString().trim() !== selectedText;
        
        if (isOutsidePopover && isOutsideSelection) {
          setHskMatch(null);
          setSelectedText("");
          window.getSelection().removeAllRanges();
        }
      }
    };

    if (isMobile()) {
      document.addEventListener('touchstart', handleDocumentTouch);
      return () => {
        document.removeEventListener('touchstart', handleDocumentTouch);
      };
    }
  }, [hskMatch, selectedText]);

  // Update handleTextSelection
  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      // Check if the entire question is selected
      const questionText = questions[currQuestion]?.question;
      if (text === questionText) {
        setShowTranslation(true);
      } else {
        const match = findHSKMatch(text);
        if (match) {
          // If tapping the same word, close the popover
          if (text === selectedText) {
            setHskMatch(null);
            setSelectedText("");
            if (isMobile()) {
              window.getSelection().removeAllRanges();
            }
          } else {
            try {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              
              const top = window.scrollY + rect.top;
              const left = isMobile() 
                ? Math.min(Math.max(rect.left + (rect.width / 2), 160), window.innerWidth - 160)
                : rect.left + (rect.width / 2);
              
              setPopoverPosition({ top, left });
              setSelectedText(text);
              setHskMatch(match);
            } catch (error) {
              console.error('Error calculating position:', error);
            }
          }
        }
      }
    }
  };

  // Add touch event handlers
  const handleTouchStart = (e) => {
    // Clear previous selection
    window.getSelection().removeAllRanges();
  };

  // Add a new function to handle mouse down
  const handleMouseDown = (e) => {
    // Clear previous selection if clicking outside of selected text
    const selection = window.getSelection();
    if (!selection.toString().includes(selectedText)) {
      setHskMatch(null);
      setSelectedText("");
    }
  };

  // console.log({ isGame });
  return gameState === "loading" ? (
    // return true ? (
    <Loading />
  ) : (
    <>
      <div>
        {/* isGame === "false" */}
        {!isGame && gameState !== "finished" && (
          <div>
            <SkillHeaderContainer
              currentQuestion={currQuestion}
              questionsLength={questions.length}
            />
          </div>
        )}
      </div>

      <div
        ref={bombRef}
        className="Quiz "
        // style={
        //   gameState !== "finished" &&
        //   questions[currQuestion]?.type !== "question order" &&
        //   !questions[currQuestion]?.audioUrl
        //     ? { height: "55.5vh" }
        //     : {}
        // }
      >
        {gameState !== "finished" ? (
          <>
            <div className="questionWrapper">
              {isGame && (
                <p className={`difficulty ${questions[currQuestion]?.difficulty}`}>
                  {questions[currQuestion]?.difficulty}
                </p>
              )}

              {questions[currQuestion]?.type !== "reorder" ? (
                <>
                  <Popover
                    content={
                      <div className="translation-popup">
                        <p className="pinyin">
                          {questions[currQuestion]?.popupDescription?.pinyin}
                        </p>
                        <p className="english">
                          {questions[currQuestion]?.popupDescription?.translation}
                        </p>
                      </div>
                    }
                    open={clickCount === 3}
                    trigger={[]}
                    destroyTooltipOnHide={{ keepParent: false }}
                    placement="top"
                    align={{ offset: [0, 0] }}
                  >
                    <Popover
                      content={
                        hskMatch && (
                          <div style={{ padding: '8px' }} className="hsk-popover-content">
                            <div style={{ 
                              fontWeight: '600', 
                              color: hskMatch.color,
                              marginBottom: '4px' 
                            }}>
                              {hskMatch.hanzi} 
                              {hskMatch.part_of_speech && 
                                <span style={{ 
                                  fontSize: '0.8rem', 
                                  opacity: 0.7,
                                  fontWeight: 'normal',
                                  marginLeft: '4px'
                                }}>
                                  ({hskMatch.part_of_speech})
                                </span>
                              }
                            </div>
                            <div style={{ fontSize: '0.9rem', marginBottom: '2px' }}>
                              {hskMatch.pinyin}
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>
                              {hskMatch.english}
                            </div>
                            <div style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              backgroundColor: hskMatch.color,
                              color: 'white',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              {hskMatch.level}
                            </div>
                          </div>
                        )
                      }
                      open={hskMatch !== null}
                      trigger={[]}
                      onOpenChange={(visible) => {
                        if (!visible) {
                          setHskMatch(null);
                          setSelectedText("");
                        }
                      }}
                      overlayClassName="hsk-word-popover"
                    >
                      <Text
                        className="questionTitle"
                        style={{ 
                          fontSize: isMobile() ? "large" : "xx-large", 
                          cursor: 'pointer',
                          position: 'relative',
                          WebkitUserSelect: 'text',
                          WebkitTouchCallout: 'none',
                          userSelect: 'text',
                          touchAction: 'manipulation'
                        }}
                        onClick={handleQuestionClick}
                        onMouseUp={handleTextSelection}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTextSelection}
                      >
                        {Replacer(questions[currQuestion]?.question)}
                      </Text>
                    </Popover>
                  </Popover>
                </>
              ) : null}
            </div>
            {questions[currQuestion]?.audioUrl && (
              <AudioPlayer
                // audioUrl={`${server}/${questions[currQuestion]?.audioUrl}`}
                audioUrl={questions[currQuestion]?.audioUrl}
                audioDescription={questions[currQuestion]?.audioDescription}
              />
            )}
            {isGame && (
              <Timer
                score={score}
                showBomb={showBomb}
                time={`00:${Math.floor(timer / 1000)
                  .toString()
                  .padStart(2, "0")}`}
              />
            )}
            {questions[currQuestion]?.type === "reorder" ? (
              <>
                <Popover
                  content={
                    <div className="translation-popup">
                      <p className="pinyin">
                        {questions[currQuestion]?.popupDescription?.pinyin}
                      </p>
                      <p className="english">
                        {questions[currQuestion]?.popupDescription?.translation}
                      </p>
                    </div>
                  }
                  open={clickCount === 3}
                  trigger={[]}
                  destroyTooltipOnHide={{ keepParent: false }}
                  placement="top"
                  align={{ offset: [0, 0] }}
                >
                  <Popover
                    content={
                      hskMatch && (
                        <div style={{ padding: '8px' }} className="hsk-popover-content">
                          <div style={{ 
                            fontWeight: '600', 
                            color: hskMatch.color,
                            marginBottom: '4px' 
                          }}>
                            {hskMatch.hanzi} 
                            {hskMatch.part_of_speech && 
                              <span style={{ 
                                fontSize: '0.8rem', 
                                opacity: 0.7,
                                fontWeight: 'normal',
                                marginLeft: '4px'
                              }}>
                                ({hskMatch.part_of_speech})
                              </span>
                            }
                          </div>
                          <div style={{ fontSize: '0.9rem', marginBottom: '2px' }}>
                            {hskMatch.pinyin}
                          </div>
                          <div style={{ fontSize: '0.9rem' }}>
                            {hskMatch.english}
                          </div>
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            backgroundColor: hskMatch.color,
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {hskMatch.level}
                          </div>
                        </div>
                      )
                    }
                    open={hskMatch !== null}
                    trigger={[]}
                    onOpenChange={(visible) => {
                      if (!visible) {
                        setHskMatch(null);
                        setSelectedText("");
                      }
                    }}
                    overlayClassName="hsk-word-popover"
                  >
                    <Text
                      className="questionTitle"
                      style={{ 
                        fontSize: isMobile() ? "large" : "xx-large", 
                        cursor: 'pointer',
                        position: 'relative',
                        WebkitUserSelect: 'text',
                        WebkitTouchCallout: 'none',
                        userSelect: 'text',
                        touchAction: 'manipulation'
                      }}
                      onClick={handleQuestionClick}
                      onMouseUp={handleTextSelection}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTextSelection}
                    >
                      {Replacer(questions[currQuestion]?.question)}
                    </Text>
                  </Popover>
                </Popover>
                <QuoteApp
                  question={questions[currQuestion]?.question}
                  correct_answer={questions[currQuestion]?.correct_answer}
                  setCurrQuestion={setCurrQuestion}
                  currQuestion={currQuestion}
                  setGameState={setGameState}
                  questions={questions}
                  handleAnswer={handleAnswer}
                  isGame={isGame}
                />
              </>
            ) : (
              <div className="options">
                {options &&
                  options.map((option, index) => {
                    const currentQuestion = questions[currQuestion];
                    const isListingQuestion = currentQuestion?.category === "Listing";
                    
                    return (
                      <button
                        key={index}
                        style={optionStyles[index]}
                        onClick={(event) => handleAnswer(event, index)}
                      >
                        <img
                          src={optionImg[index]}
                          alt="answer"
                          className="ellipseOption"
                        />
                        {isListingQuestion ? option : Replacer(option)}
                      </button>
                    );
                  })}
              </div>
            )}
          </>
        ) : (
          <EndScreen
            user={user}
            score={score}
            resetQuiz={reset}
            isGame={isGame}
          />
        )}
      </div>
    </>
  );
};

export default Quiz;
