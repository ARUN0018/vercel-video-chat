import type { VideoClient } from "@zoom/videosdk";
import Image from "next/image";

export const VideoButton = (props: {
  client: React.RefObject<typeof VideoClient>;
  isVideoMuted: boolean;
  setIsVideoMuted: React.Dispatch<React.SetStateAction<boolean>>;
  renderVideo: (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => Promise<void>;
}) => {
  const { client, isVideoMuted, setIsVideoMuted, renderVideo } = props;
  const onCameraClick = async () => {
    if (isVideoMuted) {
      const mediaStream = client.current.getMediaStream();
      setIsVideoMuted(false);
      await mediaStream.startVideo();
      await renderVideo({
        action: "Start",
        userId: client.current.getCurrentUserInfo().userId,
      });
    } else {
      const mediaStream = client.current.getMediaStream();
      await mediaStream.stopVideo();
      setIsVideoMuted(true);
      await renderVideo({
        action: "Stop",
        userId: client.current.getCurrentUserInfo().userId,
      });
    }
  };
  return (
    <button
      className="video-button"
      style={{
        height: "50px",
        width: "50px",
        borderRadius: "50px",
      }}
      onClick={onCameraClick}
    >
      {isVideoMuted ? (
        <Image src="/video-off.svg" alt={""} width={30} height={30} />
      ) : (
        <Image src="/video-on.svg" alt={""} width={30} height={30} />
      )}
    </button>
  );
};

export const AudioButton = (props: {
  client: React.RefObject<typeof VideoClient>;
  isAudioMuted: boolean;
  setIsAudioMuted: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { client, isAudioMuted, setIsAudioMuted } = props;

  const onAudioClick = async () => {
    const mediaStream = client.current.getMediaStream();
    isAudioMuted
      ? await mediaStream.unmuteAudio()
      : await mediaStream.muteAudio();
    setIsAudioMuted(client.current.getCurrentUserInfo().muted ?? true);
  };
  return (
    <button
      className="audio-button"
      onClick={onAudioClick}
      style={{
        height: "50px",
        width: "50px",
        borderRadius: "50px",
      }}
    >
      {isAudioMuted ? (
        <Image src="/mic-off.svg" alt={""} width={30} height={30} style={{}} />
      ) : (
        <Image
          src="/mic-on.svg"
          alt={""}
          width={30}
          height={30}
          style={{ color: "red" }}
        />
      )}
    </button>
  );
};

export const CallButton = (props: { action: () => Promise<void> }) => {
  const { action } = props;

  const onCallClick = async () => {
    await action();
  };

  return (
    <button
      className="call-end"
      onClick={onCallClick}
      style={{
        backgroundColor: "red",
        height: "50px",
        width: "50px",
        borderRadius: "50px",
      }}
    >
      <Image
        src="/call.svg"
        alt={""}
        width={30}
        height={30}
        style={{ fill: "white" }}
      />
    </button>
  );
};
