// SkillTree.js
import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import apiList from "../../lib/apiList";
import { LessonsContainer } from "./LessonsContainer";
import { GlobalContext } from "../../App";
import { useHistory } from 'react-router-dom';

export const SkillTree = () => {
  const { state } = useContext(GlobalContext);
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessonsContainer, setLessonsContainer] = useState([]);
  const [activePopup, setActivePopup] = useState(null);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.lesson-item') && !e.target.closest('.lesson-popup')) {
        setActivePopup(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check both GlobalContext and sessionStorage for user data
        let userHskLevel = state?.user?.hskLevel;
        
        if (!userHskLevel) {
          const sessionUser = JSON.parse(window.sessionStorage.getItem("currentUser"));
          userHskLevel = sessionUser?._doc?.hskLevel || sessionUser?.hskLevel;
          
          if (!userHskLevel) {
            history.push('/login');
            return;
          }
        }

        const {
          data: { docs },
        } = await axios.get(`${apiList.lessons}?hskLevel=${userHskLevel}`);

        const newLessons = docs.map(element => [element]);
        setLessonsContainer(newLessons);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [state?.user?.hskLevel]);

  if (isLoading) {
    // return <div className="skill-tree loading">Loading...</div>;
  }

  if (error) {
    return <div className="skill-tree error">{error}</div>;
  }
  const handleLessonClick = (index) => {
    // Only toggle the clicked lesson's popup if it's the active one
    // Otherwise, do nothing if another popup is already open
    if (activePopup === index) {
      setActivePopup(null);
    } else if (activePopup === null) {
      setActivePopup(index);
    }
  };
  return (
    <div 
      className="skill-tree" 
      style={{ 
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {lessonsContainer.map((item, index) => (
        <LessonsContainer 
          key={index} 
          lessons={item} 
          index={index}
          activePopup={activePopup}
          // setActivePopup={setActivePopup}
          setActivePopup={() => handleLessonClick(index)}
        />
      ))}
    </div>
  );
};