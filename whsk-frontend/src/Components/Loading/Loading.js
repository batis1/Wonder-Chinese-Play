import "./Loading.css";

const Loading = () => {
  return (
    <div className="loading-container" style={{ height: "72vh" }}>
      <div className="loader-circle"></div>
      <p className="loading-text">Loading...</p>
    </div>
  );
};

export default Loading;
