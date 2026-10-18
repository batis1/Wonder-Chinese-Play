import React, { useEffect, useRef, useState } from "react";
import { Link, Redirect, useHistory } from "react-router-dom";
import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined, BookOutlined, SoundOutlined, CloseOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import apiList from "../../lib/apiList";
import { cachedGet, peekCachedGet } from "../../lib/cachedGet";
import { isAvailable, saveAttempt } from "./workbookProgress";
import { activityUrl } from "./WorkbookPath";
import { WorkbookBuddy } from "./WorkbookBuddy";
import { assessAnswer, summarizeAssessment } from "./workbookAssessment";

function AnswerFeedback({ result, question, source }) {
  const Icon = result.status === "correct" ? CheckCircleOutlined : result.status === "incorrect" ? CloseCircleOutlined : InfoCircleOutlined;
  return <section id="workbook-answer-feedback" className={`workbook-answer-feedback is-${result.status}`} role="status" aria-live="polite" aria-atomic="true">
    <h3><Icon /> {result.status === "correct" ? question.type === "sentence" ? "Matches the reference" : "Correct!" : result.status === "incorrect" ? "Correct answer" : result.status === "review" ? "Compare with the reference" : "Writing review"}</h3>
    {result.correct && <p lang="zh">{result.correct} · {question.options.find(option => option.id === result.correct)?.text}</p>}
    {result.references && <ul lang="zh">{result.references.map(reference => <li key={reference}>{reference}</li>)}</ul>}
    {result.status === "self-review" && <><p>{result.characters} characters · About {question.targetLength} requested</p><p>{result.missingWords.length ? <>Still to include: <span lang="zh">{result.missingWords.join("、")}</span></> : "All required words used."}</p><p>The source omits a model paragraph (略). Review grammar and meaning yourself.</p></>}
    <a href={`${apiList.workbook}/answers/${source.volume}#page=${source.answerPage}`} target="_blank" rel="noreferrer">Source answers <BookOutlined /></a>
  </section>;
}

function ReadingPassage({ question, questions, answers }) {
  if (!question.passage) return null;
  return <div className="workbook-reading-passage" lang="zh">
    {question.illustrations?.map(image => <img key={image.src} className="workbook-passage-illustration" src={`${apiList.workbook}/${image.src}`} alt={image.alt} />)}
    {question.passage.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph.split(/\[\[(\d+)\]\]/g).map((part, position) => {
      if (position % 2 === 0) return part;
      const selected = questions[part]?.options?.find(option => option.id === answers[part]);
      return <span key={position} className={`workbook-cloze-blank ${Number(part) === question.number ? "is-current-blank" : ""}`} aria-label={`Blank ${part}${selected ? `: ${selected.text}` : ""}`}>{selected?.text || part}</span>;
    })}</p>)}
  </div>;
}

export function WorkbookExercise({ course, progress, saveProgress, lessonNumber, activityKey }) {
  const history = useHistory();
  const lessons = course.sections.flatMap(section => section.lessons);
  const lesson = lessons.find(item => item.number === lessonNumber);
  const activity = lesson?.activities.find(item => item.id === `${lessonNumber}-${activityKey}`);
  const prior = progress.activities[activity?.id];
  const url = `${apiList.workbook}/lesson/${lessonNumber}?answers=1`;
  const [content, setContent] = useState(() => peekCachedGet(url) || null);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [answers, setAnswers] = useState(prior?.answers || {});
  const [checkedAnswers, setCheckedAnswers] = useState(prior?.checkedAnswers || {});
  const [cursor, setCursor] = useState(() => Math.max(0, (activity?.questions || []).findIndex(number => !prior?.answers?.[number]?.trim())));
  const [submitted, setSubmitted] = useState(false);
  const [validation, setValidation] = useState("");
  const [audioError, setAudioError] = useState(false);
  const heading = useRef(null);
  const footer = useRef(null);
  const finishedBefore = Boolean(prior?.finished);
  const number = activity?.questions[cursor];
  const question = content?.questions[number];
  const checked = Boolean(answers[number]?.trim() && checkedAnswers[number] === answers[number]);

  useEffect(() => {
    let active = true;
    setLoadError("");
    cachedGet(url, 300000).then(data => {
      if (data.lesson !== lessonNumber || !data.questions || !data.answerKey || !data.answerSource || !Array.from({ length: 32 }, (_, position) => position + 1).every(item => data.questions[item]?.number === item && data.answerKey[item])) throw new Error();
      if (active) setContent(data);
    }).catch(() => { if (active) setLoadError("The workbook questions could not be loaded."); });
    return () => { active = false; };
  }, [url, lessonNumber, retry]);
  useEffect(() => {
    if (question && !submitted) {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [question, submitted]);
  useEffect(() => {
    if (checked && !submitted) footer.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [checked, question, submitted]);

  if (!lesson || !activity) return <div className="workbook-error"><h1>Activity not found</h1><Link to="/tutorial">Return to your path</Link></div>;
  if (!isAvailable(lesson, activity, progress)) return <Redirect to="/tutorial" />;
  const answered = activity.questions.filter(item => answers[item]?.trim()).length;
  const index = lesson.activities.findIndex(item => item.id === activity.id);
  const following = lesson.activities[index + 1];
  const nextLesson = lessons[lessons.findIndex(item => item.number === lesson.number) + 1];
  const last = cursor === activity.questions.length - 1;
  const result = checked && question && content.answerKey ? assessAnswer(question, content.answerKey[number], answers[number]) : null;
  const assessment = content?.answerKey ? summarizeAssessment(activity, content.questions, content.answerKey, answers) : null;
  const updateAnswer = value => {
    const next = { ...answers, [number]: value };
    const nextChecked = { ...checkedAnswers };
    delete nextChecked[number];
    setAnswers(next);
    setCheckedAnswers(nextChecked);
    setValidation("");
    saveProgress(saveAttempt(progress, lesson, activity, next, finishedBefore, { reviewMode: "answer-key", checkedAnswers: nextChecked }));
  };
  const chooseQuestion = next => { setValidation(""); setCursor(next); };
  const advance = event => {
    event.preventDefault();
    if (!answers[number]?.trim()) {
      setValidation(activity.kind === "writing" ? "Write your answer before continuing." : "Choose an answer before continuing.");
      return;
    }
    if (!checked) {
      const nextChecked = { ...checkedAnswers, [number]: answers[number] };
      setCheckedAnswers(nextChecked);
      setValidation("");
      saveProgress(saveAttempt(progress, lesson, activity, answers, finishedBefore, { reviewMode: "answer-key", checkedAnswers: nextChecked }));
      return;
    }
    if (!last) return chooseQuestion(cursor + 1);
    if (answered !== activity.questions.length) {
      setCursor(activity.questions.findIndex(item => !answers[item]?.trim()));
      setValidation("Answer every question before completing this activity.");
      return;
    }
    const unchecked = activity.questions.findIndex(item => checkedAnswers[item] !== answers[item]);
    if (unchecked >= 0) {
      setCursor(unchecked);
      setValidation("Check each answer before completing this activity.");
      return;
    }
    const next = saveAttempt(progress, lesson, activity, answers, true, { reviewMode: "answer-key", checkedAnswers, assessment });
    if (!following && nextLesson) next.currentLesson = nextLesson.number;
    if (saveProgress(next)) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  if (submitted) return <main className="hsk-workbook-exercise workbook-completed">
    <WorkbookBuddy celebrating /><h1>Practice saved</h1><p>Lesson {lesson.number} · {activity.title}</p>
    {assessment.total > 0 ? <p className="workbook-assessment-total">{assessment.correct} / {assessment.total} correct</p> : <p>{assessment.matchingSentences} sentences match the reference{assessment.sentencesToReview > 0 ? ` · ${assessment.sentencesToReview} to review` : ""} · Paragraph: self-review</p>}
    <details className="workbook-answer-reference"><summary>Review your answers</summary><ol className="workbook-result-list">{activity.questions.map(item => {
      const reviewed = assessAnswer(content.questions[item], content.answerKey[item], answers[item]);
      const key = content.answerKey[item];
      return <li key={item}><strong>Question {item} · {reviewed.status === "correct" ? "Correct" : reviewed.status === "incorrect" ? "Incorrect" : "Self-review"}</strong><p lang="zh">{key.kind === "choice" ? `${answers[item]} · ${content.questions[item].options.find(option => option.id === answers[item])?.text}` : answers[item]}</p>{key.kind === "choice" && reviewed.status === "incorrect" && <p lang="zh">Correct: {key.correct} · {content.questions[item].options.find(option => option.id === key.correct)?.text}</p>}{reviewed.references && <ul lang="zh">{reviewed.references.map(reference => <li key={reference}>{reference}</li>)}</ul>}{key.kind === "open" && <p>Model paragraph omitted in source (略).</p>}</li>;
    })}</ol></details>
    <p><a href={`${apiList.workbook}/answers/${content.answerSource.volume}#page=${content.answerSource.answerPage}`} target="_blank" rel="noreferrer">Original answers & transcript <BookOutlined /></a></p>
    <div className="workbook-completed-actions"><Link className="workbook-secondary" to="/tutorial">Back to path</Link>{(following || nextLesson) && <button className="workbook-primary" onClick={() => history.push(following ? activityUrl(lesson, following) : activityUrl(nextLesson, nextLesson.activities[0]))}>{following ? "Continue" : "Next lesson"} <ArrowRightOutlined /></button>}</div>
  </main>;

  return <main className="hsk-workbook-exercise workbook-question-page">
    <header className="workbook-exercise-heading"><Link to="/tutorial" aria-label="Save and return to learning path"><CloseOutlined /></Link><div><span>HSK 5 · LESSON {lesson.number}</span><h1 lang="zh">{lesson.title}</h1></div><span className="workbook-exercise-fraction">{cursor + 1} / {activity.questions.length}</span></header>
    <progress className="workbook-answer-progress" value={answered} max={activity.questions.length} aria-label="Questions answered" />
    <div className="workbook-exercise-meta"><h2>{activity.title}</h2><a href={`${apiList.workbook}/book/${lesson.volume}#page=${activity.pages[0]}`} target="_blank" rel="noreferrer"><BookOutlined /> Original workbook</a></div>
    {activity.audioFile && <div className="workbook-audio"><SoundOutlined /><audio controls preload="metadata" src={`${apiList.workbook}/audio/${lesson.volume}/${activity.audioFile}`} onError={() => setAudioError(true)} aria-label={`Lesson ${lesson.number}, ${activity.title} audio`} /><label>Speed <select defaultValue="1" aria-label="Audio playback speed" onChange={event => { const audio = event.currentTarget.closest(".workbook-audio").querySelector("audio"); audio.playbackRate = Number(event.target.value); }}><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option></select></label>{audioError && <p role="alert">Audio could not be loaded. <a href={`${apiList.workbook}/audio/${lesson.volume}/${activity.audioFile}`} target="_blank" rel="noreferrer">Open audio</a></p>}</div>}
    {loadError ? <div className="workbook-error" role="alert"><p>{loadError}</p><button onClick={() => setRetry(value => value + 1)}>Try again</button></div> : !question ? <p className="workbook-question-loading" role="status">Loading question…</p> : <form className="workbook-response-form workbook-single-question" onSubmit={advance}>
      <div className="workbook-question-toolbar"><label><span className="workbook-visually-hidden">Question</span><select aria-label="Question" value={cursor} onChange={event => chooseQuestion(Number(event.target.value))}>{activity.questions.map((item, position) => <option key={item} value={position}>Question {item}</option>)}</select></label><span className="workbook-response-status" aria-live="polite">{answered} / {activity.questions.length} answered</span></div>
      <h2 className="workbook-question-prompt" ref={heading} tabIndex={-1} lang="zh">{question.prompt || question.instruction}</h2>
      {question.prompt && <p className="workbook-question-instruction" lang="zh">{question.instruction}</p>}
      <ReadingPassage question={question} questions={content.questions} answers={answers} />
      {!question.passage && question.illustrations?.map(image => <img key={image.src} className="workbook-writing-illustration" src={`${apiList.workbook}/${image.src}`} alt={image.alt} />)}
      {question.wordBank?.length > 0 && <div className="workbook-word-bank" aria-label="Words from the workbook" lang="zh">{question.wordBank.map((word, position) => question.type === "sentence" ? <button key={position} type="button" onClick={() => updateAnswer((answers[number] || "") + word)}>{word}</button> : <span key={position}>{word}</span>)}</div>}
      <fieldset data-question={number} aria-describedby={result ? "workbook-answer-feedback" : validation ? "workbook-answer-validation" : undefined}><legend className="workbook-visually-hidden">Question {number}</legend>{activity.kind === "writing" ? <><label className="workbook-writing-label" htmlFor={`answer-${number}`}>{question.type === "composition" ? "Your paragraph" : "Your sentence"}</label><textarea id={`answer-${number}`} value={answers[number] || ""} onChange={event => updateAnswer(event.target.value)} rows={question.type === "composition" ? 6 : 3} lang="zh" />{question.type === "composition" && <span className="workbook-character-count">{(answers[number] || "").replace(/\s/g, "").length} / {question.targetLength} characters</span>}</> : <div className="workbook-text-options">{question.options.map(option => <label key={option.id} className={result && option.id === result.correct ? "is-correct-answer" : result?.status === "incorrect" && answers[number] === option.id ? "is-incorrect-answer" : answers[number] === option.id ? "is-selected" : ""}><input type="radio" name={`question-${number}`} value={option.id} checked={answers[number] === option.id} onChange={() => updateAnswer(option.id)} /><span className="workbook-option-letter">{option.id}</span><span lang="zh">{option.text}</span></label>)}</div>}</fieldset>
      {validation && <p id="workbook-answer-validation" role="alert" className="workbook-validation">{validation}</p>}
      {result && <AnswerFeedback result={result} question={question} source={content.answerSource} />}
      <div ref={footer} className="workbook-question-footer"><button type="button" className="workbook-secondary" disabled={cursor === 0} onClick={() => chooseQuestion(cursor - 1)}><ArrowLeftOutlined /> Previous</button><button type="submit" className="workbook-primary">{!result || last ? <CheckOutlined /> : null}{!result ? question.type === "composition" ? "Review writing" : "Check answer" : last ? "Save practice" : "Continue"}{result && !last && <ArrowRightOutlined />}</button></div>
    </form>}
  </main>;
}
