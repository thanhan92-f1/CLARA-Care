"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LOCAL_FLOW_BLUEPRINT } from "@/components/research/lib/research-page-constants";
import { buildLocalFlowStages, markTimelineFailed, resolveFlowModeFromResult } from "@/components/research/lib/research-page-helpers";
import { FlowVisibilityMode, Tier2Result } from "@/components/research/lib/research-page-types";
import { ResearchFlowEvent, ResearchFlowStage } from "@/lib/research";

type ResolvedFlowPayload = {
  mode: FlowVisibilityMode;
  stages: ResearchFlowStage[];
  events: ResearchFlowEvent[];
};

export function useResearchFlow() {
  const [liveFlowStages, setLiveFlowStages] = useState<ResearchFlowStage[]>([]);
  const [liveFlowEvents, setLiveFlowEvents] = useState<ResearchFlowEvent[]>([]);
  const [flowMode, setFlowMode] = useState<FlowVisibilityMode>("idle");

  const localFlowIndexRef = useRef(0);
  const localFlowTimerRef = useRef<number | null>(null);

  const stopLocalFlowSimulation = useCallback(() => {
    if (localFlowTimerRef.current !== null) {
      window.clearInterval(localFlowTimerRef.current);
      localFlowTimerRef.current = null;
    }
  }, []);

  const resetFlow = useCallback(() => {
    stopLocalFlowSimulation();
    setFlowMode("idle");
    setLiveFlowStages([]);
    setLiveFlowEvents([]);
  }, [stopLocalFlowSimulation]);

  const startLocalFlowSimulation = useCallback(() => {
    stopLocalFlowSimulation();
    localFlowIndexRef.current = 0;
    setFlowMode("local-fallback");
    setLiveFlowEvents([]);
    setLiveFlowStages(buildLocalFlowStages(0));

    localFlowTimerRef.current = window.setInterval(() => {
      localFlowIndexRef.current = Math.min(localFlowIndexRef.current + 1, LOCAL_FLOW_BLUEPRINT.length - 1);
      setLiveFlowStages(buildLocalFlowStages(localFlowIndexRef.current));
    }, 1300);
  }, [stopLocalFlowSimulation]);

  const setResolvedFlow = useCallback(({ mode, stages, events }: ResolvedFlowPayload) => {
    setFlowMode(mode);
    setLiveFlowStages(stages);
    setLiveFlowEvents(events);
  }, []);

  const markFlowFailed = useCallback(() => {
    setLiveFlowStages((prev) => markTimelineFailed(prev));
    setFlowMode("local-fallback");
  }, []);

  const hydrateFlowFromTier2Result = useCallback((result: Tier2Result) => {
    setLiveFlowStages(result.flowStages);
    setLiveFlowEvents(result.flowEvents);
    setFlowMode(resolveFlowModeFromResult(result));
  }, []);

  useEffect(() => {
    return () => {
      stopLocalFlowSimulation();
    };
  }, [stopLocalFlowSimulation]);

  return {
    liveFlowStages,
    liveFlowEvents,
    flowMode,
    resetFlow,
    startLocalFlowSimulation,
    stopLocalFlowSimulation,
    setResolvedFlow,
    markFlowFailed,
    hydrateFlowFromTier2Result
  };
}
