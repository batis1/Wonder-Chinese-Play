import React, {useRef, useState, memo } from "react";
import ReactPlayer from "react-player";
import CircleControls from "react-player-circle-controls";
import "react-player-circle-controls/dist/styles.css";
import Loading from "../Loading/Loading";
import { Button, Typography } from "antd";

const { Paragraph } = Typography;

const AudioPlayer = ({ audioUrl, audioDescription }) => {
  const player = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [playerState, setPlayerState] = useState({
    played: 0,
    loaded: 0,
  });

  const onSeek = (amount) => {
    if (player.current) {
      player.current.seekTo(amount, "fraction");
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "51vh",
        gap: "20px",
        flexDirection: "column",
      }}
    >
      {!audioUrl ? (
        <Loading></Loading>
      ) : (
        <>
          <ReactPlayer
            ref={player}
            url={audioUrl}
            playing={playing}
            height="0"
            width="0"
            onProgress={setPlayerState}
            onEnded={() => setPlaying(false)}
          />
          <CircleControls
            played={playerState.played}
            loaded={playerState.loaded}
            playing={playing}
            onSeek={onSeek}
            onTogglePlaying={() => setPlaying(!playing)}
          />
          <Button onClick={() => setIsOpen(!isOpen)}>show audio desc</Button>
          {isOpen && (
            <Paragraph>
              <pre style={{ color: "#fff" }}>{audioDescription}</pre>
            </Paragraph>
          )}
        </>
      )}
    </div>
  );
};

export default memo(AudioPlayer);
