import { relative } from "path";

export const Avatar = (props: { name: string }) => {
  const { name } = props;
  return (
    <div className="center-content">
      <img
        src={"/avatar.svg"}
        style={{
          padding: "10px",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          position: "relative",
        }}
      />
      <div style={{ color: "white" }}>{name}</div>
    </div>
  );
};

export const Calling = () => {
  return (
    <div className="center-content">
      <p className="calling">
        Calling <span className="letter">.</span>
        <span className="letter">.</span>
        <span className="letter">.</span>
      </p>
    </div>
  );
};
