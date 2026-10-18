import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { Modal } from "antd";
import { ArrowLeftOutlined, BookOutlined, CheckOutlined, DownOutlined, EditOutlined, SoundOutlined, TrophyFilled, ArrowRightOutlined } from "@ant-design/icons";
import apiList from "../../lib/apiList";
import { nextActivity, isAvailable } from "./workbookProgress";
import { WorkbookBuddy } from "./WorkbookBuddy";
import { WorkbookChest, WorkbookSections } from "./WorkbookSections";
import { preloadLesson } from "../../lib/routePreload";

export const activityUrl = (lesson, activity) => `/tutorial/${lesson.number}/${activity.id.substring(String(lesson.number).length + 1)}`;

export function CoursePath({ course, progress, saveProgress, overview = false }) {
  const history = useHistory();
  const lessons = course.sections.flatMap(section => section.lessons);
  const currentLesson = lessons.find(lesson => lesson.number === progress.currentLesson) || lessons[0];
  const [sectionNumber, setSectionNumber] = useState(Math.ceil(currentLesson.number / 3));
  const section = course.sections.find(item => item.number === sectionNumber) || course.sections[0];
  const [visibleLesson, setVisibleLesson] = useState(section.lessons[0].number);
  const [scrollLesson, setScrollLesson] = useState(overview ? null : currentLesson.number);
  const [guideLesson, setGuideLesson] = useState(null);
  const [selected, setSelected] = useState(null);
  const popupRef = useRef(null);
  const sectionTrigger = useRef(null);
  const guide = section.lessons.find(lesson => lesson.number === visibleLesson) || section.lessons[0];

  useEffect(() => { setSelected(null); }, [overview, sectionNumber]);
  useEffect(() => {
    if (overview || scrollLesson === null) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(`workbook-lesson-${scrollLesson}`);
      target?.scrollIntoView({ block: "start", behavior: "auto" });
      setScrollLesson(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [overview, sectionNumber, scrollLesson]);
  useEffect(() => {
    if (overview) return;
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = (document.querySelector(".workbook-section-bar")?.getBoundingClientRect().bottom || 120) + 60;
        const active = [...section.lessons].reverse().find(lesson => document.getElementById(`workbook-lesson-${lesson.number}`)?.getBoundingClientRect().top <= top);
        setVisibleLesson(active?.number || section.lessons[0].number);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [overview, section]);

  useEffect(() => {
    if (!selected) return;
    const close = event => {
      if (event.key === "Escape" || (event.type === "pointerdown" && !event.target.closest(".workbook-node-wrap"))) {
        if (event.key === "Escape") document.getElementById(`path-button-${selected.activity.id}`)?.focus({ preventScroll: true });
        setSelected(null);
      }
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    popupRef.current?.focus({ preventScroll: true });
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [selected]);

  const jumpToCurrent = () => {
    setSectionNumber(Math.ceil(currentLesson.number / 3));
    setVisibleLesson(currentLesson.number);
    setScrollLesson(currentLesson.number);
  };
  const showSections = () => history.push("/tutorial/sections");
  const selectLesson = (targetSection, lesson) => {
    setSectionNumber(targetSection.number);
    setVisibleLesson(lesson.number);
    setScrollLesson(lesson.number);
    history.push("/tutorial");
  };
  const backToPath = () => { history.push("/tutorial"); requestAnimationFrame(() => sectionTrigger.current?.focus({ preventScroll: true })); };
  const offsets = [0, -40, -63, -40, 0, 40];

  return <main className="hsk-path-page">
    <div className="workbook-path-column">
      {overview ? <WorkbookSections course={course} progress={progress} currentLesson={currentLesson} onBack={backToPath} onSelect={selectLesson} /> : <>
      <h1 className="workbook-visually-hidden">HSK 5</h1>
      <div className="workbook-section-bar">
        <button ref={sectionTrigger} className="workbook-section-label" aria-label={`All sections, section ${section.number}, lesson ${guide.number}`} onClick={showSections}><span><ArrowLeftOutlined /> SECTION {section.number}, LESSON {guide.number}</span><strong lang="zh">{guide.title}</strong></button>
        <button className="workbook-guide-button" aria-label={`Guidebook for lesson ${guide.number}`} onClick={() => setGuideLesson(guide)}><BookOutlined /> <span>Guidebook</span></button>
      </div>
      {section.lessons.map(lesson => {
        const done = lesson.activities.filter(item => progress.activities[item.id]?.finished).length;
        const active = nextActivity(lesson, progress);
        return <section className="workbook-lesson" key={lesson.number} id={`workbook-lesson-${lesson.number}`} aria-labelledby={`lesson-title-${lesson.number}`}>
          <div className={`workbook-lesson-heading ${lesson.number === section.lessons[0].number ? "workbook-visually-hidden" : ""}`}><span /><h2 id={`lesson-title-${lesson.number}`} lang="zh">{lesson.title}</h2><span /></div>
          <div className="workbook-winding-path">
            {lesson.activities.map((activity, index) => {
              const completed = Boolean(progress.activities[activity.id]?.finished);
              const available = isAvailable(lesson, activity, progress);
              const current = !completed && lesson.number === currentLesson.number && activity.id === active.id;
              const open = selected?.activity.id === activity.id;
              const Icon = completed ? CheckOutlined : activity.kind === "listening" ? SoundOutlined : activity.kind === "writing" ? EditOutlined : null;
              return <React.Fragment key={activity.id}><div className={`workbook-node-wrap ${open ? "is-open" : ""}`} style={{ "--node-offset": `${offsets[index]}px` }}>
                <button id={`path-button-${activity.id}`} className={`workbook-path-node ${completed ? "is-complete" : current ? "is-available" : "is-locked"} ${current ? "is-current" : ""}`} aria-label={`Lesson ${lesson.number}: ${activity.title}${completed ? ", completed" : !available ? ", locked" : ""}`} aria-expanded={open} aria-controls={open ? `activity-popup-${activity.id}` : undefined} onPointerEnter={() => available && preloadLesson(lesson.number)} onFocus={() => available && preloadLesson(lesson.number)} onClick={() => { if (available) preloadLesson(lesson.number); setSelected(open ? null : { lesson, activity }); }}>
                  {Icon ? <Icon /> : <span className="workbook-hanzi-icon" lang="zh" aria-hidden="true">字</span>}
                </button>
                {index === 2 && <div className="workbook-path-companion"><WorkbookBuddy celebrating={done === 6} /></div>}
                {index === 5 && <div className="workbook-path-companion is-left"><WorkbookBuddy celebrating={done === 6} /></div>}
                {open && <div className="workbook-node-popup" id={`activity-popup-${activity.id}`} ref={popupRef} tabIndex={-1} role="dialog" aria-label={activity.title}>
                  <strong>{activity.title}</strong><p>{available ? `Questions ${activity.questions[0]}–${activity.questions[activity.questions.length - 1]}` : "Complete the previous activity to unlock this one."}</p>
                  {available && <button className="workbook-primary" onClick={() => { if (saveProgress({ ...progress, currentLesson: lesson.number })) history.push(activityUrl(lesson, activity)); }}>{completed ? "Practice again" : "Start lesson"} <ArrowRightOutlined /></button>}
                </div>}
              </div>{index === 4 && <div className="workbook-node-wrap workbook-checkpoint" style={{ "--node-offset": "40px" }}><WorkbookChest complete={lesson.activities.slice(0, 5).every(item => progress.activities[item.id]?.finished)} /></div>}</React.Fragment>;
            })}
            <div className="workbook-node-wrap workbook-review-node" style={{ "--node-offset": "0px" }}><button className={`workbook-path-node ${done === 6 ? "is-complete" : "is-locked"}`} aria-label={`Review lesson ${lesson.number}`} onClick={() => setGuideLesson(lesson)}><TrophyFilled /></button></div>
          </div>
        </section>;
      })}
      <button className="workbook-next-section" disabled={sectionNumber === course.sections.length} onClick={() => { const next = course.sections.find(item => item.number === sectionNumber + 1); if (next) selectLesson(next, next.lessons[0]); }}>Section {Math.min(sectionNumber + 1, course.sections.length)} <ArrowRightOutlined /></button>
      </>}
    </div>
    {!overview && <button className="workbook-return-current" aria-label="Return to current lesson" onClick={jumpToCurrent}><DownOutlined /></button>}
    <Modal className="workbook-guide-modal" open={Boolean(guideLesson)} title={guideLesson ? `Lesson ${guideLesson.number} · ${guideLesson.title}` : "Guidebook"} footer={null} onCancel={() => setGuideLesson(null)} width={760}>
      {guideLesson && <div className="workbook-guide-content"><p>HSK 5 Standard Course · {guideLesson.volume === "upper" ? "上册" : "下册"} · Pages {guideLesson.printedPage}–{guideLesson.printedPage + 6}</p><ul>{guideLesson.activities.map(activity => <li key={activity.id}>{activity.title}<span>{progress.activities[activity.id]?.finished ? <CheckOutlined aria-label="Completed" /> : "Not completed"}</span></li>)}</ul><a href={`${apiList.workbook}/book/${guideLesson.volume}#page=${guideLesson.firstPage}`} target="_blank" rel="noreferrer">Open original workbook <BookOutlined /></a>{guideLesson.answerSource && <p><a href={`${apiList.workbook}/answers/${guideLesson.volume}#page=${guideLesson.answerSource.firstPage}`} target="_blank" rel="noreferrer">Answers & transcript <BookOutlined /></a></p>}</div>}
    </Modal>
  </main>;
}
