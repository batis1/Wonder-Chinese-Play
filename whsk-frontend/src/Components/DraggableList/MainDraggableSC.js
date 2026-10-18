import styled from "styled-components";

export const MainWrapper = styled.div`
  .header {
    margin-bottom: 30px;
  }

  ul {
    display: flex;
    gap: 20px;
  }
  ul,
  li {
    list-style-type: none;
  }

  .draggable-list__item {
    padding: 10px 0;
    border-top: 2px solid transparent;
  }

  .draggable-list__item * {
    pointer-events: none;
  }

  .draggable-list__item.dragstart {
    opacity: 0.5;
  }

  .draggable-list__item.dragover {
    border-top-color: green;
  }

  .card {
    background-color: var(--card-bg);
    border-radius: 10px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .card__img {
    width: 50px;
    margin-right: 20px;
  }

  .card__img img {
    width: 100%;
  }
`;
