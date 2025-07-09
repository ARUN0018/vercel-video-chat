import jwt from "jsonwebtoken";

export function getData(slug: string) {
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;

  if (!sdkKey || !sdkSecret) {
    throw new Error("Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET");
  }
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const oPayload = {
    app_key: sdkKey,
    tpc: slug,
    role_type: 1,
    version: 1,
    iat: iat,
    exp: exp,
  };

  return jwt.sign(oPayload, sdkSecret, {
    algorithm: "HS256",
  });
}
