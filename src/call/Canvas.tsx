import ZoomVideo, {
  ExecutedFailure,
  Stream,
  VideoPlayer,
  VideoQuality,
} from "@zoom/videosdk";
import { FunctionComponent, useEffect, useRef } from "react";
import "./Canvas.css"; // Assuming you have some styles for the video player

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
  const ref = useRef<HTMLVideoElement>(null);
  const myStream = useRef<typeof Stream | null>(null);
  const zoomClient = useRef<ReturnType<typeof ZoomVideo.createClient>>(
    ZoomVideo.createClient()
  );

  const peerVideoStateChange = async (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => {
    if (event.action === "Start") {
      const userVideo = await myStream.current?.attachVideo(
        event.userId,
        VideoQuality.Video_360P
      );
      if (userVideo && ref.current) {
        if ((userVideo as ExecutedFailure).errorCode) {
          console.error(
            `Failed to attach video for user ${event.userId}: ${
              (userVideo as ExecutedFailure).errorCode
            }`
          );
          return;
        }

        if (event.userId === zoomClient.current?.getCurrentUserInfo().userId) {
          ref.current
            .querySelector("#secondary-video")
            ?.appendChild(userVideo as VideoPlayer);
        } else {
          ref.current
            .querySelector("#main-video")
            ?.appendChild(userVideo as VideoPlayer);
        }
      }
    } else if (event.action === "Stop") {
      const element = await myStream.current?.detachVideo(event.userId);
      if (element && ref.current) {
        Array.isArray(element)
          ? element.forEach((el) => el.remove())
          : element.remove();
      }
    }
  };

  const joinSession = async () => {
    if (!zoomClient.current) return;
    const sessionName = "mysession-1"; // Replace with your session name
    const jwt = await getToken(sessionName);
    const userName = `User-${new Date().getTime().toString().slice(8)}`;
    await zoomClient.current.join(sessionName, jwt, userName);
  };

  useEffect(() => {
    if (zoomClient.current) {
      zoomClient.current.init("en-US", "Global", { patchJsMedia: true });
      myStream.current = zoomClient.current.getMediaStream();
      zoomClient.current.on("peer-video-state-change", peerVideoStateChange);
      window.videoController = { joinSession }; // Expose joinSession globally for testing
    }
  }, []);

  return (
    /* @ts-expect-error html component */
    <video-player-container ref={ref}>
      <div id="main-video"></div>
      <div id="secondary-video"></div>
      {/* @ts-expect-error html component */}
    </video-player-container>
  );
};

export default Canvas;
