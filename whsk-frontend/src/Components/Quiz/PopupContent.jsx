import React from "react";

export const PopupContent = ({ pinyin, translation }) => {
  return (
    <div>
      <p>{pinyin}</p>
      <p>{translation}</p>
    </div>
  );
};
