export const Avatar = (props: { name: string }) => {
  const { name } = props;
  return (
    <div className="center-content">
      <div className="avatar">{name == "" ? "U" : name.charAt(0)}</div>
      <div style={{ color: "white" }}>{name}</div>
    </div>
  );
};

export const Calling = (props: {
  type: "caller" | "receiver";
  callingStatus: "calling" | "payment-required";
  participantLength?: number;
}) => {
  const { type, callingStatus: callingState, participantLength } = props;
  return (
    <div className="center-content">
      <p className="calling">
        {callingState === "payment-required"
          ? "Recharge to continue"
          : type == "caller" && participantLength === 1
          ? "Calling"
          : "Connecting"}
        <span className="letter">.</span>
        <span className="letter">.</span>
        <span className="letter">.</span>
      </p>
    </div>
  );
};

export const CallEnd = () => {
  return (
    <div className="center-content">
      <p>Call End</p>
    </div>
  );
};
