import React from "react";
import { Lesson } from "./Lesson";
import { AnimatedLessonWrapper } from './LessonsContainerSC';

export const LessonsContainer = ({ lessons, index, activePopup, setActivePopup }) => {
  const handleLessonClick = () => {
    // If this lesson is already active, close its popup
    if (activePopup === index) {
      setActivePopup(null);
    }
    // Only allow opening this lesson's popup if no other popup is currently active
    else if (activePopup === null) {
      setActivePopup(index);
    }
    // If another popup is active, do nothing
  };


  return (
    <AnimatedLessonWrapper index={index} isActive={activePopup === index}>
      <div className="lessons-row-container">
        {lessons.map((lesson) => (
          <Lesson 
            key={lesson._id || lesson.title} 
            lesson={lesson}
            onClick={handleLessonClick}
            isActive={activePopup === index}
          />
        ))}
      </div>
    </AnimatedLessonWrapper>
  );
};