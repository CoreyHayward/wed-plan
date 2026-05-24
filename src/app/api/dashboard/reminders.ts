export type Reminder = {
  vendorId: number;
  vendorName: string;
  categoryId: number;
  categoryName: string;
  type: "deposit" | "final";
  dueDate: string;
  daysUntil: number;
  status: "overdue" | "today" | "upcoming";
};

export type VendorReminderSource = {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  depositPaid: number;
  totalPaid: number;
  depositDueDate: string | null;
  finalPaymentDueDate: string | null;
};

const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

export const buildReminder = (
  dueDate: string,
  type: "deposit" | "final",
  vendor: Pick<VendorReminderSource, "id" | "name" | "categoryId">,
  categoryName: string,
  today: Date = new Date()
): Reminder => {
  const todayUtc = new Date(`${dateOnly(today)}T00:00:00Z`);
  const dueUtc = new Date(`${dueDate}T00:00:00Z`);
  const daysUntil = Math.round((dueUtc.getTime() - todayUtc.getTime()) / 86400000);

  return {
    vendorId: vendor.id,
    vendorName: vendor.name,
    categoryId: vendor.categoryId,
    categoryName,
    type,
    dueDate,
    daysUntil,
    status: daysUntil < 0 ? "overdue" : daysUntil === 0 ? "today" : "upcoming",
  };
};

export const buildVendorReminders = (
  vendor: VendorReminderSource,
  categoryName: string,
  today: Date = new Date()
): Reminder[] => {
  const reminders: Reminder[] = [];

  if (vendor.depositDueDate && vendor.depositPaid <= 0) {
    reminders.push(buildReminder(vendor.depositDueDate, "deposit", vendor, categoryName, today));
  }

  if (vendor.finalPaymentDueDate && vendor.totalPaid < vendor.price) {
    reminders.push(buildReminder(vendor.finalPaymentDueDate, "final", vendor, categoryName, today));
  }

  return reminders;
};
