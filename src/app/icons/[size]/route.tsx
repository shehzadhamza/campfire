import { ImageResponse } from "next/og";
import { iconSvg } from "@/lib/icon";

const SIZES = ["180", "192", "512"];

export async function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export async function GET(_req: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size } = await params;
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  const px = Number(size);
  const src = `data:image/svg+xml;base64,${Buffer.from(iconSvg()).toString("base64")}`;
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} width={px} height={px} alt="" />
    ),
    { width: px, height: px },
  );
}
