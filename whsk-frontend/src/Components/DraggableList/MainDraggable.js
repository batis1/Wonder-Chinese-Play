import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";

const Wrapper = styled.div`
  position: relative;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const TriesText = styled.div`
  text-align: center;
  margin-bottom: 10px;
  color: ${props => 
    props.noTriesLeft ? 'var(--errorColor, #9f3030)' :
    'var(--whsk-ink, #363537)'
  };
  font-weight: ${props => props.noTriesLeft ? 'bold' : 'normal'};
`;

const WordsArea = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;
  padding: 20px;
`;

const WordItem = styled.div`
  background: #ccc;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  font-size: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #bbb;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;

  @media (max-width: 768px) {
    gap: 40px;
    margin-top: 25px;
  }
`;

const ArrowButton = styled.button`
  padding: 8px 20px;
  background: #e5ddef;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  color: var(--whsk-ink, #363537);
  font-size: 18px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(244, 123, 63, 0.3);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(244, 123, 63, 0.4);
    background: #FF8B4F;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 8px rgba(244, 123, 63, 0.3);
  }

  @media (max-width: 768px) {
    padding: 10px 25px;
    font-size: 20px;
  }
`;

const CheckButton = styled.button`
  margin-top: 20px;
  padding: 15px 30px;
  background: #F47B3F;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  color: var(--whsk-ink, #363537);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(244, 123, 63, 0.3);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(244, 123, 63, 0.4);
    background: #FF8B4F;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 8px rgba(244, 123, 63, 0.3);
  }

  @media (max-width: 768px) {
    padding: 14px 45px;
    font-size: 18px;
  }

  /* Remove hover effects for touch devices */
  @media (hover: none) and (pointer: coarse) {
    transition: none;
    transform: none !important;
    
    &:active {
      background: #E66B2F;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
`;

const CorrectAnswerDisplay = styled.div`
  font-size: 1.5rem;
  text-align: center;
  margin: 1rem 0;
  color: var(--whsk-ink, #363537);
  font-weight: bold;
`;

function QuoteApp({
  question,
  correct_answer,
  setGameState,
  currQuestion,
  questions,
  handleAnswer,
  isGame
}) {
  const [items, setItems] = useState([]);
  const [shuffledDisplay, setShuffledDisplay] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswerCorrect, setUserAnswerCorrect] = useState(false);
  const [tries, setTries] = useState(0);
  const [maxTries, setMaxTries] = useState(3);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const elementRef = useRef(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  useEffect(() => {
    if (question) {
      const words = question.trim().split(/\s+/).filter(Boolean);
      
      const initialItems = words.map((word, index) => ({
        id: `item-${index}-${Date.now()}`,
        content: word
      }));
      
      const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };
      
      const shuffledItems = shuffleArray([...initialItems]);
      
      if (shuffledItems.map(item => item.content).join('') === words.join('')) {
        shuffleArray(shuffledItems);
      }
      
      setItems(shuffledItems);
      setShuffledDisplay(shuffledItems.map(item => item.content).join(' '));
      setMaxTries(3);
      setIsCorrect(false);
      setTries(0);
      setSelectedIndex(null);
      setUserAnswerCorrect(false);
      setShowCorrectAnswer(false);
    }
  }, [question]);

  const checkAnswer = () => {
    const userAnswer = items.map(item => item.content).join("");
    const newTries = tries + 1;
    setTries(newTries);

    // Clear any text selection
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }

    if (userAnswer === correct_answer) {
      setIsCorrect(true);
      setUserAnswerCorrect(true);
      setTimeout(() => {
        moveToNextQuestion(true);
      }, 500);
    } else if (newTries >= maxTries) {
      setUserAnswerCorrect(false);
      setIsCorrect(false);
      setShowCorrectAnswer(true);
      setTimeout(() => {
        moveToNextQuestion(false);
      }, 2000);
    }
  };

  const moveToNextQuestion = (isCorrect) => {
    // Clear HSK word states
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    
    if (questions.length - 1 > currQuestion) {
      setIsCorrect(isCorrect);
      setUserAnswerCorrect(isCorrect);
      handleAnswer(elementRef.current, null, isCorrect);
    } else {
      setGameState("finished");
    }
  };

  const moveItem = (direction) => {
    if (selectedIndex === null) return;
    
    const newIndex = direction === 'left' 
      ? Math.max(0, selectedIndex - 1)
      : Math.min(items.length - 1, selectedIndex + 1);
    
    if (newIndex !== selectedIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(selectedIndex, 1);
      newItems.splice(newIndex, 0, removed);
      
      setItems(newItems);
      setSelectedIndex(newIndex);
    }
  };

  if (!items.length) return null;

  return (
    <Wrapper ref={elementRef}>
      <TriesText noTriesLeft={tries >= maxTries}>
        {tries >= maxTries 
          ? "Not correct!" 
          : `Tries remaining: ${maxTries - tries}`
        }
      </TriesText>
      {showCorrectAnswer && tries >= maxTries && (
        <CorrectAnswerDisplay>
          Correct answer: {correct_answer}
        </CorrectAnswerDisplay>
      )}
      <Container>
        <WordsArea>
          {items.map((item, index) => (
            <WordItem
              key={item.id}
              isCorrect={isCorrect}
              userAnswerCorrect={userAnswerCorrect}
              noTriesLeft={tries >= maxTries}
              onClick={() => setSelectedIndex(index)}
              style={{
                border: selectedIndex === index ? '2px solid var(--primaryColor)' : 'none',
                cursor: 'pointer'
              }}
            >
              {item.content}
            </WordItem>
          ))}
        </WordsArea>
        <ButtonsContainer>
          <ArrowButton
            onClick={() => moveItem('left')}
            disabled={selectedIndex === null || selectedIndex === 0}
          >
            ←
          </ArrowButton>
          <ArrowButton
            onClick={() => moveItem('right')}
            disabled={selectedIndex === null || selectedIndex === items.length - 1}
          >
            →
          </ArrowButton>
        </ButtonsContainer>
        <CheckButton
          onClick={checkAnswer}
          disabled={tries >= maxTries}
        >
          Check Answer
        </CheckButton>
      </Container>
    </Wrapper>
  );
}

export default QuoteApp;
