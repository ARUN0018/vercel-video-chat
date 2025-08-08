"use client";

import ZoomVideo, {
  ConnectionChangePayload,
  ExecutedFailure,
  MediaDevice,
  ParticipantPropertiesPayload,
  VideoPlayer,
  VideoQuality,
} from "@zoom/videosdk";
import { FunctionComponent, useEffect, useRef, useState } from "react";
import "./canvas.css"; // Assuming you have some styles for the video player
import {
  AudioButton,
  CallButton,
  SwitchCamera,
  VideoButton,
} from "../controls/buttons";
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
    Handler?: { postMessage: (data: string) => void };
  }
}

class FlutterNotification {
  private static _postMessage(data: string) {
    if (window.Handler?.postMessage) {
      window.Handler.postMessage(data);
    }
  }

  static ready() {
    this._postMessage(JSON.stringify({ type: "ready" }));
  }

  static leaveSession() {
    this._postMessage(JSON.stringify({ type: "leaveSession" }));
  }

  static participantJoin() {
    this._postMessage(JSON.stringify({ type: "participantJoin" }));
  }
}

const Canvas: FunctionComponent<{ type: "caller" | "receiver" }> = ({
  type,
}) => {
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
  const [hostCameraList, setHostCameraList] = useState<MediaDevice[]>([]);
  const [hostSelectedCamera, setHostSelectedCamera] = useState<string>("");
  const [warningMessage, setWarningMessage] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [videoCall, setVideoCall] = useState(false);
  const showControlsTimeout = useRef<ReturnType<typeof setTimeout>>(null);

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
          secondaryVideoRef.current.querySelector("video")?.play();
          setHostVideoMuted(false);
          console.log(`Host video status ${hostVideoMuted}`);
          console.log(`Host video started for user ${event.userId}`);
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

  const userAdded = (p: ParticipantPropertiesPayload[]) => {
    if (p[0].userId != zoomClient.current?.getCurrentUserInfo().userId) {
      setUsername(p[0].displayName ?? "");
      FlutterNotification.participantJoin();
    }
  };

  const userRemoved = (p: ParticipantPropertiesPayload[]) => {
    leaveSession();
  };

  const connectionChange = (payload: ConnectionChangePayload) => {
    if (payload.state === "Closed" || payload.state === "Fail") {
      leaveSession();
    }
  };

  const joinSession = async (
    sessionName: string,
    jwt: string,
    userName: string,
    isVideoCall?: boolean
  ) => {
    await zoomClient.current.init("en-US", "Global", { patchJsMedia: true });
    zoomClient.current.on("peer-video-state-change", renderVideo);
    await zoomClient.current.join(sessionName, jwt, userName, undefined, 2);
    setHostname(userName);

    const stream = zoomClient.current.getMediaStream();

    isVideoCall ? await stream.startVideo() : null;

    await stream.startAudio();
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameraList = devices.filter((d) => d.kind === "videoinput");
    setHostCameraList(cameraList);
    setHostSelectedCamera(cameraList[0].deviceId);

    // render
    setHostAudioMuted(false);
    isVideoCall
      ? await renderVideo({
          action: "Start",
          userId: zoomClient.current.getCurrentUserInfo().userId,
        })
      : null;

    zoomClient.current.on("user-added", userAdded);
    zoomClient.current.on("user-removed", userRemoved);
    zoomClient.current.on("connection-change", connectionChange);
    setVideoCall(isVideoCall ?? false);
  };

  const switchHostCamera = async (id: string) => {
    const stream = zoomClient.current.getMediaStream();
    if (stream) {
      await stream.switchCamera(id);
      setHostSelectedCamera(id);
    }
  };

  const leaveSession = async () => {
    if (!zoomClient.current) return;
    zoomClient.current.off("peer-video-state-change", renderVideo);
    await zoomClient.current.leave();
    setCallingState("call-end");
    FlutterNotification.leaveSession();
  };

  useEffect(() => {
    if (zoomClient.current) {
      window.videoController = {
        joinSession,
        leaveSession,
      };
    }
    setTimeout(() => {
      setWarningMessage(false);
    }, 10 * 1000);
    showControlsNow();
    FlutterNotification.ready();
  }, []);

  const showControlsNow = () => {
    setShowControls(true);
    if (showControlsTimeout.current) {
      clearTimeout(showControlsTimeout.current);
    }
    showControlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 10 * 1000);
  };

  return callingState === "call-end" ? (
    <CallEnd />
  ) : (
    <div className="canvas-container" onClick={showControlsNow}>
      <div id="main-video">
        {warningMessage ? (
          <div style={{ top: "30%", position: "absolute", width: "100%" }}>
            <p
              style={{
                color: "white",
                textAlign: "center",
                fontSize: "smaller",
              }}
            >
              For a better experience, please to use a headset...🎧
            </p>
          </div>
        ) : null}
        {callingState === "calling" ? (
          <div>
            <Calling type={type} />
            {type == "caller" ? (
              <audio autoPlay loop>
                <source src={"/ringtone.mp3"} type="audio/mpeg" />
              </audio>
            ) : null}
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
        {hostCameraList.length > 1 && !hostVideoMuted ? (
          <SwitchCamera
            cameraList={hostCameraList}
            selectedCamera={hostSelectedCamera}
            setActive={switchHostCamera}
          />
        ) : null}
      </div>
      <div
        className="button-container"
        style={{ bottom: showControls ? "20px" : "-100px" }}
      >
        {videoCall ? (
          <VideoButton
            client={zoomClient}
            isVideoMuted={hostVideoMuted}
            renderVideo={renderVideo}
          />
        ) : null}
        <AudioButton
          client={zoomClient}
          isAudioMuted={hostAudioMuted}
          setIsAudioMuted={setHostAudioMuted}
        />
        <CallButton action={leaveSession} />
      </div>
    </div>
  );
};

export default Canvas;
