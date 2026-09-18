import { ConverterApp } from "@/components/converter-app";

// This page is fully interactive/client-rendered (file drag-drop, canvas,
// zip generation) with no benefit from static prerendering, and Next 16's
// static generation currently trips over the client-only canvas/useRef
// hooks in ParticleField/ConverterApp during the prerender pass. Force
// dynamic rendering to skip that prerender step entirely.
export const dynamic = "force-dynamic";

export default function Home() {
  return <ConverterApp />;
}
