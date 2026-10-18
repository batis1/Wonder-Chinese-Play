import "./EndScreen.css";
import UserAvatar from "../Avatar/Avatar";
import { useHistory } from "react-router-dom";

const EndScreen = (props) => {
  const history = useHistory();

  return (
    <div className="EndScreen" style={{ height: "79.8vh" }}>
      <div className="endscreen-avatar-container">
        <UserAvatar user={props.user} />
      </div>
      <div className="endscreen-title-container">
        {props.isGame && (
          <div>
            <h2 className="endscreenScore">{props.score}</h2>
          </div>
        )}
        <div>
          <h1 className="title-endscreen">
            {props.score === 0 ? "Try again!" : "You've made it!"}
          </h1>
        </div>
      </div>

      <div className="button-endscreen">
        <button onClick={props.resetQuiz} className="endbtn playagain">
          Play again
        </button>
        {props.isGame && (
          <>
            <br />
            <button
              onClick={() => history.push("/leaderboard")}
              className="endbtn leaderboard"
            >
              View Leaderboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EndScreen;
