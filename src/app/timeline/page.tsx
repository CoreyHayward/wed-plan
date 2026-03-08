"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "@/components/ui/sheet";
import { CalendarClock, Clock3, Heart, Moon, Pencil, Plus, Sunrise, Trash2, UtensilsCrossed } from "lucide-react";
import { timelinePhases, compareTimelineItems, type TimelinePhase } from "@/lib/timeline";
import type { TimelineItem } from "@/db/schema";

const phaseIcons: Record<TimelinePhase, React.ReactNode> = {
  morning: <Sunrise className="w-4 h-4 text-primary" />,
  ceremony: <Heart className="w-4 h-4 text-primary" />,
  reception: <UtensilsCrossed className="w-4 h-4 text-primary" />,
  evening: <Moon className="w-4 h-4 text-primary" />,
};

type SettingsData = {
  coupleNames?: string;
  weddingDate?: string;
};

const emptyForm = {
  title: "",
  phase: "ceremony" as TimelinePhase,
  startTime: "13:00",
  notes: "",
};

async function fetchTimelinePageData() {
  const [timelineRes, settingsRes] = await Promise.all([
    fetch("/api/timeline"),
    fetch("/api/settings"),
  ]);

  const [timeline, settings] = await Promise.all([
    timelineRes.json() as Promise<TimelineItem[]>,
    settingsRes.json() as Promise<SettingsData>,
  ]);

  return {
    items: timeline.sort(compareTimelineItems),
    settings,
  };
}

function formatWeddingDate(value?: string) {
  if (!value) return "Pick your wedding date in Settings to ground the plan.";

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDisplayTime(value: string) {
  if (!value) return "TBC";
  const [hours = "00", minutes = "00"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let ignore = false;

    void (async () => {
      const data = await fetchTimelinePageData();
      if (ignore) return;
      setItems(data.items);
      setSettings(data.settings);
      setLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const groupedItems = useMemo(
    () =>
      timelinePhases.map((phase) => ({
        ...phase,
        items: items
          .filter((item) => item.phase === phase.value)
          .sort(compareTimelineItems),
      })),
    [items]
  );

  const openAddMoment = (phase?: TimelinePhase) => {
    setEditingItem(null);
    setForm({ ...emptyForm, phase: phase || emptyForm.phase });
    setShowEditor(true);
  };

  const openEditMoment = (item: TimelineItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      phase: item.phase as TimelinePhase,
      startTime: item.startTime,
      notes: item.notes || "",
    });
    setShowEditor(true);
  };

  const reloadTimeline = async () => {
    const data = await fetchTimelinePageData();
    setItems(data.items);
    setSettings(data.settings);
  };

  const saveMoment = async () => {
    const payload = {
      title: form.title.trim(),
      phase: form.phase,
      startTime: form.startTime,
      notes: form.notes.trim(),
    };

    if (!payload.title) {
      alert("Please enter a moment name.");
      return;
    }

    const endpoint = editingItem ? `/api/timeline/${editingItem.id}` : "/api/timeline";
    const method = editingItem ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      alert("Could not save this timeline moment. Please try again.");
      return;
    }

    setShowEditor(false);
    setEditingItem(null);
    setForm(emptyForm);
    await reloadTimeline();
  };

  const deleteMoment = async (item: TimelineItem) => {
    if (!confirm(`Delete "${item.title}" from your timeline?`)) return;

    const response = await fetch(`/api/timeline/${item.id}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Could not delete this timeline moment. Please try again.");
      return;
    }

    await reloadTimeline();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
          <p className="text-muted-foreground text-sm">
            Plan the flow of your day from ceremony to disco.
          </p>
        </div>
        <Button size="sm" onClick={() => openAddMoment()}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" />
            Your wedding day at a glance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {settings.coupleNames?.trim() || "Wedding Day"}
            </p>
            <p className="mt-1 text-sm">{formatWeddingDate(settings.weddingDate)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-background px-4 py-3">
              <p className="text-xs text-muted-foreground">Planned moments</p>
              <p className="mt-1 text-xl font-semibold">{items.length}</p>
            </div>
            <div className="rounded-xl border bg-background px-4 py-3">
              <p className="text-xs text-muted-foreground">Phases covered</p>
              <p className="mt-1 text-xl font-semibold">
                {groupedItems.filter((phase) => phase.items.length > 0).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vertical timeline */}
      <div className="relative pb-6">
        {/* Continuous vertical line */}
        <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-border" />

        {groupedItems.map((phase) => (
          <div key={phase.value} className="mb-2">
            {/* Phase heading row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative z-10 flex w-14 shrink-0 justify-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-background">
                  {phaseIcons[phase.value]}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{phase.label}</h2>
                  <Badge variant="secondary" className="shrink-0">
                    {phase.items.length} moment{phase.items.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
              </div>
            </div>

            {/* Phase items */}
            {phase.items.length > 0 ? (
              <>
                {phase.items.map((item) => (
                  <div key={item.id} className="flex gap-3 mb-3">
                    <div className="relative z-10 flex w-14 shrink-0 justify-center pt-5">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                    </div>
                    <div className="flex-1 rounded-xl border bg-background/80 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="gap-1">
                              <Clock3 className="w-3 h-3" />
                              {formatDisplayTime(item.startTime)}
                            </Badge>
                          </div>
                          <h3 className="font-semibold">{item.title}</h3>
                          {item.notes ? (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                              {item.notes}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">
                              Add details like supplier cues, room changes, or music notes.
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${item.title}`}
                            onClick={() => openEditMoment(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${item.title}`}
                            onClick={() => deleteMoment(item)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 mb-6">
                  <div className="w-14 shrink-0" />
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openAddMoment(phase.value)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add {phase.label.toLowerCase()} moment
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-3 mb-6">
                <div className="w-14 shrink-0" />
                <button
                  type="button"
                  onClick={() => openAddMoment(phase.value)}
                  className="flex-1 rounded-xl border border-dashed bg-muted/30 px-4 py-5 text-left transition-colors hover:bg-accent/40"
                >
                  <p className="font-medium">Nothing planned here yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a moment for {phase.label.toLowerCase()} to keep the day flowing smoothly.
                  </p>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Sheet
        open={showEditor}
        onClose={() => setShowEditor(false)}
        title={editingItem ? "Edit timeline moment" : "Add timeline moment"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Moment name</label>
            <Input
              placeholder="e.g. Dinner is served"
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phase</label>
              <select
                value={form.phase}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    phase: e.target.value as TimelinePhase,
                  }))
                }
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {timelinePhases.map((phase) => (
                  <option key={phase.value} value={phase.value}>
                    {phase.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Time</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm((current) => ({ ...current, startTime: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes</label>
            <Textarea
              rows={4}
              placeholder="Add reminders for suppliers, transitions, speeches, or special moments."
              value={form.notes}
              onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
            />
          </div>

          <Button onClick={saveMoment} className="w-full">
            {editingItem ? "Save changes" : "Add moment"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
