import React from "react";
import "./Howtoplay.css";
import rule1 from "../../Images/rule1.svg";
import rule2 from "../../Images/rule2.svg";
import rule3 from "../../Images/rule3.svg";
import rule4 from "../../Images/rule4.svg";

const Howtoplay = () => {
  return (
    <div className="howtoplay-page">
      <h1 className="header">How to use this platform</h1>
      <div className="rules">
        <div className="rule-container">
          <div className="number-container">
            <img src={rule1} width="50px" alt="rule number indicator" />
          </div>
          <div>
            <p className="rule">
              Follow the tutorial's lessons and complete the exercises. You can choose from different categories like Reading and Listening to practice specific skills.
            </p>
          </div>
        </div>

        <div className="rule-container">
          <div className="number-container">
            <img src={rule2} width="50px" alt="rule number indicator" />
          </div>
          <div>
            <p className="rule">
              In game mode, you start with 55 seconds on the timer. Each correct answer adds bonus time:
              <ul className="rule-details">
                <li>Easy questions: +10 seconds (2 points)</li>
                <li>Medium questions: +15 seconds (5 points)</li>
                <li>Hard questions: +20 seconds (10 points)</li>
              </ul>
            </p>
          </div>
        </div>

        <div className="rule-container">
          <div className="number-container">
            <img src={rule3} width="50px" alt="rule number indicator" />
          </div>
          <div>
            <p className="rule">
              Click on any question to see its pinyin and English translation in a convenient popup window.
            </p>
          </div>
        </div>

        <div className="rule-container">
          <div className="number-container">
            <img src={rule4} width="50px" alt="rule number indicator" />
          </div>
          <div>
            <p className="rule">
              HSK OCR Analysis <span className="coming-soon-badge">Coming Soon</span>
              <ul className="rule-details">
                <li>Upload an image or take a photo containing Chinese text</li>
                <li>Get instant analysis showing HSK level for each word</li>
                <li>See pinyin and English translations</li>
                <li>Words are color-coded by HSK level for easy reference</li>
              </ul>
            </p>
          </div>
        </div>

        <div className="rule-container">
          <div className="number-container">
            <img src={rule4} width="50px" alt="rule number indicator" />
          </div>
          <div>
            <p className="rule">
              Use our HSK Search feature to analyze Chinese text:
              <ul className="rule-details">
                <li>Type or paste Chinese text into the search box</li>
                <li>Get instant HSK level analysis for each word</li>
                <li>View pinyin and English translations</li>
                <li>Words are color-coded by HSK level</li>
              </ul>
            </p>
          </div>
        </div>
        
        <div className="rule-container">
          <div className="number-container">
            <img src={rule4} width="50px" alt="rule number indicator" />
          </div>
          <div>
            <p className="rule">Have fun!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Howtoplay;
