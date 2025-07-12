import ZoomVideo, {
  ExecutedFailure,
  VideoPlayer,
  VideoQuality,
} from "@zoom/videosdk";
import { FunctionComponent, useEffect, useRef, useState } from "react";
import "./Canvas.css"; // Assuming you have some styles for the video player
import { AudioButton, CallButton, VideoButton } from "../controls/buttons";

// Allow usage of <video-player-container> as a custom element in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "video-player-container": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

declare global {
  interface Window {
    videoController?: Record<string, unknown>;
  }
}

const getToken = async (sessionName: string) => {
  const response = await fetch(`/token?session=${sessionName}`);
  if (!response.ok) {
    throw new Error("Failed to fetch token");
  }
  const data = await response.json();
  return data.token;
};

const Canvas: FunctionComponent = () => {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const zoomClient = useRef<ReturnType<typeof ZoomVideo.createClient>>(
    ZoomVideo.createClient()
  );
  const [inSession, setInSession] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(
    !zoomClient.current.getCurrentUserInfo()?.bVideoOn
  );
  console.log(`isVideo: ${!zoomClient.current.getCurrentUserInfo()?.bVideoOn}`);
  const [isAudioMuted, setIsAudioMuted] = useState(
    zoomClient.current.getCurrentUserInfo()?.muted ?? true
  );
  console.log(`isAudio:${zoomClient.current.getCurrentUserInfo()?.muted} `);
  const renderVideo = async (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => {
    const stream = zoomClient.current.getMediaStream();
    if (event.action === "Start") {
      const userVideo = await stream.attachVideo(
        event.userId,
        VideoQuality.Video_360P
      );
      if (userVideo && mainVideoRef.current && secondaryVideoRef.current) {
        if ((userVideo as ExecutedFailure).errorCode) {
          console.error(
            `Failed to attach video for user ${event.userId}: ${
              (userVideo as ExecutedFailure).errorCode
            }`
          );
          return;
        }

        if (event.userId === zoomClient.current?.getCurrentUserInfo().userId) {
          secondaryVideoRef.current.appendChild(userVideo as VideoPlayer);
        } else {
          mainVideoRef.current.appendChild(userVideo as VideoPlayer);
        }
      }
    } else if (event.action === "Stop") {
      const element = await stream.detachVideo(event.userId);
      if (element && mainVideoRef.current) {
        Array.isArray(element)
          ? element.forEach((el) => el.remove())
          : element.remove();
      }
    }
  };

  const joinSessionWithToken = async () => {
    const sessionName = "mysession-1"; // Replace with your session name
    const jwt = await getToken(sessionName);
    const userName = `User-${new Date().getTime().toString().slice(8)}`;
    await joinSession(sessionName, jwt, userName);
  };

  const joinSession = async (
    sessionName: string,
    jwt: string,
    userName: string
  ) => {
    zoomClient.current.init("en-US", "Global", { patchJsMedia: true });
    zoomClient.current.on("peer-video-state-change", renderVideo);

    await zoomClient.current.join(sessionName, jwt, userName);
    setInSession(true);

    const stream = zoomClient.current.getMediaStream();
    await stream.startVideo();
    setIsVideoMuted(!stream.isCapturingVideo());
    console.log(`capturing video: ${!stream.isCapturingVideo()}`);
    await stream.startAudio();
    setIsAudioMuted(stream.isAudioMuted());
    console.log(`audio muted: ${stream.isAudioMuted()}`);
    await renderVideo({
      action: "Start",
      userId: zoomClient.current.getCurrentUserInfo().userId,
    });
  };

  const leaveSession = async () => {
    if (!zoomClient.current) return;
    const stream = zoomClient.current.getMediaStream();
    stream.stopVideo();
    renderVideo({
      action: "Stop",
      userId: zoomClient.current.getCurrentUserInfo().userId,
    });
    zoomClient.current.off("peer-video-state-change", renderVideo);
    await zoomClient.current.leave();
  };

  useEffect(() => {
    if (zoomClient.current) {
      window.videoController = {
        joinSessionWithToken,
        joinSession,
        leaveSession,
      };
    }
  }, []);

  return (
    <div className="canvas-container">
      <div id="main-video">
        {/* @ts-expect-error html component */}
        <video-player-container ref={mainVideoRef} />
      </div>
      <div id="secondary-video">
        {/* @ts-expect-error html component */}
        <video-player-container ref={secondaryVideoRef} />
      </div>
      {/* {inSession ? ( */}
      <div className="icon">
        <VideoButton
          client={zoomClient}
          isVideoMuted={isVideoMuted}
          setIsVideoMuted={setIsVideoMuted}
          renderVideo={renderVideo}
        />
        <CallButton action={leaveSession} />
        <AudioButton
          client={zoomClient}
          isAudioMuted={isAudioMuted}
          setIsAudioMuted={setIsAudioMuted}
        />
        <button onClick={joinSessionWithToken}>join</button>
      </div>
      {/* ) : (
          <div></div>
        )} */}
    </div>
  );
};

export default Canvas;
