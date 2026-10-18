import React, { useState, useEffect } from "react";
import { Table, Badge, Dropdown, Menu, Button } from "antd";
import { useHistory } from "react-router-dom";
import UserAvatar from "../Avatar/Avatar.js";
import "./Scoreboard.css";
import Loading from "../Loading/Loading";
import apiList from "../../lib/apiList.js";
import { ACTIVE_HSK_LEVEL } from "../../lib/course";

const Podium = ({ score, place, color }) => {
  return (
    <div className={`podium-${place}`}>
      <Badge.Ribbon
        text={`${place}: ${score.username}`}
        offset={[0, 80]}
        color={color}
      >
        <UserAvatar
          user={{ id: score.userID, avatar: score.avatar || null }}
          size={place === "1st" ? 124 : 96}
        />
      </Badge.Ribbon>
    </div>
  );
};

const Scoreboard = (props) => {
  // console.log("scoreboard mounted");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [tableState, setTableState] = useState("loading");
  const history = useHistory();
  const [selectedMode, setSelectedMode] = useState("global");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const userId = props.user?.id || props.user?._id || props.user?._doc?._id;
  useEffect(() => {
    if (!props.user) {
      history.push("/login");
    }
  }, []);

  const modeText = { global: "Global Scores", user: "Your Scores" };

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const url = selectedMode === "global" ? apiList.score : `${apiList.score}/${userId}`;
    setTableState("loading");
    setError("");
    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => {
        if (!Array.isArray(data)) throw new Error();
        const rows = data.filter(score => (score.hskLevel || score.level) === ACTIVE_HSK_LEVEL)
          .map(score => ({ ...score, score: Number(score.score || 0) }))
          .sort((a, b) => b.score - a.score)
          .map((score, index) => ({
            ...score,
            userID: score.userID || score.user_id || score._id,
            username: score.username || score.user?.username,
            date: new Date(score.date).toLocaleDateString(["ban", "id"]),
            index: index + 1,
            key: score._id || score.id || `${score.userID}-${index}`,
            level: ACTIVE_HSK_LEVEL
          }));
        setLeaderboardData(rows);
        setTableState("loaded");
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          setError("Scores could not be loaded. Please try again.");
          setTableState("error");
        }
      });
    return () => controller.abort();
  }, [selectedMode, userId, retry]);

  const columns = [
    { title: "#", dataIndex: "index", key: "index" },
    {
      title: "User",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      render: (level) => level || 'N/A'
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
  ];
  const places = ["1st", "2nd", "3rd"];
  const medals = ["#AF9500", "#B4B4B4", "#6A3805"];

  const handleMenuClick = ({ key }) => {
    setSelectedMode(key);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="global">Global Scores</Menu.Item>
      <Menu.Item key="user">Your Scores</Menu.Item>
    </Menu>
  );

  return (
    <div className="scoreboard-container">
      <h1 className="page-title">Scoreboard</h1>
      <Dropdown
        overlay={menu}
        placement="bottomRight"
        trigger={["click"]}
        arrow
      >
        <Button>{modeText[selectedMode]}</Button>
      </Dropdown>
      {selectedMode === "global" ? (
        <div className="podium">
          {leaderboardData?.slice(0, 3).map((score, index) => {
            const place = places[index];
            return (
              <Podium
                key={place}
                score={score}
                place={places[index]}
                color={medals[index]}
              />
            );
          })}
        </div>
      ) : null}
      <div className="tableScore">
        {error ? <div role="alert"><p>{error}</p><Button onClick={() => setRetry(value => value + 1)}>Try again</Button></div> : tableState === "loaded" ? (
          <Table
            dataSource={leaderboardData}
            columns={columns}
            pagination={false}
          />
        ) : (
          <Loading />
        )}
      </div>
    </div>
  );
};

export default Scoreboard;
