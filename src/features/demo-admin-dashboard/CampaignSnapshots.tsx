import { useState, useEffect } from "react";
import { Archive, Clock, FilePlus, Trash2, Undo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignSnapshot } from "../types/campaignSnapshot";
import type { Draft } from "../types/draft";
import { defaultCampaignSnapshots } from "../fixtures/campaignSnapshotFixtures";

const STORAGE_KEY = "stealth-demo-campaign-snapshots";

const loadSnapshots = (): CampaignSnapshot[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultCampaignSnapshots;
  } catch {
    return defaultCampaignSnapshots;
  }
};

const saveSnapshots = (snapshots: CampaignSnapshot[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
};

interface CampaignSnapshotsProps {
  currentDataset: Draft[];
  onRestoreDataset: (dataset: Draft[]) => void;
}

export function CampaignSnapshots({ currentDataset, onRestoreDataset }: CampaignSnapshotsProps) {
  const [snapshots, setSnapshots] = useState<CampaignSnapshot[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState("");

  useEffect(() => {
    setSnapshots(loadSnapshots());
  }, []);

  const handleCreateSnapshot = () => {
    if (currentDataset.length === 0) {
      alert("Cannot create a snapshot of an empty dataset.");
      return;
    }
    const now = new Date();
    const newSnapshot: CampaignSnapshot = {
      id: `snap-${now.getTime()}`,
      name: newSnapshotName || `Snapshot ${now.toLocaleString()}`,
      createdAt: now.toISOString(),
      draftCount: currentDataset.length,
      data: currentDataset,
    };
    const updatedSnapshots = [newSnapshot, ...snapshots];
    setSnapshots(updatedSnapshots);
    saveSnapshots(updatedSnapshots);
    setNewSnapshotName("");
  };

  const handleDeleteSnapshot = (id: string) => {
    if (confirm("Are you sure you want to delete this snapshot?")) {
      const updatedSnapshots = snapshots.filter((s) => s.id !== id);
      setSnapshots(updatedSnapshots);
      saveSnapshots(updatedSnapshots);
    }
  };

  const handleRestoreSnapshot = (snapshot: CampaignSnapshot) => {
    if (
      confirm(
        `This will replace the current ${currentDataset.length} drafts with the ${snapshot.draftCount} drafts from "${snapshot.name}". Are you sure?`,
      )
    ) {
      onRestoreDataset(snapshot.data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Snapshot */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          Create New Snapshot
        </h4>
        <p className="text-xs text-muted-foreground">
          Save the current set of {currentDataset.length} drafts as a named snapshot.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSnapshotName}
            onChange={(e) => setNewSnapshotName(e.target.value)}
            placeholder="Optional snapshot name..."
            className="flex-grow rounded-md border border-white/[0.08] bg-black/50 px-3 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
          />
          <button
            type="button"
            onClick={handleCreateSnapshot}
            disabled={currentDataset.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Archive className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* Snapshot List */}
      <div className="space-y-3">
        {snapshots.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No snapshots saved yet.
          </div>
        ) : (
          snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div>
                <p className="text-xs font-medium text-foreground">{snapshot.name}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(snapshot.createdAt).toLocaleString()}
                  </span>
                  <span>{snapshot.draftCount} drafts</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRestoreSnapshot(snapshot)}
                  title="Restore this snapshot"
                  className="rounded-md p-1.5 text-muted-foreground transition hover:bg-white/5 hover:text-amber-400"
                >
                  <Undo className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSnapshot(snapshot.id)}
                  title="Delete this snapshot"
                  className="rounded-md p-1.5 text-muted-foreground transition hover:bg-white/5 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}