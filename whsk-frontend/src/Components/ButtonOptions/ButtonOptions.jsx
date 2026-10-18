import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import { actions, GlobalContext } from "../../App";
import { MainWrapper } from "./ButtonOptionsSC";

export const ButtonOptions = () => {
  const history = useHistory();
  const { dispatch } = useContext(GlobalContext);
  
  const handleGameClick = () => {
    dispatch({
      type: actions.SET_LESSON_PARAMS,
      payload: { level: "", isGame: true },
    });
    history.push("/quiz");
  };

  return (
    <MainWrapper>
      <button
        onClick={handleGameClick}
        className="btn homebtn getstarted"
        role="button"
      >
        GAME
      </button>
      <button
        onClick={() => history.push("/tutorial")}
        className="btn homebtn getstarted"
        role="button"
      >
        TUTORIAL
      </button>
    </MainWrapper>
  );
};
