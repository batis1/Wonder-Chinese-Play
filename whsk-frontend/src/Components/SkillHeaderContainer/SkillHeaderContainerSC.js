import styled from "styled-components";

export const MainWrapper = styled.div`
  .skill-header-container {
    z-index: 200;
  }

  .skill-header-content-frame {
    height: 80px;
    padding-top: 40px;
    padding: 50px 40px 0;
    display: flex;
    height: 40px;
    margin: auto;
    max-width: 10000px;
    position: relative;
    margin-bottom: 50px;
  }

  .skill-x-button {
    left: 40px;
    position: absolute;
    background-position: -373px -153px;
    height: 18px;
    width: 18px;
    background-image: url(/images/icon-sprite8.svg);
    display: inline-block;
    vertical-align: middle;
  }

  .skill-progress-button {
    flex-grow: 1;
  }

  .skill-progress-container-anon {
    margin: 0 0 0 40px;
    position: relative;
  }

  .skill-progress-container {
    border-radius: 98px;
    height: 16px;
    background: #e5e5e5;
    position: absolute;
    width: 100%;
  }

  .skill-progress-green {
    opacity: 0;
    width: 0%;
    background: #ffd900;
    min-width: 16px;
    position: relative;
    transition: all 0.5s;
    z-index: 1;
    border-radius: 98px;
    height: 16px;
  }
`;

export const SkillProgressGreen = styled.div`
  opacity: 1;
  width: ${({ widthP }) => widthP};

  /* opacity: 0;
  width: 0%; */
  background: #ffd900;
  min-width: 16px;
  position: relative;
  transition: all 0.5s;
  z-index: 1;
  border-radius: 98px;
  height: 16px;

  &::after {
    background: #fff;
    border-radius: 98px;
    content: "";
    display: block;
    height: 5px;
    margin: 0 10px 0 15px;
    opacity: 0.2;
    transform: translate3d(0, 4px, 0);
  }
`;
