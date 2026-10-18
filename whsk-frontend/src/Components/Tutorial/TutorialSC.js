import styled from "styled-components";

export const MainWrapper = styled.div`
  border: 0 !important;
  /* margin-bottom: 30px; */
  padding: 0 0 24px;
  /* margin: 0 24px 24px; */
  margin-bottom: 75rem;
  .skill-tree {
    padding-bottom: 0;
    margin-top: 70rem;
  }

  .lessons-row-container {
    margin-bottom: 40px;
    text-align: center;
  }

  .lesson-anchor-box {
    width: 144px;
    color: #3c3c3c;
    display: inline-block;
    min-width: 100px;
    position: relative;
    text-align: center;
    vertical-align: top;
  }

  .lesson-progress-rings {
    left: calc(50% - 90px / 2);
    margin-left: -8px;
    top: -8px;
    z-index: 0;
    position: absolute;
    color: #999;
    display: inline-block;
    font-size: 15px;
    text-align: center;
    cursor: pointer;
  }

  svg.icon1 {
    overflow: hidden;
    position: relative;
    left: -0.934596px;
    top: -0.895924px;
  }

  .course-image-span-container {
    /* background: #ce82ff; */
    background: var(--darkerOrange);

    position: relative;
    height: 72px;
    width: 72px;
    border-radius: 98px;
    display: inline-block;
    margin: 8px 0 25px;
    cursor: pointer;
  }

  .bscs1 {
    background-position: 0 0px;
  }
  .course-image-span {
    display: inline-block;
    background-position: 0 0;
    background-size: 72px;
    height: 72px;
    width: 72px;
    background-image: url(/images/skills-purple.svg);
  }

  ._378Tf {
    color: #fff;
    font-size: 20px;
  }

  .course-crown-div {
    bottom: -20px;
    position: absolute;
    right: -24px;
    color: transparent;
    height: 50px;
    width: 50px;
  }
  .course-crown-image {
    color: transparent;
    height: 100%;
    width: 100%;
  }

  .grtngs {
    background-position: 0 -2160px;
  }

  .bscs2 {
    background-position: 0 -72px;
  }
  .LessonTitle {
    color: var(--lightAccent);
    font-size: 20px;
  }
`;

export const SkillModalSC = styled.div`
  margin-left: -55px;
  width: 250px;
  animation-duration: 0.3s;
  animation-name: L;
  border: 0 !important;
  color: #fff;
  cursor: default;
  margin-top: 20px;
  padding: 24px;
  -ms-transform-origin: center top;
  transform-origin: center top;
  z-index: 201;
  /* background: #ce82ff; */
  background: var(--darkerOrange);
  min-width: 200px;
  position: absolute;
  border-radius: 16px;
  display: ${({ isOpen }) => (isOpen ? "block" : "none")};

  &::after {
    border-bottom: 10px solid var(--darkerOrange) !important;
    left: 50% !important;
    top: -20px;
    -ms-transform: translateX(-50%);
    transform: translateX(-50%);
    border: 10px solid transparent;
    content: "";
    display: block;
    height: 0;
    position: absolute;
    width: 0;
  }

  .skm-start-btn-container {
    display: flex;
    -ms-flex-pack: center;
    justify-content: center;
    margin-top: 24px;
  }

  button {
    outline: none;
  }
  .skm-start-btn {
    /* color: #ce82ff; */
    color: var(--darkerOrange);
    border-width: 0 0 4px;
    padding: 13px 16px;
    font-size: 15px;
    line-height: 20px;
    display: inline-block;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
    border-radius: 16px;
    border-style: solid;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    border-color: #e8c2ff;
    flex-grow: 1;
  }
`;
