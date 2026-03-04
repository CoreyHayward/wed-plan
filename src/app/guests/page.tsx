"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "@/components/ui/sheet";
import {
  Users,
  UserPlus,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  Home,
  Trash2,
  Filter,
} from "lucide-react";
import type { GuestListData, GuestWithHousehold } from "@/app/api/guests/route";
import type { Household } from "@/db/schema";

type GuestForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  householdId: string;
  party: string;
  attendance: string;
  rsvpStatus: string;
  isPlusOne: boolean;
  linkedGuestId: string;
  dietaryRequirements: string;
  allergies: string;
  accessibilityNeeds: string;
  tableAssignment: string;
  notes: string;
};

const emptyForm: GuestForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  householdId: "",
  party: "joint",
  attendance: "all",
  rsvpStatus: "pending",
  isPlusOne: false,
  linkedGuestId: "",
  dietaryRequirements: "",
  allergies: "",
  accessibilityNeeds: "",
  tableAssignment: "",
  notes: "",
};

const PARTY_OPTIONS = [
  { value: "bride", label: "Bride" },
  { value: "groom", label: "Groom" },
  { value: "joint", label: "Joint" },
];

const ATTENDANCE_OPTIONS = [
  { value: "all", label: "All Day" },
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "evening", label: "Evening" },
];

const RSVP_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

export default function GuestsPage() {
  const [data, setData] = useState<GuestListData | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterParty, setFilterParty] = useState("");
  const [filterRsvp, setFilterRsvp] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [showGuestSheet, setShowGuestSheet] = useState(false);
  const [showHouseholdSheet, setShowHouseholdSheet] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestWithHousehold | null>(null);
  const [guestForm, setGuestForm] = useState<GuestForm>(emptyForm);
  const [householdName, setHouseholdName] = useState("");
  const [householdAddress, setHouseholdAddress] = useState("");
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [showMoreFields, setShowMoreFields] = useState(false);

  const fetchData = useCallback(async () => {
    const [guestRes, householdRes] = await Promise.all([
      fetch("/api/guests"),
      fetch("/api/households"),
    ]);
    const guestData = await guestRes.json();
    const householdData = await householdRes.json();
    setData(guestData);
    setHouseholds(householdData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddGuest = () => {
    setEditingGuest(null);
    setGuestForm(emptyForm);
    setShowMoreFields(false);
    setShowGuestSheet(true);
  };

  const openEditGuest = (guest: GuestWithHousehold) => {
    setEditingGuest(guest);
    setGuestForm({
      firstName: guest.firstName,
      lastName: guest.lastName || "",
      email: guest.email || "",
      phone: guest.phone || "",
      householdId: guest.householdId ? String(guest.householdId) : "",
      party: guest.party,
      attendance: guest.attendance,
      rsvpStatus: guest.rsvpStatus,
      isPlusOne: guest.isPlusOne,
      linkedGuestId: guest.linkedGuestId ? String(guest.linkedGuestId) : "",
      dietaryRequirements: guest.dietaryRequirements || "",
      allergies: guest.allergies || "",
      accessibilityNeeds: guest.accessibilityNeeds || "",
      tableAssignment: guest.tableAssignment || "",
      notes: guest.notes || "",
    });
    setShowMoreFields(false);
    setShowGuestSheet(true);
  };

  const saveGuest = async () => {
    if (!guestForm.firstName.trim()) return;

    const payload = {
      ...guestForm,
      householdId: guestForm.householdId ? parseInt(guestForm.householdId) : null,
      linkedGuestId: guestForm.linkedGuestId
        ? parseInt(guestForm.linkedGuestId)
        : null,
    };

    if (editingGuest) {
      await fetch(`/api/guests/${editingGuest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowGuestSheet(false);
    setEditingGuest(null);
    setGuestForm(emptyForm);
    fetchData();
  };

  const deleteGuest = async (id: number) => {
    await fetch(`/api/guests/${id}`, { method: "DELETE" });
    setShowGuestSheet(false);
    setEditingGuest(null);
    fetchData();
  };

  const saveHousehold = async () => {
    if (!householdName.trim()) return;

    if (editingHousehold) {
      await fetch(`/api/households/${editingHousehold.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: householdName, address: householdAddress }),
      });
    } else {
      await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: householdName, address: householdAddress }),
      });
    }

    setShowHouseholdSheet(false);
    setHouseholdName("");
    setHouseholdAddress("");
    setEditingHousehold(null);
    fetchData();
  };

  const deleteHousehold = async (id: number) => {
    await fetch(`/api/households/${id}`, { method: "DELETE" });
    setShowHouseholdSheet(false);
    setEditingHousehold(null);
    fetchData();
  };

  const exportCsv = () => {
    window.open("/api/guests/export", "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  const filteredGuests = data.guests.filter((g) => {
    const name = `${g.firstName} ${g.lastName || ""}`.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      name.includes(searchQuery.toLowerCase()) ||
      (g.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.householdName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.tableAssignment || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesParty = !filterParty || g.party === filterParty;
    const matchesRsvp = !filterRsvp || g.rsvpStatus === filterRsvp;
    return matchesSearch && matchesParty && matchesRsvp;
  });

  const nonPlusOneGuests = data.guests.filter((g) => !g.isPlusOne);

  const rsvpBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge variant="success">Accepted</Badge>;
      case "declined":
        return (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive">
            Declined
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const partyLabel = (party: string) => {
    switch (party) {
      case "bride":
        return "Bride";
      case "groom":
        return "Groom";
      default:
        return "Joint";
    }
  };

  const attendanceLabel = (attendance: string) => {
    switch (attendance) {
      case "ceremony":
        return "Ceremony";
      case "reception":
        return "Reception";
      case "evening":
        return "Evening";
      default:
        return "All Day";
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guest List</h1>
          <p className="text-muted-foreground text-sm">
            {data.summary.total} guest{data.summary.total !== 1 ? "s" : ""} invited
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={openAddGuest}>
            <UserPlus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Summary Dashboard */}
      <button
        onClick={() => setShowSummary(!showSummary)}
        className="w-full mb-2"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Summary
              </span>
              {showSummary ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          {showSummary && (
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <UserCheck className="w-4 h-4 mx-auto mb-1 text-success" />
                  <p className="text-xs text-muted-foreground">Accepted</p>
                  <p className="text-sm font-semibold">{data.summary.accepted}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-sm font-semibold">{data.summary.pending}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <UserX className="w-4 h-4 mx-auto mb-1 text-destructive" />
                  <p className="text-xs text-muted-foreground">Declined</p>
                  <p className="text-sm font-semibold">{data.summary.declined}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Ceremony</span>
                  <span className="font-medium">{data.summary.ceremonyCount}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Reception</span>
                  <span className="font-medium">{data.summary.receptionCount}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Evening</span>
                  <span className="font-medium">{data.summary.eveningCount}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Households</span>
                  <span className="font-medium">{data.summary.householdCount}</span>
                </div>
              </div>

              <div className="flex justify-between text-xs mt-2 px-1">
                <span className="text-muted-foreground">
                  Bride: {data.summary.brideGuests} · Groom: {data.summary.groomGuests} · Joint: {data.summary.jointGuests}
                </span>
                <span className="text-muted-foreground">
                  +1s: {data.summary.plusOnes}
                </span>
              </div>
            </CardContent>
          )}
        </Card>
      </button>

      {/* Search & Filters */}
      <div className="space-y-2 mb-4 mt-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            size="icon"
            variant={showFilters || filterParty || filterRsvp ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-2">
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Parties</option>
              {PARTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filterRsvp}
              onChange={(e) => setFilterRsvp(e.target.value)}
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All RSVP</option>
              {RSVP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Household Management */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Households</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingHousehold(null);
            setHouseholdName("");
            setHouseholdAddress("");
            setShowHouseholdSheet(true);
          }}
        >
          <Home className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {households.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {households.map((h) => {
            const memberCount = data.guests.filter(
              (g) => g.householdId === h.id
            ).length;
            return (
              <button
                key={h.id}
                onClick={() => {
                  setEditingHousehold(h);
                  setHouseholdName(h.name);
                  setHouseholdAddress(h.address || "");
                  setShowHouseholdSheet(true);
                }}
                className="shrink-0 rounded-lg border bg-card p-2.5 text-left hover:bg-accent/30 transition-colors min-w-[140px]"
              >
                <p className="text-sm font-medium truncate">{h.name}</p>
                <p className="text-xs text-muted-foreground">
                  {memberCount} guest{memberCount !== 1 ? "s" : ""}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">
          No households yet. Group guests by household to track invitations.
        </p>
      )}

      {/* Guest List */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          Guests
          {filteredGuests.length !== data.guests.length && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredGuests.length} shown)
            </span>
          )}
        </h2>
      </div>

      <div className="space-y-2 mb-6">
        {filteredGuests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {data.guests.length === 0
                  ? "No guests added yet. Tap \"Add\" to get started."
                  : "No guests match your search."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGuests.map((guest) => (
            <Card
              key={guest.id}
              className="hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => openEditGuest(guest)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {guest.firstName} {guest.lastName}
                      </h3>
                      {guest.isPlusOne && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +1
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{partyLabel(guest.party)}</span>
                      <span>·</span>
                      <span>{attendanceLabel(guest.attendance)}</span>
                      {guest.tableAssignment && (
                        <>
                          <span>·</span>
                          <span>Table {guest.tableAssignment}</span>
                        </>
                      )}
                      {guest.householdName && (
                        <>
                          <span>·</span>
                          <span className="truncate">{guest.householdName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">{rsvpBadge(guest.rsvpStatus)}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Guest Sheet */}
      <Sheet
        open={showGuestSheet}
        onClose={() => {
          setShowGuestSheet(false);
          setEditingGuest(null);
        }}
        title={editingGuest ? "Edit Guest" : "Add Guest"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveGuest();
          }}
          className="space-y-4"
        >
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                First Name *
              </label>
              <Input
                placeholder="First name"
                value={guestForm.firstName}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, firstName: e.target.value })
                }
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Last Name
              </label>
              <Input
                placeholder="Last name"
                value={guestForm.lastName}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, lastName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Party & Attendance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Party</label>
              <select
                value={guestForm.party}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, party: e.target.value })
                }
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {PARTY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Attendance
              </label>
              <select
                value={guestForm.attendance}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, attendance: e.target.value })
                }
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {ATTENDANCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RSVP & Table */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                RSVP Status
              </label>
              <select
                value={guestForm.rsvpStatus}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, rsvpStatus: e.target.value })
                }
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {RSVP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Table
              </label>
              <Input
                placeholder="e.g. 1, A"
                value={guestForm.tableAssignment}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, tableAssignment: e.target.value })
                }
              />
            </div>
          </div>

          {/* Household */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Household
            </label>
            <select
              value={guestForm.householdId}
              onChange={(e) =>
                setGuestForm({ ...guestForm, householdId: e.target.value })
              }
              className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">No household</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Plus One */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={guestForm.isPlusOne}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, isPlusOne: e.target.checked })
                }
                className="rounded border-input w-4 h-4"
              />
              This is a +1
            </label>
          </div>

          {guestForm.isPlusOne && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Plus One of
              </label>
              <select
                value={guestForm.linkedGuestId}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, linkedGuestId: e.target.value })
                }
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Select guest...</option>
                {nonPlusOneGuests
                  .filter((g) => !editingGuest || g.id !== editingGuest.id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.firstName} {g.lastName}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Show more / less toggle */}
          <button
            type="button"
            onClick={() => setShowMoreFields(!showMoreFields)}
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            {showMoreFields ? (
              <>
                <ChevronDown className="w-3 h-3" /> Less details
              </>
            ) : (
              <>
                <ChevronRight className="w-3 h-3" /> More details
              </>
            )}
          </button>

          {showMoreFields && (
            <>
              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={guestForm.email}
                    onChange={(e) =>
                      setGuestForm({ ...guestForm, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Phone
                  </label>
                  <Input
                    placeholder="Phone"
                    value={guestForm.phone}
                    onChange={(e) =>
                      setGuestForm({ ...guestForm, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Dietary Requirements
                </label>
                <Input
                  placeholder="e.g. Vegetarian, Vegan"
                  value={guestForm.dietaryRequirements}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      dietaryRequirements: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Allergies
                </label>
                <Input
                  placeholder="e.g. Nuts, Gluten"
                  value={guestForm.allergies}
                  onChange={(e) =>
                    setGuestForm({ ...guestForm, allergies: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Accessibility Needs
                </label>
                <Input
                  placeholder="e.g. Wheelchair access"
                  value={guestForm.accessibilityNeeds}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      accessibilityNeeds: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Notes
                </label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={guestForm.notes}
                  onChange={(e) =>
                    setGuestForm({ ...guestForm, notes: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={!guestForm.firstName.trim()}
            >
              {editingGuest ? "Save Changes" : "Add Guest"}
            </Button>
            {editingGuest && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => deleteGuest(editingGuest.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Guest
              </Button>
            )}
          </div>
        </form>
      </Sheet>

      {/* Household Sheet */}
      <Sheet
        open={showHouseholdSheet}
        onClose={() => {
          setShowHouseholdSheet(false);
          setEditingHousehold(null);
        }}
        title={editingHousehold ? "Edit Household" : "Add Household"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveHousehold();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Household Name *
            </label>
            <Input
              placeholder="e.g. The Smith Family"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Postal Address
            </label>
            <Textarea
              placeholder="Full postal address for invitations..."
              value={householdAddress}
              onChange={(e) => setHouseholdAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={!householdName.trim()}
            >
              {editingHousehold ? "Save Changes" : "Add Household"}
            </Button>
            {editingHousehold && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => deleteHousehold(editingHousehold.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Household
              </Button>
            )}
          </div>
        </form>
      </Sheet>
    </div>
  );
}
