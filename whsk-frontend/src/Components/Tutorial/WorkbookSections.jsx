import React, { useEffect, useRef, useState } from "react";
import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined, DownOutlined } from "@ant-design/icons";
import { WorkbookBuddy } from "./WorkbookBuddy";

export function WorkbookSections({ course, progress, currentLesson, onBack, onSelect }) {
  const [expanded, setExpanded] = useState(null);
  const heading = useRef(null);
  useEffect(() => { window.scrollTo(0, 0); heading.current?.focus({ preventScroll: true }); }, []);

  return <div className="workbook-sections-view">
    <div className="workbook-overview-heading">
      <button className="workbook-text-button" onClick={onBack}><ArrowLeftOutlined /> Back</button>
      <h1 ref={heading} tabIndex={-1}>HSK 5 sections</h1>
    </div>
    <div className="workbook-section-cards">
      {course.sections.map(section => {
        const activities = section.lessons.flatMap(lesson => lesson.activities);
        const done = activities.filter(activity => progress.activities[activity.id]?.finished).length;
        const percent = Math.round(done / activities.length * 100);
        const current = section.lessons.some(lesson => lesson.number === currentLesson.number);
        const complete = done === activities.length;
        const open = expanded === section.number;
        return <article key={section.number} className={`workbook-section-card ${current ? "is-current-section" : ""} ${complete ? "is-complete-section" : ""}`} aria-labelledby={`section-card-${section.number}`}>
          <div className="workbook-section-card-main">
            <div className="workbook-section-card-info">
              <button className="workbook-section-details" aria-expanded={open} aria-controls={`section-lessons-${section.number}`} onClick={() => setExpanded(open ? null : section.number)}>HSK 5 · See lessons <DownOutlined /></button>
              <h2 id={`section-card-${section.number}`}>Section {section.number}</h2>
              {(current || done > 0) ? <div className="workbook-section-progress">
                <progress aria-label={`Section ${section.number} progress`} max={activities.length} value={done} />
                <span>{percent}%</span><CheckOutlined aria-hidden="true" />
              </div> : <p className="workbook-section-count">{section.lessons.length} lessons · {activities.length} activities</p>}
              <button className={`workbook-section-enter ${current ? "is-primary" : ""}`} onClick={() => onSelect(section, current ? currentLesson : section.lessons.find(lesson => lesson.activities.some(activity => !progress.activities[activity.id]?.finished)) || section.lessons[0])}>{current ? "Continue" : `Go to section ${section.number}`} <ArrowRightOutlined /></button>
            </div>
            <div className="workbook-section-scene">
              <div className="workbook-section-speech"><strong lang="zh">{section.title}</strong></div>
              <WorkbookBuddy celebrating={complete} />
            </div>
          </div>
          {open && <ol className="workbook-section-lessons" id={`section-lessons-${section.number}`}>
            {section.lessons.map(lesson => {
              const finished = lesson.activities.filter(activity => progress.activities[activity.id]?.finished).length;
              return <li key={lesson.number}><button onClick={() => onSelect(section, lesson)}><span className="workbook-section-lesson-number">{lesson.number}</span><span lang="zh">{lesson.title}</span><small>{finished}/{lesson.activities.length}</small><ArrowRightOutlined /></button></li>;
            })}
          </ol>}
        </article>;
      })}
    </div>
  </div>;
}

export function WorkbookChest({ complete }) {
  return <div className={`workbook-chest ${complete ? "is-complete" : ""}`} role="img" aria-label={complete ? "Practice checkpoint completed" : "Practice checkpoint"}>
    <svg viewBox="0 0 100 90" focusable="false" aria-hidden="true">
      <ellipse cx="50" cy="80" rx="38" ry="7" fill="#ededed" />
      <path d="M17 34h66v44H17z" fill="var(--chest-dark)" />
      <path d="M13 28Q13 12 30 12h40q17 0 17 16v13H13z" fill="var(--chest-light)" />
      <path d="M17 43h66v27H17z" fill="var(--chest-front)" />
      <path d="M20 12h10v66H20zM70 12h10v66H70zM12 30h76v11H12zM16 69h68v9H16z" fill="var(--chest-trim)" />
      <rect x="41" y="32" width="18" height="22" rx="3" fill="var(--chest-trim)" />
      <path d="M54 40a4 4 0 1 0-6 3v5h4v-5a4 4 0 0 0 2-3" fill="var(--chest-dark)" />
    </svg>
  </div>;
}
