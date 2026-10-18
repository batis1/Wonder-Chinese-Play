import React, { useContext } from "react";
import { SkillModalSC } from "./TutorialSC";
import { useHistory } from "react-router-dom";
import { actions, GlobalContext } from "../../App";

export const SkillModal = ({ isOpen, title, lessonId }) => {
  const history = useHistory();
  const { dispatch } = useContext(GlobalContext);

  const handleExerciseClick = (category) => {
    const payload = { 
      level: title, 
      isGame: false, 
      lessonId: lessonId,
      category: category,
      loading: true
    };
    
    dispatch({
      type: actions.SET_LESSON_PARAMS,
      payload
    });

    history.push(`/quiz?category=${category}&level=${title}`);
  };

  return (
    <SkillModalSC isOpen={isOpen} className="skill-modal-container skm-pointer">
      <div>
        <div className="skm-start-btn-container">
          <button
            onClick={() => handleExerciseClick("Reading")}
            className="skm-start-btn"
          >
            Reading Exercise
          </button>
        </div>
        <div className="skm-start-btn-container">
          <button
            onClick={() => handleExerciseClick("Listing")}
            className="skm-start-btn"
          >
            Listening Exercise
          </button>
        </div>
        <div className="skm-start-btn-container">
          <button
            onClick={() => handleExerciseClick("Writing")}
            className="skm-start-btn"
          >
            Writing Exercise
          </button>
        </div>
      </div>
    </SkillModalSC>
  );
};
