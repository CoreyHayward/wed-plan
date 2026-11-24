"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BedDouble, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { RoomGuest, RoomListData, RoomWithGuests } from "@/app/api/rooms/route";

type RoomForm = {
  propertyName: string;
  roomName: string;
  capacity: string;
  notes: string;
};

const emptyForm: RoomForm = {
  propertyName: "",
  roomName: "",
  capacity: "",
  notes: "",
};

export default function RoomsPage() {
  const [data, setData] = useState<RoomListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRoomSheet, setShowRoomSheet] = useState(false);
  const [showGuestsSheet, setShowGuestsSheet] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomWithGuests | null>(null);
  const [assigningRoom, setAssigningRoom] = useState<RoomWithGuests | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);
  const [guestSearch, setGuestSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch("/api/rooms");
      if (!response.ok) throw new Error("Could not load rooms");
      setData(await response.json());
      setError("");
    } catch {
      setError("Could not load rooms. Please try again.");
      setData({ rooms: [], unassignedGuests: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const allGuests = useMemo(() => {
    if (!data) return [];
    const roomGuests = data.rooms.flatMap((room) => room.guests);
    return [...data.unassignedGuests, ...roomGuests].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const filteredGuests = useMemo(() => {
    const search = guestSearch.trim().toLocaleLowerCase();
    return search
      ? allGuests.filter((guest) => guest.name.toLocaleLowerCase().includes(search))
      : allGuests;
  }, [allGuests, guestSearch]);

  const openAddRoom = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setError("");
    setShowRoomSheet(true);
  };

  const openEditRoom = (room: RoomWithGuests) => {
    setEditingRoom(room);
    setForm({
      propertyName: room.propertyName,
      roomName: room.roomName,
      capacity: room.capacity === null ? "" : String(room.capacity),
      notes: room.notes || "",
    });
    setError("");
    setShowRoomSheet(true);
  };

  const saveRoom = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms",
        {
          method: editingRoom ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save room");
      setShowRoomSheet(false);
      setEditingRoom(null);
      setForm(emptyForm);
      await fetchRooms();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save room");
    } finally {
      setSaving(false);
    }
  };

  const deleteRoom = async (room: RoomWithGuests) => {
    if (!window.confirm(`Delete ${room.propertyName} — ${room.roomName}? Its guests will be left unassigned.`)) {
      return;
    }
    setError("");
    try {
      const response = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete room");
      await fetchRooms();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete room");
    }
  };

  const openAssignments = (room: RoomWithGuests) => {
    setAssigningRoom(room);
    setSelectedGuestIds(room.guests.map((guest) => guest.id));
    setGuestSearch("");
    setError("");
    setShowGuestsSheet(true);
  };

  const saveAssignments = async () => {
    if (!assigningRoom) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/rooms/${assigningRoom.id}/guests`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: selectedGuestIds }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update guest assignments");
      setShowGuestsSheet(false);
      setAssigningRoom(null);
      setGuestSearch("");
      await fetchRooms();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not update guest assignments"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleGuest = (guest: RoomGuest) => {
    setSelectedGuestIds((ids) =>
      ids.includes(guest.id) ? ids.filter((id) => id !== guest.id) : [...ids, guest.id]
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
          <p className="text-sm text-muted-foreground">
            {data.rooms.length} booked room{data.rooms.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button size="sm" onClick={openAddRoom}>
          <Plus className="mr-1 h-4 w-4" />
          Add room
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {data.rooms.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <BedDouble className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Add your first booked room, then assign guests from the guest list.
              </p>
            </CardContent>
          </Card>
        ) : (
          data.rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{room.propertyName}</p>
                    <CardTitle className="mt-1 truncate">{room.roomName}</CardTitle>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" aria-label="Edit room" onClick={() => openEditRoom(room)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="Delete room" onClick={() => deleteRoom(room)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge
                    variant="secondary"
                    className={room.occupancy.isOverCapacity ? "bg-destructive/10 text-destructive" : undefined}
                  >
                    {room.occupancy.label}
                  </Badge>
                  {room.occupancy.isOverCapacity && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" /> Over capacity
                    </span>
                  )}
                </div>
                {room.notes && <p className="text-sm text-muted-foreground">{room.notes}</p>}
                {room.guests.length ? (
                  <p className="text-sm leading-6">{room.guests.map((guest) => guest.name).join(", ")}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No guests assigned yet.</p>
                )}
                <Button className="w-full" variant="outline" onClick={() => openAssignments(room)}>
                  <Users className="mr-2 h-4 w-4" /> Manage guests
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Sheet
        open={showRoomSheet}
        onClose={() => {
          setShowRoomSheet(false);
          setEditingRoom(null);
          setError("");
        }}
        title={editingRoom ? "Edit room" : "Add room"}
      >
        <form onSubmit={(event) => { event.preventDefault(); saveRoom(); }} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Accommodation/property *</label>
            <Input autoFocus value={form.propertyName} onChange={(event) => setForm({ ...form, propertyName: event.target.value })} placeholder="e.g. The Old Mill" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Room name or number *</label>
            <Input value={form.roomName} onChange={(event) => setForm({ ...form, roomName: event.target.value })} placeholder="e.g. Room 12" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Capacity <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Input type="number" min="1" step="1" inputMode="numeric" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} placeholder="e.g. 2" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Any useful details" rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Save room"}</Button>
        </form>
      </Sheet>

      <Sheet
        open={showGuestsSheet}
        onClose={() => {
          setShowGuestsSheet(false);
          setAssigningRoom(null);
          setGuestSearch("");
          setError("");
        }}
        title={assigningRoom ? `Guests for ${assigningRoom.roomName}` : "Guests"}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select guests for this room. Selecting a guest already in another room moves them here. Capacity warnings do not prevent assignment.
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search guests by name"
              placeholder="Search guests..."
              value={guestSearch}
              onChange={(event) => setGuestSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          {allGuests.length ? (
            filteredGuests.length ? (
              <div className="divide-y rounded-lg border">
                {filteredGuests.map((guest) => {
                  const checked = selectedGuestIds.includes(guest.id);
                  return (
                    <label key={guest.id} className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/30">
                      <input type="checkbox" checked={checked} onChange={() => toggleGuest(guest)} className="h-4 w-4 accent-primary" />
                      <span className="text-sm">{guest.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border px-3 py-4 text-center text-sm text-muted-foreground">
                No guests match your search.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">Add guests from the Guests page before assigning a room.</p>
          )}
          <Button className="w-full" onClick={saveAssignments} disabled={saving || !assigningRoom}>
            {saving ? "Saving..." : "Save guest assignments"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
