import React, { useContext, useEffect, useState } from "react";
import { Table, Button, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import { actions, GlobalContext } from "../../App";
import Loading from "../Loading/Loading";
import { useHistory } from "react-router-dom";
import apiList from "../../lib/apiList";

export const WordsTable = () => {
  const [dataSource, setDataSource] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    state: { lessonId, user, searchInput },
    dispatch,
  } = useContext(GlobalContext);

  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          history.push("/login");
          return;
        }
        let apiUrl = apiList.words;
        if (lessonId) {
          apiUrl = `${apiUrl}?lessonId=${lessonId}`;
        } else if (searchInput) {
          apiUrl = `${apiUrl}?query=${searchInput}`;
        } else {
          apiUrl = `${apiUrl}?userId=${user._id || user.id}`;
        }

        const { data: { docs } } = await axios.get(apiUrl);

        if (user.savedWords) {
          const updatedWords = docs.map(word => ({
            ...word,
            isSaved: user.savedWords.includes(word._id)
          }));
          setDataSource(updatedWords);
        } else {
          setDataSource(docs);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [lessonId, searchInput, user, history]);

  const handleSaveWord = async (newWordId) => {
    const newSavedWord = user.savedWords.map((_id) => _id);
    newSavedWord.push(newWordId);

    // update savedWord in the database
    await axios.put(`${apiList.user}/${user._id}`, {
      savedWords: newSavedWord,
    });

    // update savedWord in context
    dispatch({
      type: actions.UPDATE_USER,
      payload: { savedWords: newSavedWord },
    });
  };

  const handleDeleteSavedWord = async (wordId) => {
    const savedWordAfterD = user.savedWords.filter((_id) => _id !== wordId);
    
    await axios.put(`${apiList.user}/${user._id || user.id}`, {
      savedWords: savedWordAfterD,
    });

    dispatch({
      type: actions.UPDATE_USER,
      payload: { savedWords: savedWordAfterD },
    });

    history.push("/");
    history.push("/lesson");
  };

  const columns = [
    {
      title: "Character",
      dataIndex: "character",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        return (
          <>
            <Input
              autoFocus
              placeholder="Type text here"
              value={selectedKeys[0]}
              onChange={(e) => {
                setSelectedKeys(e.target.value ? [e.target.value] : []);
                confirm({ closeDropdown: false });
              }}
              onPressEnter={() => {
                confirm();
              }}
              onBlur={() => {
                confirm();
              }}
            ></Input>
            <Button
              onClick={() => {
                confirm();
              }}
              type="primary"
            >
              Search
            </Button>
            <Button
              onClick={() => {
                clearFilters();
              }}
              type="danger"
            >
              Reset
            </Button>
          </>
        );
      },
      filterIcon: () => {
        return <SearchOutlined />;
      },
      onFilter: (value, record) => {
        return record.Character.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: "Pinyin",
      dataIndex: "pinyin",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        return (
          <>
            <Input
              autoFocus
              placeholder="Type text here"
              value={selectedKeys[0]}
              onChange={(e) => {
                setSelectedKeys(e.target.value ? [e.target.value] : []);
                confirm({ closeDropdown: false });
              }}
              onPressEnter={() => {
                confirm();
              }}
              onBlur={() => {
                confirm();
              }}
            ></Input>
            <Button
              onClick={() => {
                confirm();
              }}
              type="primary"
            >
              Search
            </Button>
            <Button
              onClick={() => {
                clearFilters();
              }}
              type="danger"
            >
              Reset
            </Button>
          </>
        );
      },
      filterIcon: () => {
        return <SearchOutlined />;
      },
      onFilter: (value, record) => {
        return record.Pinyin.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: "English Translation",
      dataIndex: "englishTranslation",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        return (
          <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
            <Input
              autoFocus
              placeholder="Type text here"
              value={selectedKeys[0]}
              onChange={(e) => {
                setSelectedKeys(e.target.value ? [e.target.value] : []);
                confirm({ closeDropdown: false });
              }}
              onPressEnter={() => {
                confirm();
              }}
              onBlur={() => {
                confirm();
              }}
            ></Input>
            <Button
              onClick={() => {
                confirm();
              }}
              type="primary"
            >
              Search
            </Button>
            <Button
              onClick={() => {
                clearFilters();
              }}
              type="danger"
            >
              Reset
            </Button>
          </div>
        );
      },
      filterIcon: () => {
        return <SearchOutlined />;
      },
      onFilter: (value, record) => {
        return record.English.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: "Sentence",
      dataIndex: "sentence",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        return (
          <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
            <Input
              autoFocus
              placeholder="Type text here"
              value={selectedKeys[0]}
              onChange={(e) => {
                setSelectedKeys(e.target.value ? [e.target.value] : []);
                confirm({ closeDropdown: false });
              }}
              onPressEnter={() => {
                confirm();
              }}
              onBlur={() => {
                confirm();
              }}
            ></Input>
            <Button
              onClick={() => {
                confirm();
              }}
              type="primary"
            >
              Search
            </Button>
            <Button
              onClick={() => {
                clearFilters();
              }}
              type="danger"
            >
              Reset
            </Button>
          </div>
        );
      },
      filterIcon: () => {
        return <SearchOutlined />;
      },
      onFilter: (value, record) => {
        return record.Sentence.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: "Action",
      key: "action",
      render: (item) =>
        dataSource.length >= 1 ? (
          lessonId || searchInput ? (
            <button
              className="btn"
              disabled={item.isSaved}
              onClick={() => handleSaveWord(item._id)}
            >
              {item.isSaved ? "saved" : "save"}
            </button>
          ) : (
            <button
              className="btn"
              onClick={() => handleDeleteSavedWord(item._id)}
            >
              delete
            </button>
          )
        ) : null,
    },
  ];
  return isLoading ? (
    <Loading></Loading>
  ) : (
    <div className="vocabulary-page">
      <h1 className="page-title">Vocabulary</h1>
      <header>
        <Table
          style={{
            display: "flex",
            flex: 1,
            margin: 10,
            justifyContent: "center",
          }}
          rowClassName={() => "editable-row"}
          columns={columns}
          dataSource={dataSource}
        ></Table>
      </header>
    </div>
  );
};
