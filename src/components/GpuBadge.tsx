import { getGpuTierReason, gpuRenderer, useGpuTier } from "./utils/gpuTier";

const show = new URLSearchParams(window.location.search).has("debug");

// ?debug: shows which quality tier this device got and why, for checking real phones/Macs
const GpuBadge = () => {
  const tier = useGpuTier();
  if (!show) return null;
  return (
    <div className="scroll-mode-badge gpu-badge" aria-hidden="true">
      GPU: {tier} (reason: {getGpuTierReason()}) {gpuRenderer || "unknown renderer"}
    </div>
  );
};

export default GpuBadge;
