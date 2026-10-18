import React, { lazy, Suspense, useEffect, useState } from "react";
import { Redirect, useLocation, useRouteMatch } from "react-router-dom";
import apiList from "../../lib/apiList";
import Loading from "../Loading/Loading";
import { CoursePath } from "./WorkbookPath";
import { readProgress } from "./workbookProgress";
import { cachedGet, peekCachedGet } from "../../lib/cachedGet";
import "./WorkbookPath.css";
const WorkbookExercise = lazy(() => import('./WorkbookExercise').then(module => ({ default: module.WorkbookExercise })));

export const Tutorial = ({ user }) => {
  const [course, setCourse] = useState(() => peekCachedGet(apiList.workbook) || null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const match = useRouteMatch("/tutorial/:lesson/:activity");
  const location = useLocation();
  let sessionUser;
  try { sessionUser = JSON.parse(sessionStorage.getItem("currentUser")); } catch { /* A missing session is handled below. */ }
  const account = user || sessionUser;
  const userId = account?._id || account?.id || account?._doc?._id;
  const storageKey = `whsk:hsk5:workbook:v1:${userId || "guest"}`;
  const [progress, setProgress] = useState(() => readProgress(storageKey));
  const [storageError, setStorageError] = useState("");

  useEffect(() => { setProgress(readProgress(storageKey)); }, [storageKey]);
  useEffect(() => {
    let active = true;
    setError("");
    cachedGet(apiList.workbook, 300000)
      .then(data => { if (!data.sections?.length) throw new Error(); if (active) setCourse(data); })
      .catch(() => { if (active) setError("The workbook could not be loaded. Please try again."); });
    return () => { active = false; };
  }, [retry]);

  const saveProgress = next => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setProgress(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError("Your browser could not save this attempt. Free some browser storage and try again before leaving.");
      return false;
    }
  };

  if (!account) return <Redirect to="/login" />;
  if (error) return <div className="workbook-error" role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Try again</button></div>;
  if (!course) return <Loading />;
  return <>
    {storageError && <p className="workbook-storage-error" role="alert">{storageError}</p>}
    {match
      ? <Suspense fallback={<Loading />}><WorkbookExercise key={`${match.params.lesson}-${match.params.activity}`} course={course} progress={progress} saveProgress={saveProgress} lessonNumber={Number(match.params.lesson)} activityKey={match.params.activity} /></Suspense>
      : <CoursePath course={course} progress={progress} saveProgress={saveProgress} overview={location.pathname === "/tutorial/sections"} />}
  </>;
};
