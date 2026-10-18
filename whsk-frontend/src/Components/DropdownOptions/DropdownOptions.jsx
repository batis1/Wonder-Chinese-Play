import React, { useContext, useEffect, useState } from "react";

import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { actions, GlobalContext } from "../../App";

export const DropdownOptions = ({ className, options, setOptionIndex }) => {
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);

  useEffect(() => {
    setOptionIndex && setOptionIndex(currentOptionIndex);
  }, [currentOptionIndex]);

  const { dispatch } = useContext(GlobalContext);

  return (
    <div
      style={{ display: "flex", justifyContent: "center" }}
      className={className}
    >
      <Dropdown
        overlay={
          <Menu>
            {options.map(({ value, to }, index) =>
              to ? (
                <Link to={to}>
                  <Menu.Item
                    key={index}
                    onClick={() => {
                      dispatch({
                        type: actions.SET_LESSON_PARAMS,
                        payload: { level: "", isGame: true },
                      });
                      setCurrentOptionIndex(index);
                    }}
                  >
                    {value}
                  </Menu.Item>
                </Link>
              ) : (
                <Menu.Item
                  key={index}
                  onClick={() => setCurrentOptionIndex(index)}
                >
                  {value}
                </Menu.Item>
              )
            )}
          </Menu>
        }
        trigger={["click"]}
      >
        <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
          {options[currentOptionIndex].value} <DownOutlined />
        </a>
      </Dropdown>
    </div>
  );
};
