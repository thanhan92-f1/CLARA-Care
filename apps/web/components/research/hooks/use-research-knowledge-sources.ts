"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { KnowledgeSource, createKnowledgeSource, listKnowledgeSources } from "@/lib/research";

export function useResearchKnowledgeSources() {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
  const [newSourceName, setNewSourceName] = useState("");
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isCreatingSource, setIsCreatingSource] = useState(false);
  const [sourceError, setSourceError] = useState("");

  useEffect(() => {
    const loadSources = async () => {
      setIsLoadingSources(true);
      setSourceError("");
      try {
        const items = await listKnowledgeSources();
        setKnowledgeSources(items);
      } catch (loadError) {
        setSourceError(loadError instanceof Error ? loadError.message : "Không thể tải knowledge sources.");
      } finally {
        setIsLoadingSources(false);
      }
    };

    void loadSources();
  }, []);

  const onToggleSource = useCallback((sourceId: number) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    );
  }, []);

  const onCreateSource = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const name = newSourceName.trim();
      if (!name || isCreatingSource) return;

      setIsCreatingSource(true);
      setSourceError("");
      try {
        const source = await createKnowledgeSource(name);
        setKnowledgeSources((prev) => [source, ...prev]);
        setSelectedSourceIds((prev) => [source.id, ...prev]);
        setNewSourceName("");
      } catch (createError) {
        setSourceError(createError instanceof Error ? createError.message : "Không thể tạo knowledge source.");
      } finally {
        setIsCreatingSource(false);
      }
    },
    [isCreatingSource, newSourceName]
  );

  return {
    knowledgeSources,
    selectedSourceIds,
    newSourceName,
    isLoadingSources,
    isCreatingSource,
    sourceError,
    setNewSourceName,
    onToggleSource,
    onCreateSource
  };
}
