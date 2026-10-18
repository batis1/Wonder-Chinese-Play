import React from "react";

export default function FontIcon({ icon }) {
  const [width, height, , , d] = icon.icon;
  return <svg className="whsk-icon" viewBox={`0 0 ${width} ${height}`} style={{ width: `${width / height}em` }} aria-hidden="true" focusable="false"><path d={d} /></svg>;
}
