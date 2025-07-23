import type { MediaDevice, VideoClient } from "@zoom/videosdk";
import Image from "next/image";
import { useState } from "react";

export const VideoButton = (props: {
  client: React.RefObject<typeof VideoClient>;
  isVideoMuted: boolean;
  renderVideo: (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => Promise<void>;
}) => {
  const { client, isVideoMuted, renderVideo } = props;
  const onCameraClick = async () => {
    if (isVideoMuted) {
      const mediaStream = client.current.getMediaStream();
      await mediaStream.startVideo();
      await renderVideo({
        action: "Start",
        userId: client.current.getCurrentUserInfo().userId,
      });
    } else {
      const mediaStream = client.current.getMediaStream();
      await mediaStream.stopVideo();
      await renderVideo({
        action: "Stop",
        userId: client.current.getCurrentUserInfo().userId,
      });
    }
  };
  return (
    <button className="button" onClick={onCameraClick}>
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
    <button className="button" onClick={onAudioClick}>
      {isAudioMuted ? (
        <Image src="/mic-off.svg" alt={"mic-off.svg"} width={30} height={30} />
      ) : (
        <Image src="/mic-on.svg" alt={"mic-on.svg"} width={30} height={30} />
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
    <button className="call-end" onClick={onCallClick}>
      <Image src="/call.svg" alt={"call.svg"} width={30} height={15} />
    </button>
  );
};

export const SpeakerButton = (props: {
  list: MediaDevice[];
  active: string;
  setActive: (id: string) => void;
}) => {
  const { list, active, setActive } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative", height: "50px", width: "50px" }}>
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          bottom: 0,
        }}
      >
        {isOpen ? (
          list.map((s) => (
            <button
              className="button"
              color="white"
              key={s.deviceId}
              onClick={() => {
                setActive(s.deviceId);
                setIsOpen(false);
              }}
            >
              {s.label.charAt(0) ?? "s"}
            </button>
          ))
        ) : (
          <button
            className="button"
            onClick={() => (list.length > 1 ? setIsOpen(true) : null)}
          >
            {list.filter((s) => s.deviceId === active)[0]?.label?.charAt(0) ??
              "S"}
          </button>
        )}
      </div>
    </div>
  );
};

export const SwitchCamera = (props: {
  cameraList: MediaDevice[];
  selectedCamera: string;
  setActive: (id: string) => void;
}) => {
  const { cameraList, selectedCamera, setActive } = props;
  const onclick = (cameraList: MediaDevice[], selectedCamera: string) => {
    if (cameraList[0].deviceId == selectedCamera) {
      setActive(cameraList[1].deviceId);
    } else {
      setActive(cameraList[0].deviceId);
    }
  };
  return (
    <button
      className="switch-camera"
      onClick={() => onclick(cameraList, selectedCamera)}
    >
      &#x21ba;
    </button>
  );
};
