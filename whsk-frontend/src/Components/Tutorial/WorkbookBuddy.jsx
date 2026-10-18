import React, { memo, useEffect, useRef } from "react";
import { observeMotion } from "../../lib/visibleMotion";

// Original notebook character. Separate groups keep all motion on transforms.
export const WorkbookBuddy = memo(function WorkbookBuddy({ celebrating = false }) {
  const ref = useRef(null);
  useEffect(() => observeMotion(ref.current), []);
  return <div ref={ref} className={`workbook-buddy ${celebrating ? "is-celebrating" : ""}`} aria-hidden="true">
  <svg viewBox="0 0 170 180" focusable="false">
    <ellipse className="buddy-shadow" cx="85" cy="164" rx="46" ry="10" fill="#eeece8" />
    <g className="buddy-body">
      <path d="M49 130 36 150Q33 160 45 158L64 143M107 136 124 151Q135 159 137 150L122 128" fill="#6a9a8a" />
      <path className="buddy-hand" d="M125 73Q153 61 150 43Q147 32 141 43L138 57 121 64" fill="#ffd25f" />
      <path d="M41 85Q19 80 21 66Q23 58 29 65L44 71" fill="#ffd25f" />
      <path d="M44 27 115 19Q132 17 135 37L145 121Q146 137 130 139L57 149Q40 150 38 133L27 47Q25 30 44 27" fill="#d88143" />
      <path d="M48 23 114 16Q130 15 132 32L143 116Q145 130 130 132L59 142Q45 143 43 128L31 44Q29 26 48 23" fill="#ffb67e" />
      <path d="M47 27 61 140M112 17 119 54 108 47 99 57 94 19" fill="#6a9a8a" />
      <path d="M50 36 57 97" stroke="#ffd5b3" strokeWidth="4" strokeLinecap="round" />
      <g className="buddy-eyes" fill="#363537"><ellipse cx="77" cy="73" rx="5" ry="8" /><ellipse cx="108" cy="69" rx="5" ry="8" /></g>
      <path d="M85 88Q96 102 107 85" fill="#fff" stroke="#363537" strokeWidth="3" strokeLinejoin="round" />
      <path d="m77 117 15-3m-4-6 3 15m14-13 12-2" stroke="#fff3df" strokeWidth="4" strokeLinecap="round" />
    </g>
    <path className="buddy-spark" d="m149 18 2 9 9 2-9 3-2 9-3-9-9-3 9-2Z" fill="#f4c64e" />
  </svg>
</div>;
});
