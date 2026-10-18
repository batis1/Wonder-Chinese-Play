import React, { useState, useRef, useEffect } from 'react';
import { Upload, Button, Typography, Spin, Space, Card, Row, Col, Progress, message } from 'antd';
import { InboxOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';
import apiList from '../../lib/apiList';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--lightAccent);
`;

const TestSection = styled(Card)`
  margin: 20px 0;
  background: var(--darkAccent);
  border: 1px solid var(--greyAccent);
  border-radius: 8px;
  
  .ant-card-body {
    color: var(--lightAccent);
  }
`;

const QuestionContainer = styled(Card)`
  background: var(--darkAccent);
  border: 1px solid var(--greyAccent);
  border-radius: 8px;
  margin-bottom: 1rem;
  
  .ant-card-body {
    color: var(--lightAccent);
  }
`;

const OptionButton = styled(Button)`
  background: #2a2a2a;
  border: 1px solid #4a4a4a;
  color: #e0e0e0;
  height: auto;
  padding: 12px 24px;
  text-align: center;
  white-space: normal;
  width: 100%;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  border-radius: 4px;
  
  &:hover {
    background: #2a2a2a !important;
    border-color: #f76707;
    color: #e0e0e0 !important;
  }
  
  &.selected {
    background: #f76707;
    border-color: #f76707;
    color: #e0e0e0;
    
    &:hover {
      background: #f76707;
      border-color: #f76707;
      color: #e0e0e0;
    }
  }

  &.ant-btn:not(.selected) {
    &:hover,
    &:focus,
    &:active {
      background: #2a2a2a !important;
      color: #e0e0e0 !important;
      border-color: #f76707;
      color: #e0e0e0;
    }

    &.selected {
      background: #f76707;
      border-color: #f76707;
      color: #e0e0e0;
    }
  }
`;

const QuestionText = styled(Text)`
  color: var(--lightAccent);
  font-size: 1.1em;
  display: block;
  margin-bottom: 1.5rem;
`;

const SectionProgress = styled(Text)`
  color: var(--lightAccent);
  margin-bottom: 1rem;
  display: block;
`;

const TimerContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--darkAccent);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--greyAccent);
  z-index: 1000;
`;

const AnswerInput = styled.textarea`
  width: 100%;
  min-height: 100px;
  background: var(--darkAccent);
  border: 1px solid var(--greyAccent);
  color: var(--lightAccent);
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
  
  &:focus {
    border-color: var(--orangeAccent);
    outline: none;
  }
`;

const NavigationButton = styled(Button)`
  background: var(--orangeAccent);
  border-color: var(--orangeAccent);
  color: var(--lightAccent);
  
  &:hover {
    background: var(--darkerOrange);
    border-color: var(--darkerOrange);
    color: var(--lightAccent);
  }
`;

const ReviewButton = styled(Button)`
  margin-right: 1rem;
  background: var(--darkAccent);
  border-color: var(--greyAccent);
  color: var(--lightAccent);
  
  &:hover {
    background: var(--darkAccent);
    border-color: var(--orangeAccent);
    color: var(--lightAccent);
  }
`;

const QuestionList = styled.div`
  padding: 20px;
  margin-bottom: 20px;
`;

const QuestionItem = styled.div`
  margin-bottom: 30px;
  border-bottom: 1px solid var(--greyAccent);
  padding-bottom: 20px;
  
  &:last-child {
    border-bottom: none;
  }
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
`;

const OptionItem = styled.div`
  padding: 10px;
  border: 1px solid var(--greyAccent);
  border-radius: 4px;
  color: var(--lightAccent);
  
  &:hover {
    background: var(--darkerAccent);
  }
`;

const StyledSpin = styled(Spin)`
  .ant-spin-dot-item {
    background-color: var(--orangeAccent) !important;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TimerDisplay = styled.span`
  color: var(--lightAccent);
  margin: 0 12px;
  font-size: 14px;
  font-family: monospace;
`;

const TimerButton = styled(Button)`
  background: #1f1f1f;
  border: 1px solid #383838;
  color: #e0e0e0;
  height: 24px;
  padding: 0 12px;
  font-size: 12px;
  border-radius: 4px;
  
  &:hover {
    background: #1f1f1f;
    border: 1px solid #ff8533;
    color: #e0e0e0;
  }
`;

const HSKGen = () => {
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState('upload');
  const [testData, setTestData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const timerRef = useRef(null);
  const mounted = useRef(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const handlePDFUpload = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size must be less than 10MB');
      message.error('File size must be less than 10MB');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      console.log('Uploading file:', file.name);
      const response = await axios.post(apiList.uploadHSKPDF, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      if (response.data.success) {
        const { data } = response.data;
        
        if (data.metadata.isValid) {
          message.success('PDF validated successfully');
          console.log('Validation details:', data.metadata.validationDetails);
          
          if (!data.metadata.hasOfficialHeader) {
            message.warning('Note: This appears to be an unofficial HSK test');
          }
          
          setTestData(data);
          setTimeRemaining(data.metadata.sectionTimes);
          setCurrentSection('listening');
        } else {
          throw new Error('PDF validation failed');
        }
      } else {
        throw new Error(response.data.error || 'Failed to process PDF');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      console.error('Full error response:', error.response?.data);
      
      if (mounted.current) {
        const errorMsg = error.response?.data?.details || 
                        error.response?.data?.error ||
                        error.message || 
                        'Failed to process PDF. Please ensure it is a valid HSK Level 5 test PDF.';
        
        setErrorMessage(errorMsg);
        message.error(errorMsg);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const startTimer = (section) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev[section] - 1;
        if (newTime <= 0) {
          clearInterval(timerRef.current);
          if (section === 'listening') {
            setCurrentSection('reading');
            setCurrentQuestionIndex(0);
            startTimer('reading');
          } else if (section === 'reading') {
            setCurrentSection('results');
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
          }
        }
        return {
          ...prev,
          [section]: Math.max(0, newTime)
        };
      });
    }, 1000);
  };

  const handleAnswer = (answer) => {
    if (!testData) return;

    if (currentSection.startsWith('reading')) {
      // Get current group index and questions
      const questionGroups = [
        { start: 46, end: 48 },
        { start: 49, end: 52 },
        { start: 53, end: 56 },
        { start: 57, end: 60 }
      ];

      const currentGroupIndex = Math.floor(currentQuestionIndex / 3);
      const currentGroup = questionGroups[currentGroupIndex];
      
      // Get all questions for current group
      const groupQuestions = testData.reading.filter(q => 
        q.questionNumber >= currentGroup.start && 
        q.questionNumber <= currentGroup.end
      );

      // Get current question
      const currentQuestion = groupQuestions[currentQuestionIndex % 3];

      // Update reading questions
      const updatedReading = testData.reading.map(q => 
        q.questionNumber === currentQuestion.questionNumber 
          ? { ...q, userAnswer: answer }
          : q
      );

      setTestData(prev => ({
        ...prev,
        reading: updatedReading
      }));
    } else if (currentSection === 'listening') {
      // ... existing listening logic ...
    }
  };

  const handleNextQuestion = () => {
    if (!testData) return;
    
    console.log('Current section:', currentSection);
    console.log('Current index:', currentQuestionIndex);
    
    if (currentSection === 'listening') {
      // Part 1 (1-20)
      if (currentQuestionIndex < 19) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Transition to Part 2
        console.log('Transitioning to part 2');
        setCurrentSection('listening-part2');
        setCurrentQuestionIndex(0);
      }
    } else if (currentSection === 'listening-part2') {
      // Part 2 (21-45)
      if (currentQuestionIndex < 24) { // 0-24 for questions 21-45
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Transition to reading section
        setCurrentSection('reading-part1');
        setCurrentQuestionIndex(0);
        startTimer('reading');
      }
    } else if (currentSection === 'reading-part1') {
      // Handle reading section part 1
      if (currentQuestionIndex < 9) { // Assuming 10 questions per part
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setCurrentSection('reading-part2');
        setCurrentQuestionIndex(0);
      }
    } else if (currentSection === 'reading-part2') {
      // Handle reading section part 2
      if (currentSection === 'reading-part3') {
        // Handle reading section part 3
        if (currentQuestionIndex < 9) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          setCurrentSection('results');
        }
      } else {
        setCurrentSection('reading-part3');
        setCurrentQuestionIndex(0);
      }
    }
  };

  const handleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    if (!isTimerRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      startTimer('listening');
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const renderUploadSection = () => {
    const draggerProps = {
      accept: '.pdf',
      beforeUpload: (file) => {
        handlePDFUpload(file);
        return false;
      },
      showUploadList: false,
      style: {
        background: 'var(--darkAccent)',
        border: '2px dashed var(--greyAccent)',
        borderRadius: '8px',
        padding: '2rem',
        transition: 'all 0.3s ease'
      }
    };

    return (
      <TestSection>
        <Text type="secondary" style={{ 
          color: 'var(--greyAccent)',
          marginBottom: '1rem'
        }}>
          Maximum file size: 10MB
        </Text>

        <Dragger {...draggerProps}>
          <div style={{ 
            padding: '2rem',
            background: 'var(--darkerAccent)',
            borderRadius: '8px'
          }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ 
                fontSize: '3rem', 
                color: 'var(--orangeAccent)' 
              }} />
            </p>
            <p style={{ 
              color: 'var(--lightAccent)',
              fontSize: '1.2rem',
              marginBottom: '1rem'
            }}>
              Click or drag PDF mock test file
            </p>
            <p style={{ 
              color: 'var(--greyAccent)'
            }}>
              The PDF should follow the standard format
            </p>
          </div>
        </Dragger>

        {errorMessage && (
          <Text style={{ 
            color: 'var(--redAccent)',
            marginTop: '1rem'
          }}>
            {errorMessage}
          </Text>
        )}
      </TestSection>
    );
  };

  const renderQuestion = () => {
    if (!testData) return null;

    // Determine which section and part we're in
    let questions;
    let sectionTitle;
    let partTitle;
    let partNumber;

    if (currentSection === 'listening') {
      questions = testData.listening.part1;
      sectionTitle = '一、听力';
      partTitle = '第1部分';
    } else if (currentSection === 'listening-part2') {
      questions = testData.listening.part2;
      sectionTitle = '一、听力';
      partTitle = '第2部分';
    } else if (currentSection.startsWith('reading')) {
      partNumber = parseInt(currentSection.split('-')[1]?.charAt(4) || '1');
      
      if (partNumber === 1) {
        // Define the question groups
        const questionGroups = [
          { start: 46, end: 48 },
          { start: 49, end: 52 },
          { start: 53, end: 56 },
          { start: 57, end: 60 }
        ];

        // Get current group index and questions
        const currentGroupIndex = Math.floor(currentQuestionIndex / 3); // Divide by minimum group size
        const currentGroup = questionGroups[currentGroupIndex];
        
        // Get all questions for current group
        const groupQuestions = testData.reading.filter(q => 
          q.questionNumber >= currentGroup.start && 
          q.questionNumber <= currentGroup.end
        );

        // Get current question
        const currentQuestion = groupQuestions[currentQuestionIndex % 3];

        // Define handleAnswer for reading section
        const handleReadingAnswer = (answer) => {
          if (!testData) return;

          const updatedReading = testData.reading.map(q => 
            q.questionNumber === currentQuestion.questionNumber 
              ? { ...q, userAnswer: answer }
              : q
          );

          setTestData(prev => ({
            ...prev,
            reading: updatedReading
          }));
        };

        sectionTitle = '二、阅读';
        partTitle = '第一部分';
        
        return (
          <QuestionContainer>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={4} style={{ color: 'var(--lightAccent)', margin: '0 0 1rem 0' }}>
                {sectionTitle}
              </Title>

              <Title level={5} style={{ color: 'var(--lightAccent)', margin: '0 0 1rem 0' }}>
                {partTitle}
              </Title>

              <Text style={{ color: 'var(--lightAccent)', marginBottom: '1rem' }}>
                第46-60题，请选出正确答案。
              </Text>

              {/* Show passage text */}
              {currentQuestion?.passageText && (
                <Card 
                  style={{ 
                    marginBottom: '1rem', 
                    background: 'var(--darkAccent)', 
                    border: '1px solid var(--greyAccent)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <Text style={{ color: 'var(--lightAccent)' }}>
                    {currentQuestion.passageText}
                  </Text>
                </Card>
              )}

              {/* Show current question */}
              <QuestionText>
                第{currentQuestion?.questionNumber}题
              </QuestionText>
              
              {/* Show options for current question only */}
              <Space direction="vertical" style={{ width: '100%', marginBottom: '2rem' }}>
                {currentQuestion?.options?.map((option) => (
                  <OptionButton
                    key={`${currentQuestion.questionNumber}-${option.key}`}
                    onClick={() => handleReadingAnswer(option.key)}
                    className={currentQuestion.userAnswer === option.key ? 'selected' : ''}
                  >
                    <Space>
                      <Text strong style={{ color: 'inherit' }}>{option.key}</Text>
                      <Text style={{ color: 'inherit' }}>{option.text}</Text>
                    </Space>
                  </OptionButton>
                ))}
              </Space>

              {/* Navigation */}
              <Space style={{ marginTop: '2rem', width: '100%', justifyContent: 'space-between' }}>
                {currentQuestionIndex > 0 && (
                  <ReviewButton 
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                    icon={<LeftOutlined />}
                  >
                    上一题
                  </ReviewButton>
                )}
                <NavigationButton 
                  onClick={() => {
                    const nextIndex = currentQuestionIndex + 1;
                    const nextGroupIndex = Math.floor(nextIndex / 3);
                    
                    if (nextGroupIndex < questionGroups.length) {
                      setCurrentQuestionIndex(nextIndex);
                    } else {
                      setCurrentSection('reading-part2');
                      setCurrentQuestionIndex(0);
                    }
                  }}
                  icon={<RightOutlined />}
                >
                  {currentQuestionIndex < (currentGroup.end - currentGroup.start) ? '下一题' : '下一部分'}
                </NavigationButton>
              </Space>
            </Space>
          </QuestionContainer>
        );
      }
      
      // ... rest of reading part 2 code ...
    }

    // Return the listening section question rendering
    const question = questions[currentQuestionIndex] || {
      questionNumber: currentQuestionIndex + 1,
      text: '加载中...',
      options: []
    };

    // Set total questions based on the section
    const totalQuestions = currentSection === 'listening' ? 20 : 25;

    return (
      <QuestionContainer>
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Section Title */}
          <SectionHeader>
            <Title level={4} style={{ color: 'var(--lightAccent)', margin: 0 }}>
              一、听力
            </Title>
            <TimerDisplay>{formatTime(timeRemaining?.listening || 0)}</TimerDisplay>
            <TimerButton onClick={handleTimer}>
              {isTimerRunning ? 'Pause' : 'Start'}
            </TimerButton>
          </SectionHeader>

          {/* Part Title */}
          <Title level={5} style={{ color: 'var(--lightAccent)', margin: '0 0 1rem 0' }}>
            {partTitle}
          </Title>

          {/* Progress */}
          <SectionProgress>
            第 {currentQuestionIndex + 1} 题 / 共 {totalQuestions} 题
          </SectionProgress>

          {/* Question Text */}
          <QuestionText>
            {question.text}
          </QuestionText>

          {/* Options */}
          <Space direction="vertical" style={{ width: '100%' }}>
            {question.options?.map((option) => (
              <OptionButton
                key={option.key}
                onClick={() => handleAnswer(option.key)}
                className={question.userAnswer === option.key ? 'selected' : ''}
              >
                <Space>
                  <Text strong style={{ color: 'inherit' }}>{option.key}.</Text>
                  <Text style={{ color: 'inherit' }}>{option.text}</Text>
                </Space>
              </OptionButton>
            ))}
          </Space>

          {/* Navigation Buttons */}
          <Space style={{ marginTop: '2rem', width: '100%', justifyContent: 'space-between' }}>
            {currentQuestionIndex > 0 && (
              <ReviewButton 
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                icon={<LeftOutlined />}
              >
                上一题
              </ReviewButton>
            )}
            <NavigationButton 
              onClick={handleNextQuestion}
              icon={<RightOutlined />}
            >
              {currentQuestionIndex < totalQuestions - 1 ? '下一题' : '下一部分'}
            </NavigationButton>
          </Space>
        </Space>
      </QuestionContainer>
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds.toString().padStart(2, '0')}秒`;
  };

  const renderResults = () => {
    const calculateScore = (section) => {
      if (!testData || !testData[section]) return 0;
      const questions = testData[section];
      const correct = questions.filter(q => 
        q.userAnswer && q.correctAnswer && q.userAnswer === q.correctAnswer
      ).length;
      return Math.round((correct / questions.length) * 100);
    };

    return (
      <TestSection>
        <Title level={3} style={{ color: 'var(--lightAccent)' }}>考试结果</Title>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="听力部分">
              <Progress 
                type="circle" 
                percent={calculateScore('listening')}
                format={percent => `${percent}分`}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="阅读部分">
              <Progress 
                type="circle" 
                percent={calculateScore('reading')}
                format={percent => `${percent}分`}
              />
            </Card>
          </Col>
        </Row>
        <Space direction="vertical" style={{ width: '100%', marginTop: '2rem' }}>
          <Title level={4} style={{ color: 'var(--lightAccent)' }}>Detailed Feedback</Title>
          {['listening', 'reading'].map(section => (
            <TestSection key={section}>
              <Title level={5} style={{ color: 'var(--lightAccent)' }}>
                {section === 'listening' ? '一、听力' : '二、阅读'}
              </Title>
              {testData[section].map((question) => (
                <QuestionContainer key={question.id}>
                  <Text>Question {question.questionNumber}: {question.text}</Text>
                  <Text style={{ 
                    display: 'block', 
                    marginTop: '0.5rem', 
                    color: question.userAnswer === question.correctAnswer ? 
                      'var(--greenAccent)' : 'var(--redAccent)' 
                  }}>
                    Your Answer: {question.userAnswer || 'Not answered'}
                  </Text>
                  {question.userAnswer !== question.correctAnswer && (
                    <Text style={{ display: 'block', marginTop: '0.5rem', color: 'var(--greenAccent)' }}>
                      Correct Answer: {question.correctAnswer}
                    </Text>
                  )}
                </QuestionContainer>
              ))}
            </TestSection>
          ))}
        </Space>
      </TestSection>
    );
  };

  const testHSKRoute = async () => {
    try {
      console.log('Testing route:', apiList.testHSKRoute);
      const response = await axios.get(apiList.testHSKRoute);
      console.log('Test route response:', response.data);
      message.success('Successfully connected to HSK Generator route!');
    } catch (error) {
      console.error('Error testing route:', error);
      console.error('API URL:', apiList.testHSKRoute);
      message.error(`Failed to connect to HSK Generator route: ${error.message}`);
    }
  };

  useEffect(() => {
    testHSKRoute();
  }, []);

  return (
    <Container>
      {/* <Title level={2} style={{ color: 'var(--lightAccent)', marginBottom: '2rem' }}>
        HSK Level 5 Mock Test
      </Title> */}
      
      {loading ? (
        <Space 
          direction="vertical" 
          align="center" 
          style={{ 
            width: '100%',
            background: 'var(--darkerAccent)',
            padding: '2rem',
            borderRadius: '8px',
            marginTop: '2rem'
          }}
        >
          <StyledSpin size="large" />
          <Text style={{ 
            color: 'var(--lightAccent)',
            marginTop: '1rem'
          }}>
            Processing PDF...
          </Text>
        </Space>
      ) : (
        <>
          {currentSection !== 'upload' && currentSection !== 'results' && timeRemaining && (
            <TimerDisplay timeRemaining={timeRemaining} currentSection={currentSection} />
          )}
          
          {currentSection === 'upload' && renderUploadSection()}
          {(currentSection === 'listening' || currentSection === 'listening-part2') && (
            <TestSection>
              <Title level={4} style={{ color: 'var(--lightAccent)' }}>
                一、听力
              </Title>
              {renderQuestion()}
            </TestSection>
          )}
          {currentSection === 'reading-part1' && renderQuestion()}
          {currentSection === 'reading-part2' && renderQuestion()}
          {currentSection === 'reading-part3' && renderQuestion()}
          {currentSection === 'results' && renderResults()}
        </>
      )}
    </Container>
  );
};

export default HSKGen;
