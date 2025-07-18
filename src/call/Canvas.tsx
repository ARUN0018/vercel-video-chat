"use client";

import ZoomVideo, {
  ExecutedFailure,
  ParticipantPropertiesPayload,
  VideoPlayer,
  VideoQuality,
} from "@zoom/videosdk";
import { FunctionComponent, useEffect, useRef, useState } from "react";
import "./canvas.css"; // Assuming you have some styles for the video player
import { AudioButton, CallButton, VideoButton } from "../controls/buttons";
import { Avatar, CallEnd, Calling } from "../components/ui";

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
  const [callingState, setCallingState] = useState<
    "calling" | "in-call" | "call-end"
  >("calling");
  const [hostVideoMuted, setHostVideoMuted] = useState(true);
  const [hostAudioMuted, setHostAudioMuted] = useState(true);
  const [hostname, setHostname] = useState("");

  const [userVideoMuted, setUserVideoMuted] = useState(true);
  const [userAudioMuted, setUserAudioMuted] = useState(true);
  const [userName, setUsername] = useState("");

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
          const childNode = secondaryVideoRef.current.childNodes;
          for (const child of childNode) {
            child.remove();
          }
          secondaryVideoRef.current.appendChild(userVideo as VideoPlayer);
          setHostVideoMuted(false);
        } else {
          const childNode = mainVideoRef.current.childNodes;
          for (const child of childNode) {
            child.remove();
          }
          mainVideoRef.current.appendChild(userVideo as VideoPlayer);
          setUserVideoMuted(false);
          setCallingState("in-call");
        }
      }
    } else if (event.action === "Stop") {
      if (event.userId === zoomClient.current?.getCurrentUserInfo().userId) {
        setHostVideoMuted(true);
      } else {
        setUserVideoMuted(true);
      }
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

  const userAdded = (p: ParticipantPropertiesPayload[]) => {
    if (p[0].userId != zoomClient.current?.getCurrentUserInfo().userId) {
      setUsername(p[0].displayName ?? "");
    }
  };

  const userRemoved = (p: ParticipantPropertiesPayload[]) => {
    leaveSession();
  };

  const joinSession = async (
    sessionName: string,
    jwt: string,
    userName: string
  ) => {
    await zoomClient.current.init("en-US", "Global", { patchJsMedia: true });
    zoomClient.current.on("peer-video-state-change", renderVideo);

    await zoomClient.current.join(sessionName, jwt, userName);
    setHostname(userName);

    const stream = zoomClient.current.getMediaStream();
    await stream.startVideo();
    await stream.startAudio();
    setHostAudioMuted(false);
    await renderVideo({
      action: "Start",
      userId: zoomClient.current.getCurrentUserInfo().userId,
    });

    zoomClient.current.on("user-added", userAdded);
    zoomClient.current.on("user-removed", userRemoved);
  };

  const leaveSession = async () => {
    if (!zoomClient.current) return;
    renderVideo({
      action: "Stop",
      userId: zoomClient.current.getCurrentUserInfo().userId,
    });
    zoomClient.current.off("peer-video-state-change", renderVideo);
    await zoomClient.current.leave();
    setCallingState("call-end");
  };

  useEffect(() => {
    if (zoomClient.current) {
      window.videoController = {
        joinSessionWithToken,
        joinSession,
        leaveSession,
        zoomClient,
      };
    }
  }, []);

  return callingState === "call-end" ? (
    <CallEnd />
  ) : (
    <div className="canvas-container">
      <div id="main-video">
        {callingState === "calling" ? (
          <div>
            <Calling />
            <audio autoPlay loop>
              <source src={"/ringtone.mp3"} type="audio/mpeg" />
            </audio>
          </div>
        ) : null}
        {callingState === "in-call" && userVideoMuted ? (
          <Avatar name={userName} />
        ) : null}
        {/* @ts-expect-error html component */}
        <video-player-container ref={mainVideoRef} />
      </div>
      <div id="secondary-video">
        {hostVideoMuted ? <Avatar name={hostname} /> : null}
        {/* @ts-expect-error html component */}
        <video-player-container ref={secondaryVideoRef} />
      </div>
      {/* {inSession ? ( */}
      <div className="action-button">
        <VideoButton
          client={zoomClient}
          isVideoMuted={hostVideoMuted}
          renderVideo={renderVideo}
        />
        <CallButton action={leaveSession} />
        <AudioButton
          client={zoomClient}
          isAudioMuted={hostAudioMuted}
          setIsAudioMuted={setHostAudioMuted}
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
