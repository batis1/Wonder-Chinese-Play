import React, { useState, memo } from "react";
import { ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";
import apiList from "../../lib/apiList";

export const WorkbookPage = memo(function WorkbookPage({ volume, page, description, caption }) {
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState(false);
  return <figure className="workbook-scan">
    <figcaption className="workbook-scan-toolbar"><span>{caption || `PDF page ${page}`}</span><button type="button" aria-label={zoomed ? "Fit workbook page" : "Enlarge workbook page"} title={zoomed ? "Fit workbook page" : "Enlarge workbook page"} aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>{zoomed ? <ZoomOutOutlined /> : <ZoomInOutlined />}</button></figcaption>
    <div className={`workbook-print-frame ${zoomed ? "is-zoomed" : ""}`} tabIndex={zoomed ? 0 : undefined} role={zoomed ? "region" : undefined} aria-label={zoomed ? "Enlarged workbook page. Scroll to read." : undefined}>
      <img src={`${apiList.workbook}/${volume}/${page}.webp`} alt={description} onError={() => setFailed(true)} loading="lazy" />
    </div>
    {failed && <p role="alert">The scanned page could not load. <a href={`${apiList.workbook}/book/${volume}#page=${page}`} target="_blank" rel="noreferrer">Open the original workbook</a>.</p>}
  </figure>;
});
