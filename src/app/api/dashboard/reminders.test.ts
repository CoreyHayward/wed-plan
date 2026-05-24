import test from "node:test";
import assert from "node:assert/strict";

import { buildVendorReminders } from "./reminders";

const baseVendor = {
  id: 1,
  name: "Venue",
  categoryId: 10,
  price: 1000,
  totalPaid: 0,
  depositPaid: 0,
  depositDueDate: "2026-05-01",
  finalPaymentDueDate: "2026-06-01",
};

test("does not show a deposit overdue reminder once the deposit is paid", () => {
  const reminders = buildVendorReminders({
    ...baseVendor,
    depositPaid: 250,
    totalPaid: 250,
  }, "Ceremony", new Date("2026-05-24T12:00:00Z"));

  assert.equal(
    reminders.some((reminder) => reminder.type === "deposit"),
    false
  );
});

test("does not show a final payment overdue reminder once the balance is fully paid", () => {
  const reminders = buildVendorReminders({
    ...baseVendor,
    depositPaid: 250,
    totalPaid: 1000,
  }, "Ceremony", new Date("2026-05-24T12:00:00Z"));

  assert.equal(
    reminders.some((reminder) => reminder.type === "final"),
    false
  );
});
