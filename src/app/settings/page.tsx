"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Settings as SettingsIcon, Save } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const json = await res.json();
    setSettings(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your wedding details and budget
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Wedding Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Couple Names
            </label>
            <Input
              placeholder="e.g. Alex & Jordan"
              value={settings.coupleNames || ""}
              onChange={(e) =>
                setSettings({ ...settings, coupleNames: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Wedding Date
            </label>
            <Input
              type="date"
              value={settings.weddingDate || ""}
              onChange={(e) =>
                setSettings({ ...settings, weddingDate: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Total Budget (£)
            </label>
            <Input
              type="number"
              step="100"
              placeholder="15000"
              value={settings.totalBudget || ""}
              onChange={(e) =>
                setSettings({ ...settings, totalBudget: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Currently set to{" "}
              {formatCurrency(parseFloat(settings.totalBudget || "0"))}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} className="w-full" disabled={saving}>
        <Save className="w-4 h-4 mr-1" />
        {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
      </Button>
    </div>
  );
}
