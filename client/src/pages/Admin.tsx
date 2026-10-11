import { FormEvent, Fragment, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  buildSizePayload,
  minPrice,
  parseSizePrices,
  parseSizes,
  type SizeRow,
} from "@/lib/products";
import { OrderStatusPill } from "./CommercePages";
import { DELIVERY_ZONE_LABELS, deliveryFeeFor } from "@shared/order";
import { ImagePicker } from "@/components/ImagePicker";
import { toast } from "sonner";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Database,
  Download,
  Eye,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Package,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";

const menu = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Products", path: "/admin/products", icon: Package },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Coupons", path: "/admin/coupons", icon: Tag },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];
// Old URLs keep working: Inventory folded into Products (stock +/- lives in
// the table), Analytics folded into Overview (status + top products panels).
const legacyTabMap: Record<string, string> = {
  "/admin/inventory": "/admin/products",
  "/admin/analytics": "/admin",
};
const statusOptions = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

function AdminLogin() {
  const [, setLocation] = useLocation();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.admin.login.useMutation({
    onSuccess: async () => {
      toast.success("Welcome to the UKIZ-BD control room.");
      await utils.admin.me.invalidate();
      setLocation("/admin");
    },
    onError: () => toast.error("That admin ID or password is not correct."),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ id, password });
  };
  return (
    <div className="min-h-screen bg-[#151515] text-[#f5f0e6]">
      <div className="grid min-h-screen md:grid-cols-[.95fr_1.05fr]">
        <div className="hero-grid hero-glow relative hidden overflow-hidden p-12 md:flex md:flex-col md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/ukiz-bd-logo.png"
              alt="UKIZ-BD logo"
              className="h-9 w-9 rounded-full border border-white/30 object-cover"
            />
            <span className="text-[13px] font-extrabold tracking-[.22em]">
              UKIZ-BD
            </span>
          </div>
          <div>
            <div className="eyebrow mb-5 text-[#c7a970]">
              Private access / 00
            </div>
            <h1 className="display max-w-xl text-[clamp(3.8rem,6vw,6.7rem)]">
              Your business,
              <br />
              <em className="text-[#c7a970]">considered.</em>
            </h1>
            <p className="mt-7 max-w-sm text-sm leading-relaxed text-white/50">
              The quiet side of UKIZ-BD — where every order, bottle and note
              comes together.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[.13em] text-white/35">
            <ShieldCheck size={14} className="text-[#c7a970]" /> Protected
            workspace
          </div>
        </div>
        <div className="flex items-center justify-center bg-[#f3f0e9] px-6 py-16 text-[#151515] md:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 md:hidden">
              <div className="text-[13px] font-extrabold tracking-[.22em]">
                UKIZ-BD
              </div>
            </div>
            <div className="eyebrow mb-4">Admin portal</div>
            <h2 className="display text-5xl md:text-6xl">Good to see you.</h2>
            <p className="mt-5 text-sm leading-relaxed text-[#777269]">
              Sign in to manage the edit, fulfill orders and keep the house
              moving.
            </p>
            <form onSubmit={submit} className="mt-10 grid gap-6">
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">
                Admin ID
                <input
                  value={id}
                  onChange={event => setId(event.target.value)}
                  autoComplete="username"
                  required
                  className="border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none focus:border-[#a4824e]"
                />
              </label>
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">
                Password
                <input
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  className="border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none focus:border-[#a4824e]"
                />
              </label>
              <button
                disabled={login.isPending}
                className="primary-button dark mt-3 w-full disabled:opacity-50"
              >
                {login.isPending ? "Checking access..." : "Enter dashboard"}{" "}
                <ArrowRight size={14} />
              </button>
            </form>
            <div className="mt-6 flex items-center gap-2 text-xs text-[#918a7f]">
              <ShieldCheck size={13} className="text-[#a4824e]" /> Session
              protected with an httpOnly cookie
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#f8f6f0] p-5">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9e1d2] text-[#a4824e]">
          <Icon size={17} />
        </span>
        <span className="text-xs font-bold text-[#7b936e]">{change}</span>
      </div>
      <div className="mt-6 text-xs uppercase tracking-[.13em] text-[#918a7f]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-[-.04em]">
        {value}
      </div>
    </div>
  );
}

function CouponsSection() {
  const utils = trpc.useUtils();
  const list = trpc.admin.coupons.list.useQuery();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState(10);
  const [minSubtotal, setMinSubtotal] = useState(0);
  const [expiresAt, setExpiresAt] = useState("");
  const refresh = async () => {
    await utils.admin.coupons.list.invalidate();
  };
  const create = trpc.admin.coupons.create.useMutation({
    onSuccess: async () => {
      toast.success("Coupon created — customers can use it now.");
      setCode("");
      setType("percent");
      setValue(10);
      setMinSubtotal(0);
      setExpiresAt("");
      await refresh();
    },
    onError: error => toast.error(error.message || "Could not create coupon."),
  });
  const update = trpc.admin.coupons.update.useMutation({
    onSuccess: async () => {
      toast.success("Coupon updated.");
      await refresh();
    },
    onError: () => toast.error("Could not update coupon."),
  });
  const remove = trpc.admin.coupons.remove.useMutation({
    onSuccess: async () => {
      toast.success("Coupon deleted.");
      await refresh();
    },
    onError: () => toast.error("Could not delete coupon."),
  });
  const submit = () => {
    if (!code.trim()) {
      toast.error("Coupon code is required.");
      return;
    }
    if (!value || value < 1) {
      toast.error("Discount value must be at least 1.");
      return;
    }
    create.mutate({
      code: code.trim(),
      type,
      value: Math.floor(value),
      minSubtotal: Math.max(0, Math.floor(minSubtotal) || 0),
      expiresAt: expiresAt || undefined,
    });
  };
  const rows = list.data ?? [];
  return (
    <>
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="eyebrow">Coupons / {rows.length}</div>
          <div className="mt-2 text-xl font-semibold">
            Discounts worth coming back for.
          </div>
        </div>
      </div>
      <div className="mb-6 rounded-2xl border border-black/10 bg-white p-5 md:p-6">
        <div className="eyebrow mb-4">New coupon</div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
            Code
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="EID10"
              className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-[#a4824e]"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
            Type
            <select
              value={type}
              onChange={e => setType(e.target.value as "percent" | "flat")}
              className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none"
            >
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (৳)</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
            Value
            <input
              type="number"
              min={1}
              value={value}
              onChange={e => setValue(Number(e.target.value))}
              className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a4824e]"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
            Min. order (৳)
            <input
              type="number"
              min={0}
              value={minSubtotal}
              onChange={e => setMinSubtotal(Number(e.target.value))}
              className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a4824e]"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
            Expires on
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none"
            />
          </label>
          <div className="flex items-end">
            <button
              onClick={submit}
              disabled={create.isPending}
              className="primary-button dark py-2 disabled:opacity-50"
            >
              {create.isPending ? "Creating..." : "Create coupon"}
            </button>
          </div>
        </div>
      </div>
      {list.isLoading ? (
        <div className="py-10 text-center text-sm text-[#918a7f]">
          Loading coupons...
        </div>
      ) : list.isError ? (
        <div className="py-10 text-center text-sm">
          <p className="text-red-600">Could not load coupons.</p>
          <button
            onClick={() => list.refetch()}
            className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-[.13em] text-[#918a7f]">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th>Discount</th>
                <th>Min. order</th>
                <th>Expires</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-black/8">
                  <td className="px-5 py-4 font-bold tracking-[.08em]">
                    {row.code}
                  </td>
                  <td>
                    {row.type === "flat"
                      ? `৳${row.value.toLocaleString("en-BD")}`
                      : `${row.value}%`}
                  </td>
                  <td>
                    {row.minSubtotal > 0
                      ? `৳${row.minSubtotal.toLocaleString("en-BD")}`
                      : "—"}
                  </td>
                  <td>
                    {row.expiresAt
                      ? new Date(row.expiresAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "No expiry"}
                  </td>
                  <td>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-[.08em] ${row.active === "yes" ? "bg-[#dce8d6] text-[#54724c]" : "bg-black/10 text-[#777269]"}`}
                    >
                      {row.active === "yes" ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2 px-5">
                      <input
                        type="date"
                        title="Expiry date"
                        defaultValue={
                          row.expiresAt
                            ? new Date(row.expiresAt).toISOString().slice(0, 10)
                            : ""
                        }
                        onChange={e =>
                          update.mutate({
                            id: row.id,
                            expiresAt: e.target.value || null,
                          })
                        }
                        className="rounded-full border border-black/15 bg-white px-3 py-1 text-xs outline-none"
                      />
                      <button
                        onClick={() =>
                          update.mutate({
                            id: row.id,
                            active: row.active === "yes" ? "no" : "yes",
                          })
                        }
                        className="rounded-full border border-black/15 px-3 py-1 text-xs font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
                      >
                        {row.active === "yes" ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${row.code}?`))
                            remove.mutate({ id: row.id });
                        }}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-bold uppercase tracking-[.1em] text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-10 text-center text-sm text-[#918a7f]">
              No coupons yet. Create one above.
            </div>
          )}
        </div>
      )}
    </>
  );
}

function SettingsSection() {
  const utils = trpc.useUtils();
  const data = trpc.admin.settings.get.useQuery();
  const dbStatus = trpc.admin.settings.dbStatus.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const [form, setForm] = useState({
    announcement: "",
    merchantNumber: "",
    supportEmail: "",
    supportPhone: "",
    freeThreshold: 3000,
  });
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (data.data && !dirty) {
      setForm({
        announcement: data.data.announcement ?? "",
        merchantNumber: data.data.merchantNumber ?? "",
        supportEmail: data.data.supportEmail ?? "",
        supportPhone: data.data.supportPhone ?? "",
        freeThreshold: Number(data.data.freeThreshold) || 3000,
      });
    }
  }, [data.data, dirty]);
  const save = trpc.admin.settings.save.useMutation({
    onSuccess: async () => {
      toast.success("Settings saved — live on the site now.");
      setDirty(false);
      await utils.settings.public.invalidate();
      await data.refetch();
    },
    onError: error => toast.error(error.message || "Could not save settings."),
  });
  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDirty(true);
      setForm(f => ({
        ...f,
        [key]:
          key === "freeThreshold" ? Number(e.target.value) : e.target.value,
      }));
    };
  // ---- Validation (mirrors server zod rules) ----
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    form.supportEmail.trim()
  );
  const bdPhone = (v: string) => v.trim() === "" || /^01\d{9}$/.test(v.trim());
  const merchantValid = form.merchantNumber.trim().length >= 6;
  const phoneValid = bdPhone(form.supportPhone);
  const thresholdValid =
    Number.isFinite(form.freeThreshold) && form.freeThreshold >= 0;
  const formValid = emailValid && merchantValid && phoneValid && thresholdValid;
  const discard = () => {
    if (data.data) {
      setForm({
        announcement: data.data.announcement ?? "",
        merchantNumber: data.data.merchantNumber ?? "",
        supportEmail: data.data.supportEmail ?? "",
        supportPhone: data.data.supportPhone ?? "",
        freeThreshold: Number(data.data.freeThreshold) || 3000,
      });
    }
    setDirty(false);
  };
  const saveAll = () => {
    if (!formValid) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    save.mutate({
      announcement: form.announcement.trim(),
      merchantNumber: form.merchantNumber.trim(),
      supportEmail: form.supportEmail.trim(),
      supportPhone: form.supportPhone.trim(),
      freeThreshold: Math.max(0, Math.floor(form.freeThreshold) || 0),
    });
  };
  const threshold = Math.max(0, Math.floor(form.freeThreshold) || 0);
  const inputCls = (ok: boolean) =>
    `rounded-lg border bg-white px-3 py-2.5 text-sm font-normal outline-none transition-colors ${ok ? "border-black/15 focus:border-[#a4824e]" : "border-red-400 focus:border-red-500"}`;
  const errCls =
    "mt-1 text-xs font-normal normal-case tracking-normal text-red-600";
  return (
    <>
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="eyebrow flex items-center gap-2">
            Settings
            {dirty && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#f2ddcf] px-2.5 py-0.5 text-xs font-bold uppercase tracking-[.1em] text-[#9c614b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9c614b]" />
                Unsaved changes
              </span>
            )}
          </div>
          <div className="mt-2 text-xl font-semibold">
            How the shop talks to customers.
          </div>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <button
              onClick={discard}
              disabled={save.isPending}
              className="secondary-button py-2 disabled:opacity-50"
            >
              <RotateCcw size={13} /> Discard
            </button>
          )}
          <button
            onClick={saveAll}
            disabled={save.isPending || !dirty}
            className="primary-button dark py-2 disabled:opacity-50"
          >
            {save.isPending ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
      {data.isLoading ? (
        <div className="py-10 text-center text-sm text-[#918a7f]">
          Loading settings...
        </div>
      ) : data.isError ? (
        <div className="py-10 text-center text-sm">
          <p className="text-red-600">Could not load settings.</p>
          <button
            onClick={() => data.refetch()}
            className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* ---- Database ---- */}
          <section className="rounded-2xl border border-black/10 bg-white p-5 md:p-8">
            <div className="mb-1 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9e1d2] text-[#a4824e]">
                <Database size={17} />
              </span>
              <div className="flex-1">
                <h3 className="font-semibold">Database</h3>
                <p className="text-xs text-[#918a7f]">
                  Where products, orders and customers are stored.
                </p>
              </div>
              {dbStatus.isLoading ? (
                <span className="rounded-full bg-black/10 px-2.5 py-1 text-xs uppercase tracking-[.08em] text-[#777269]">
                  Checking…
                </span>
              ) : dbStatus.data?.connected ? (
                <span className="rounded-full bg-[#dce8d6] px-2.5 py-1 text-xs uppercase tracking-[.08em] text-[#54724c]">
                  ● Supabase live
                </span>
              ) : (
                <span className="rounded-full bg-[#f2ddcf] px-2.5 py-1 text-xs uppercase tracking-[.08em] text-[#9c614b]">
                  ● In-memory fallback
                </span>
              )}
            </div>
            {dbStatus.isError ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#f8f6f0] px-4 py-3 text-xs">
                <span className="text-red-600">
                  Could not check the database.
                </span>
                <button
                  onClick={() => dbStatus.refetch()}
                  className="shrink-0 rounded-full border border-black/15 px-3 py-1 text-xs font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
                >
                  Retry
                </button>
              </div>
            ) : dbStatus.data && !dbStatus.data.connected ? (
              <div className="mt-4 rounded-xl bg-[#fdf6ef] px-4 py-3 text-xs leading-relaxed text-[#777269]">
                <p className="font-semibold text-[#9c614b]">
                  Supabase is not connected.
                </p>
                <p className="mt-1">{dbStatus.data.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => dbStatus.refetch()}
                    className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
                  >
                    Check again
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#a39b90]">
                  Fix: Supabase Dashboard → Project Settings → Database → copy
                  the Transaction-pooler URI (port 6543) into
                  <code className="mx-1 rounded bg-black/5 px-1">
                    DATABASE_URL
                  </code>
                  in
                  <code className="mx-1 rounded bg-black/5 px-1">.env</code>,
                  then restart the server.
                </p>
              </div>
            ) : dbStatus.data?.connected ? (
              <p className="mt-4 rounded-xl bg-[#f2f7f0] px-4 py-3 text-xs text-[#54724c]">
                {dbStatus.data.message}
              </p>
            ) : null}
          </section>

          {/* ---- Storefront ---- */}
          <section className="rounded-2xl border border-black/10 bg-white p-5 md:p-8">
            <div className="mb-1 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9e1d2] text-[#a4824e]">
                <Megaphone size={17} />
              </span>
              <div>
                <h3 className="font-semibold">Storefront</h3>
                <p className="text-xs text-[#918a7f]">
                  Top announcement bar shown on every page.
                </p>
              </div>
            </div>
            <label className="mt-5 grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
              <span className="flex items-center justify-between">
                Announcement
                <span
                  className={`font-normal normal-case tracking-normal ${form.announcement.length > 300 ? "text-red-600" : "text-[#a39b90]"}`}
                >
                  {form.announcement.length}/300
                </span>
              </span>
              <textarea
                rows={2}
                maxLength={320}
                value={form.announcement}
                onChange={set("announcement")}
                placeholder="Complimentary delivery over ৳3,000 ✳ Authenticity, always"
                className={inputCls(form.announcement.length <= 300)}
              />
            </label>
            {form.announcement.length > 300 && (
              <p className={errCls}>Keep it under 300 characters.</p>
            )}
            <div className="mt-4 overflow-hidden rounded-xl border border-black/10">
              <div className="flex items-center gap-2 bg-[#1a1a18] px-4 py-2 text-xs uppercase tracking-[.13em] text-white/40">
                <Eye size={12} /> Live preview — announcement bar
              </div>
              <div className="bg-[#c7a970] px-4 py-2.5 text-center text-xs font-semibold text-[#151515]">
                {form.announcement.trim() ||
                  "Your announcement will appear here…"}
              </div>
            </div>
          </section>

          {/* ---- Payments ---- */}
          <section className="rounded-2xl border border-black/10 bg-white p-5 md:p-8">
            <div className="mb-1 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9e1d2] text-[#a4824e]">
                <Wallet size={17} />
              </span>
              <div>
                <h3 className="font-semibold">Payments</h3>
                <p className="text-xs text-[#918a7f]">
                  Shown at checkout for bKash / Nagad manual payments.
                </p>
              </div>
            </div>
            <label className="mt-5 grid max-w-md gap-1 text-xs font-bold uppercase tracking-[.1em]">
              bKash / Nagad Send Money number
              <input
                value={form.merchantNumber}
                onChange={set("merchantNumber")}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                className={inputCls(merchantValid)}
              />
            </label>
            {!merchantValid && (
              <p className={errCls}>Merchant number is required.</p>
            )}
            <div className="mt-4 max-w-md overflow-hidden rounded-xl border border-black/10">
              <div className="flex items-center gap-2 bg-[#1a1a18] px-4 py-2 text-xs uppercase tracking-[.13em] text-white/40">
                <Eye size={12} /> Live preview — checkout
              </div>
              <div className="bg-[#f8f6f0] px-4 py-3 text-xs leading-relaxed text-[#777269]">
                Send Money to{" "}
                <span className="font-bold text-[#151515]">
                  {form.merchantNumber.trim() || "—"}
                </span>{" "}
                (bKash / Nagad), then enter the TrxID below.
              </div>
            </div>
          </section>

          {/* ---- Support ---- */}
          <section className="rounded-2xl border border-black/10 bg-white p-5 md:p-8">
            <div className="mb-1 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9e1d2] text-[#a4824e]">
                <Mail size={17} />
              </span>
              <div>
                <h3 className="font-semibold">Support</h3>
                <p className="text-xs text-[#918a7f]">
                  Contact page, footers and order invoices.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                Support email
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={set("supportEmail")}
                  placeholder="hello@ukizbd.com"
                  className={inputCls(emailValid)}
                />
                {!emailValid && (
                  <span className={errCls}>Enter a valid email address.</span>
                )}
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                <span className="flex items-center gap-1.5">
                  <Phone size={11} /> Support phone (optional)
                </span>
                <input
                  value={form.supportPhone}
                  onChange={set("supportPhone")}
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                  className={inputCls(phoneValid)}
                />
                {!phoneValid && (
                  <span className={errCls}>
                    Use 11 digits starting with 01, or leave empty.
                  </span>
                )}
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {emailValid && (
                <a
                  href={`mailto:${form.supportEmail.trim()}`}
                  className="rounded-full border border-black/15 px-3 py-1.5 font-semibold hover:bg-black hover:text-white"
                >
                  ✉ {form.supportEmail.trim()}
                </a>
              )}
              {form.supportPhone.trim() && phoneValid && (
                <a
                  href={`tel:${form.supportPhone.trim()}`}
                  className="rounded-full border border-black/15 px-3 py-1.5 font-semibold hover:bg-black hover:text-white"
                >
                  ☎ {form.supportPhone.trim()}
                </a>
              )}
            </div>
          </section>

          {/* ---- Shipping ---- */}
          <section className="rounded-2xl border border-black/10 bg-white p-5 md:p-8">
            <div className="mb-1 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9e1d2] text-[#a4824e]">
                <Truck size={17} />
              </span>
              <div>
                <h3 className="font-semibold">Shipping</h3>
                <p className="text-xs text-[#918a7f]">
                  Free-delivery threshold applied at checkout.
                </p>
              </div>
            </div>
            <label className="mt-5 grid max-w-md gap-1 text-xs font-bold uppercase tracking-[.1em]">
              Free delivery over (৳)
              <input
                type="number"
                min={0}
                value={form.freeThreshold}
                onChange={set("freeThreshold")}
                className={inputCls(thresholdValid)}
              />
            </label>
            {!thresholdValid && (
              <p className={errCls}>Threshold must be 0 or more.</p>
            )}
            <div className="mt-4 grid max-w-md gap-2 text-xs">
              {(["inside", "near", "outside"] as const).map(z => {
                const fee = deliveryFeeFor(z, threshold - 1, threshold);
                return (
                  <div
                    key={z}
                    className="flex items-center justify-between rounded-xl bg-[#f8f6f0] px-4 py-2.5"
                  >
                    <span className="text-[#777269]">
                      {(DELIVERY_ZONE_LABELS as Record<string, string>)[z] ?? z}
                      {" · "}৳{(threshold - 1).toLocaleString("en-BD")} order
                    </span>
                    <span className="font-bold">
                      {fee === 0 ? "Free" : `৳${fee.toLocaleString("en-BD")}`}
                    </span>
                  </div>
                );
              })}
              <p className="text-xs leading-relaxed text-[#918a7f]">
                Orders of ৳{threshold.toLocaleString("en-BD")} or more ship free
                in every zone.
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("Last 30 days");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [ordersLimit, setOrdersLimit] = useState(100);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const hour = new Date().getHours();
  const dayGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    family: "",
    notes: "",
    price: 0,
    image: "",
    badge: "",
    tone: "#d7c1a0",
    stock: 0,
    status: "In stock" as "In stock" | "Low stock" | "Out of stock",
    audience: "Unisex",
    vibe: "",
    type: "",
    premiumName: "",
    premiumPrice: 0,
    premiumStock: 0,
    sizeRows: [{ size: "50ml", price: 0, stock: 0 }] as SizeRow[],
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    family: "",
    notes: "",
    price: 0,
    sizes: '["50ml"]',
    image: "",
    badge: "",
    tone: "#d7c1a0",
    audience: "Unisex",
    vibe: "",
    type: "",
    premiumName: "",
    premiumPrice: 0,
    premiumStock: 0,
  });
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([
    { size: "50ml", price: 0, stock: 0 },
  ]);
  const auth = trpc.admin.me.useQuery(undefined, {
    refetchOnMount: "always",
    staleTime: 0,
  });
  const utils = trpc.useUtils();
  const logout = trpc.admin.logout.useMutation({
    onSuccess: async () => {
      await utils.admin.me.invalidate();
      setLocation("/admin/login");
    },
  });
  useEffect(() => {
    if (!auth.isLoading && auth.data && !auth.data.authenticated) {
      setLocation("/admin/login");
    }
  }, [auth.isLoading, auth.data, setLocation]);
  const {
    data: products = [],
    refetch,
    isLoading: productsLoading,
    isError: productsError,
  } = trpc.products.list.useQuery(undefined, {
    enabled: auth.data?.authenticated,
  });

  const invalidateAll = async () => {
    await utils.products.list.invalidate();
    await refetch();
  };

  const addProduct = trpc.products.create.useMutation({
    onSuccess: async () => {
      toast.success("Product added — live on user pages too.");
      setIsAdding(false);
      setNewProduct({
        name: "",
        brand: "",
        family: "",
        notes: "",
        price: 0,
        sizes: '["50ml"]',
        image: "",
        badge: "",
        tone: "#d7c1a0",
        audience: "Unisex",
        vibe: "",
        type: "",
        premiumName: "",
        premiumPrice: 0,
        premiumStock: 0,
      });
      setSizeRows([{ size: "50ml", price: 0, stock: 0 }]);
      await invalidateAll();
    },
    onError: () => toast.error("Could not add product."),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: async () => {
      toast.success("Product updated — live on user pages too.");
      setEditingId(null);
      await invalidateAll();
    },
    onError: () => toast.error("Could not update product."),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: async () => {
      toast.success("Product deleted — removed from user pages too.");
      await invalidateAll();
    },
    onError: () => toast.error("Could not delete product."),
  });

  const startEdit = (row: (typeof products)[number]) => {
    setEditingId(row.id);
    const sizes = parseSizes(row.sizes);
    const prices = parseSizePrices(row.sizePrices);
    const stocks = parseSizePrices(row.sizeStocks);
    const rows: SizeRow[] = sizes.map(size => ({
      size,
      price: prices[size] ?? row.price,
      stock: stocks[size] ?? 0,
    }));
    setEditForm({
      name: row.name,
      brand: row.brand,
      family: row.family,
      notes: row.notes,
      price: row.price,
      image: row.image,
      badge: row.badge ?? "",
      tone: row.tone,
      stock: row.stock ?? 0,
      status:
        (row.status as "In stock" | "Low stock" | "Out of stock") ?? "In stock",
      audience: (row.audience as "Men" | "Women" | "Unisex") ?? "Unisex",
      vibe: row.vibe ?? "",
      type: row.type ?? "",
      premiumName: row.premiumName ?? "",
      premiumPrice: row.premiumPrice ?? 0,
      premiumStock: row.premiumStock ?? 0,
      sizeRows:
        rows.length > 0
          ? rows
          : [{ size: "50ml", price: row.price, stock: row.stock ?? 0 }],
    });
  };

  const saveNewProduct = () => {
    const name = newProduct.name.trim();
    const brand = newProduct.brand.trim();
    if (!name) {
      toast.error("Product name is required.");
      return;
    }
    if (!brand) {
      toast.error("Brand is required.");
      return;
    }
    const payload = buildSizePayload(sizeRows);
    addProduct.mutate({
      name,
      brand,
      family: newProduct.family.trim(),
      notes: newProduct.notes.trim(),
      image: newProduct.image.trim(),
      badge: newProduct.badge.trim() || undefined,
      tone: newProduct.tone,
      price: payload.price,
      sizes: payload.sizes,
      sizePrices: payload.sizePrices,
      sizeStocks: payload.sizeStocks,
      stock: payload.stock,
      audience: newProduct.audience as "Men" | "Women" | "Unisex",
      vibe: newProduct.vibe.trim() || undefined,
      type: newProduct.type.trim() || undefined,
      premiumName: newProduct.premiumName.trim() || undefined,
      premiumPrice:
        newProduct.premiumPrice > 0
          ? Math.floor(newProduct.premiumPrice)
          : undefined,
      premiumStock: Math.max(0, Math.floor(newProduct.premiumStock) || 0),
    });
  };

  const saveEdit = (id: number) => {
    const name = editForm.name.trim();
    const brand = editForm.brand.trim();
    if (!name) {
      toast.error("Product name is required.");
      return;
    }
    if (!brand) {
      toast.error("Brand is required.");
      return;
    }
    const payload = buildSizePayload(editForm.sizeRows);
    updateProduct.mutate({
      id,
      name,
      brand,
      family: editForm.family,
      notes: editForm.notes,
      image: editForm.image,
      badge: editForm.badge || null,
      tone: editForm.tone,
      stock: payload.stock,
      status: editForm.status,
      price: payload.price,
      sizes: payload.sizes,
      sizePrices: payload.sizePrices,
      sizeStocks: payload.sizeStocks,
      audience: editForm.audience as "Men" | "Women" | "Unisex",
      vibe: editForm.vibe.trim() || null,
      type: editForm.type.trim() || null,
      premiumName: editForm.premiumName.trim() || null,
      premiumPrice:
        editForm.premiumPrice > 0 ? Math.floor(editForm.premiumPrice) : null,
      premiumStock: Math.max(0, Math.floor(editForm.premiumStock) || 0),
    });
  };

  const filteredProducts = products.filter(row =>
    (row.name + " " + row.brand).toLowerCase().includes(query.toLowerCase())
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const customersQuery = trpc.customers.list.useQuery(undefined, {
    enabled: auth.data?.authenticated,
  });
  const filteredCustomers = (customersQuery.data ?? []).filter(row =>
    `${row.name} ${row.email} ${row.phone ?? ""}`
      .toLowerCase()
      .includes(customerSearch.toLowerCase())
  );
  const ordersQuery = trpc.admin.orders.useQuery(
    { limit: ordersLimit, offset: 0 },
    {
      enabled: auth.data?.authenticated,
    }
  );
  const liveOrders = ordersQuery.data ?? [];
  const updateOrderStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: async () => {
      toast.success("Order status updated.");
      setUpdatingOrderId(null);
      await ordersQuery.refetch();
    },
    onError: () => {
      toast.error("Could not update the order status.");
      setUpdatingOrderId(null);
    },
  });
  const filteredOrders = liveOrders.filter(order => {
    const t = new Date(order.createdAt).getTime();
    if (exportFrom && t < new Date(`${exportFrom}T00:00:00`).getTime())
      return false;
    if (exportTo && t > new Date(`${exportTo}T23:59:59`).getTime())
      return false;
    const q = orderSearch.trim().toLowerCase();
    if (q) {
      const hay =
        `#ukiz-${order.id} ${order.id} ${order.customerName} ${order.customerEmail} ${order.phone ?? ""} ${order.trxId ?? ""} ${order.status}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportOrders = (format: "excel" | "json") => {
    if (filteredOrders.length === 0) {
      toast.error("No orders in this date range.");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "json") {
      downloadFile(
        `ukiz-orders-${stamp}.json`,
        JSON.stringify(filteredOrders, null, 2),
        "application/json"
      );
    } else {
      const esc = (value: unknown) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;
      const head = [
        "Order",
        "Date",
        "Customer",
        "Email",
        "Phone",
        "Address",
        "Zone",
        "Payment",
        "TrxID",
        "Sender",
        "Subtotal",
        "Delivery",
        "Total",
        "Paid",
        "Due",
        "Status",
        "Items",
      ];
      const lines = filteredOrders.map(order =>
        [
          `#UKIZ-${order.id}`,
          new Date(order.createdAt).toLocaleString("en-GB"),
          order.customerName,
          order.customerEmail,
          order.phone ?? "",
          `${order.name} - ${order.address ?? ""}`,
          (DELIVERY_ZONE_LABELS as Record<string, string>)[order.zone ?? ""] ??
            order.zone ??
            "",
          order.paymentMethod === "online" ? "bKash/Nagad" : "COD",
          order.trxId ?? "",
          order.senderNumber ?? "",
          order.subtotal,
          order.delivery,
          order.total,
          order.paidAmount ?? 0,
          Math.max(0, order.total - (order.paidAmount ?? 0)),
          order.status,
          order.items
            .map(
              item =>
                `${item.name} ${item.size} x${item.quantity}${item.premium ? ` +${item.premium}` : ""}`
            )
            .join("; "),
        ]
          .map(esc)
          .join(",")
      );
      downloadFile(
        `ukiz-orders-${stamp}.csv`,
        "\uFEFF" + head.map(esc).join(",") + "\n" + lines.join("\n"),
        "text/csv;charset=utf-8"
      );
    }
    toast.success(
      `Exported ${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"}.`
    );
  };
  const rangeDays =
    range === "Last 7 days"
      ? 7
      : range === "This month"
        ? new Date().getDate()
        : 30;
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  if (range === "This month") {
    rangeStart.setDate(1);
  } else {
    rangeStart.setDate(rangeStart.getDate() - (rangeDays - 1));
  }
  const buckets: { key: string; label: string; total: number }[] = [];
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(rangeStart);
    d.setDate(rangeStart.getDate() + i);
    buckets.push({
      key: d.toDateString(),
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      total: 0,
    });
  }
  const bucketMap = new Map(buckets.map(b => [b.key, b]));
  liveOrders.forEach(order => {
    const bucket = bucketMap.get(new Date(order.createdAt).toDateString());
    if (bucket) bucket.total += order.total;
  });
  const maxBucket = Math.max(1, ...buckets.map(b => b.total));
  const rangeRevenue = buckets.reduce((sum, b) => sum + b.total, 0);
  const rangeOrders = liveOrders.filter(
    order => new Date(order.createdAt) >= rangeStart
  ).length;
  const lowStock: { id: number; name: string; detail: string; left: string }[] =
    [];
  products.forEach(p => {
    const stocks = parseSizePrices(p.sizeStocks);
    const entries = Object.entries(stocks);
    const totalStock =
      entries.length > 0
        ? entries.reduce((sum, [, q]) => sum + (q ?? 0), 0)
        : (p.stock ?? 0);
    if (totalStock <= 5)
      lowStock.push({
        id: p.id,
        name: p.name,
        detail:
          entries.length > 0
            ? entries.map(([s, q]) => `${s}: ${q}`).join(" · ")
            : `${p.stock ?? 0} pcs`,
        left: `${totalStock} left`,
      });
  });
  // Previous-period comparison for the revenue metric (real % instead of hardcoded).
  const prevStart = new Date(rangeStart);
  prevStart.setDate(rangeStart.getDate() - rangeDays);
  const prevRevenue = liveOrders
    .filter(order => {
      const t = new Date(order.createdAt);
      return t >= prevStart && t < rangeStart;
    })
    .reduce((sum, o) => sum + o.total, 0);
  const revenueChange =
    prevRevenue === 0
      ? rangeRevenue > 0
        ? "+100%"
        : range
      : `${rangeRevenue >= prevRevenue ? "+" : ""}${Math.round(((rangeRevenue - prevRevenue) / prevRevenue) * 100)}% vs prev`;
  const newCustomers = (customersQuery.data ?? []).filter(
    c => new Date(c.createdAt) >= rangeStart
  ).length;
  // Analytics: status breakdown + top products by revenue in range.
  const statusCounts = new Map<string, number>();
  const productRevenue = new Map<
    string,
    { name: string; qty: number; total: number }
  >();
  liveOrders.forEach(order => {
    if (new Date(order.createdAt) < rangeStart) return;
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    order.items.forEach(item => {
      const key = `${item.name} · ${item.size}`;
      const prev = productRevenue.get(key) ?? { name: key, qty: 0, total: 0 };
      prev.qty += item.quantity;
      prev.total += item.price * item.quantity;
      productRevenue.set(key, prev);
    });
  });
  const topProducts = Array.from(productRevenue.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const maxTop = Math.max(1, ...topProducts.map(t => t.total));
  const pendingOrders = liveOrders.filter(o => o.status === "Pending").length;
  const alertCount = lowStock.length + pendingOrders;
  // Restock shortcut: jump to Products and open the edit form for that item.
  const restockProduct = (id: number) => {
    const row = products.find(p => p.id === id);
    if (!row) {
      toast.error("Product not found.");
      return;
    }
    setLocation("/admin/products");
    setMenuOpen(false);
    startEdit(row);
    setShowAlerts(false);
  };
  // Quick stock +1 for inventory (bumps base stock and first size bucket).
  const quickAdjustStock = (id: number, delta: number) => {
    const row = products.find(p => p.id === id);
    if (!row) return;
    const stocks = parseSizePrices(row.sizeStocks);
    const entries = Object.entries(stocks);
    let sizeStocks: string | undefined;
    if (entries.length > 0) {
      const [firstSize, firstQty] = entries[0];
      sizeStocks = JSON.stringify({
        ...stocks,
        [firstSize]: Math.max(0, (firstQty ?? 0) + delta),
      });
    }
    updateProduct.mutate({
      id,
      stock: Math.max(0, (row.stock ?? 0) + delta),
      ...(sizeStocks ? { sizeStocks } : {}),
    });
  };
  // Path may carry trailing slash or query string — normalise before matching.
  const cleanPath =
    location.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  const resolvedPath = legacyTabMap[cleanPath] ?? cleanPath;
  const current =
    menu.find(item => item.path === resolvedPath) ??
    menu.find(item => item.path === "/admin")!;
  const goTab = (path: string) => {
    setLocation(path);
    setMenuOpen(false);
    setShowAlerts(false);
  };
  // ---- Command palette: tabs + quick actions + products, all searchable ----
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const resetPalette = () => {
    setPaletteQuery("");
    setPaletteOpen(false);
    setPaletteIndex(0);
  };
  type PaletteItem = {
    kind: "tab" | "action" | "product";
    label: string;
    hint: string;
    Icon: typeof Search;
    run: () => void;
  };
  const tabKeywords: Record<string, string> = {
    "/admin": "overview dashboard home revenue sales stats",
    "/admin/products": "products catalogue items stock price add edit inventory",
    "/admin/orders": "orders delivery shipping status pending queue export invoice",
    "/admin/customers": "customers users accounts people buyers",
    "/admin/coupons": "coupons discounts promo voucher offer",
    "/admin/settings": "settings config announcement bkash nagad merchant support email delivery threshold database",
  };
  const paletteQ = paletteQuery.trim().toLowerCase();
  const tabItems: PaletteItem[] = menu
    .filter(
      item =>
        paletteQ === "" ||
        `${item.label} ${tabKeywords[item.path] ?? ""}`
          .toLowerCase()
          .includes(paletteQ)
    )
    .map(item => ({
      kind: "tab" as const,
      label: item.label,
      hint: `Go to ${item.label}`,
      Icon: item.icon as typeof Search,
      run: () => {
        goTab(item.path);
        resetPalette();
      },
    }));
  const actionItems: PaletteItem[] = (
    [
      {
        label: "Add new product",
        hint: "Products · open the create form",
        Icon: Plus,
        match: "add new product create",
        run: () => {
          goTab("/admin/products");
          setIsAdding(true);
          resetPalette();
        },
      },
      {
        label: "Export orders (Excel)",
        hint: "Orders · download CSV",
        Icon: Download,
        match: "export excel csv download orders report",
        run: () => {
          goTab("/admin/orders");
          resetPalette();
          // Let the tab mount before exporting the current filter.
          setTimeout(() => exportOrders("excel"), 150);
        },
      },
      {
        label: "Review pending orders",
        hint: `Orders · ${pendingOrders} waiting`,
        Icon: ClipboardList,
        match: "pending review queue orders waiting",
        run: () => {
          goTab("/admin/orders");
          resetPalette();
        },
      },
    ] as const
  )
    .filter(a => paletteQ === "" || `${a.label} ${a.match}`.toLowerCase().includes(paletteQ))
    .map(a => ({ kind: "action" as const, ...a }));
  const productItems: PaletteItem[] = products
    .filter(
      p =>
        paletteQ !== "" &&
        `${p.name} ${p.brand}`.toLowerCase().includes(paletteQ)
    )
    .slice(0, 5)
    .map(p => ({
      kind: "product" as const,
      label: p.name,
      hint: `${p.brand} · edit product`,
      Icon: Package,
      run: () => {
        setQuery(p.name);
        setLocation("/admin/products");
        setMenuOpen(false);
        startEdit(p);
        resetPalette();
      },
    }));
  const paletteGroups = [
    { title: "Go to", items: tabItems },
    { title: "Actions", items: actionItems },
    { title: "Products", items: productItems },
  ].filter(g => g.items.length > 0);
  const paletteItems = paletteGroups.flatMap(g => g.items);
  const runPaletteItem = (item: PaletteItem) => item.run();
  if (auth.isLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f3f0e9] text-sm text-[#777269]">
        Loading control room...
      </div>
    );
  if (!auth.data?.authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f0e9] text-[#151515]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-black/10 bg-[#1a1a18] p-5 text-[#f5f0e6] flex flex-col transition-transform md:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/ukiz-bd-logo.png"
              alt="UKIZ-BD logo"
              className="h-9 w-9 rounded-full border border-white/30 object-cover"
            />
            <span className="text-[13px] font-extrabold tracking-[.22em]">
              UKIZ-BD
            </span>
          </div>
          <button onClick={() => setMenuOpen(false)} className="mobile-only">
            <X size={18} />
          </button>
        </div>
        <div className="mt-8 text-xs uppercase tracking-[.15em] text-white/35">
          Workspace
        </div>
        <nav className="mt-4 grid flex-1 gap-1 overflow-y-auto pb-2">
          {menu.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => goTab(path)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${current.path === path ? "bg-[#c7a970] text-[#151515]" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon size={16} />
              <span>{label}</span>
              {current.path === path && (
                <ChevronRight size={14} className="ml-auto" />
              )}
            </button>
          ))}
        </nav>
        <div className="relative border-t border-white/10 pt-4">
          <button
            onClick={() => setShowAlerts(v => !v)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 hover:bg-white/10"
          >
            <Bell size={16} /> Notifications
            <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#9c715f] px-1 text-xs text-white">
              {alertCount}
            </span>
          </button>
          {showAlerts && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-[#242422] p-3 shadow-2xl">
              <div className="px-1 pb-2 text-xs uppercase tracking-[.13em] text-white/40">
                {pendingOrders} pending · {lowStock.length} low stock
              </div>
              {pendingOrders > 0 && (
                <button
                  onClick={() => goTab("/admin/orders")}
                  className="mb-1 w-full rounded-lg bg-white/5 px-3 py-2.5 text-left text-xs hover:bg-white/10"
                >
                  <span className="font-semibold text-[#c7a970]">
                    {pendingOrders} pending order
                    {pendingOrders === 1 ? "" : "s"}
                  </span>
                  <span className="mt-0.5 block text-white/50">
                    Review the queue →
                  </span>
                </button>
              )}
              {lowStock.slice(0, 6).map(item => (
                <button
                  key={item.id}
                  onClick={() => restockProduct(item.id)}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-xs hover:bg-white/10"
                >
                  <span className="font-semibold">{item.name}</span>
                  <span className="mt-0.5 block text-[#d6a08b]">
                    {item.left} — tap to restock →
                  </span>
                </button>
              ))}
              {alertCount === 0 && (
                <div className="px-3 py-4 text-center text-xs text-white/40">
                  All clear. No pending orders or low stock.
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => logout.mutate()}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 hover:bg-white/10"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <div className="md:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/10 bg-[#f3f0e9]/90 px-5 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="icon-button mobile-only h-9 w-9"
            >
              <Menu size={16} />
            </button>
            <div>
              <div className="text-sm font-semibold">{current.label}</div>
              <div className="text-xs text-[#918a7f]">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <div className="flex items-center gap-2 rounded-full border border-black/10 bg-[#f8f6f0] px-3 py-2">
                <Search size={14} className="shrink-0 text-[#918a7f]" />
                <input
                  value={paletteQuery}
                  onChange={e => {
                    setPaletteQuery(e.target.value);
                    setPaletteOpen(true);
                    setPaletteIndex(0);
                  }}
                  onFocus={() => setPaletteOpen(true)}
                  onKeyDown={e => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setPaletteIndex(i =>
                        paletteItems.length === 0
                          ? 0
                          : (i + 1) % paletteItems.length
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setPaletteIndex(i =>
                        paletteItems.length === 0
                          ? 0
                          : (i - 1 + paletteItems.length) %
                            paletteItems.length
                      );
                    } else if (e.key === "Enter") {
                      const item = paletteItems[paletteIndex];
                      if (item) runPaletteItem(item);
                      else if (paletteQuery.trim()) {
                        setQuery(paletteQuery.trim());
                        goTab("/admin/products");
                        resetPalette();
                      }
                    } else if (e.key === "Escape") {
                      resetPalette();
                    }
                  }}
                  placeholder="Search tabs, actions, products…"
                  className="w-56 bg-transparent text-xs outline-none placeholder:text-[#a39b90]"
                />
              </div>
              {paletteOpen && paletteQuery.trim() !== "" && (
                <>
                  <button
                    aria-label="Close search"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={resetPalette}
                  />
                  <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-2xl">
                    {paletteItems.length === 0 ? (
                      <div className="px-3 py-6 text-center">
                        <p className="text-xs font-semibold">
                          No match for “{paletteQuery.trim()}”.
                        </p>
                        <button
                          onClick={() => {
                            setQuery(paletteQuery.trim());
                            goTab("/admin/products");
                            resetPalette();
                          }}
                          className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
                        >
                          Search in products
                        </button>
                      </div>
                    ) : (
                      <>
                        {paletteGroups.map(group => (
                          <div key={group.title}>
                            <div className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[.13em] text-[#a39b90]">
                              {group.title}
                            </div>
                            {group.items.map(item => {
                              const flat = paletteItems.indexOf(item);
                              return (
                                <button
                                  key={`${item.kind}-${item.label}`}
                                  onMouseEnter={() => setPaletteIndex(flat)}
                                  onClick={() => runPaletteItem(item)}
                                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${flat === paletteIndex ? "bg-[#1a1a18] text-[#f5f0e6]" : "hover:bg-black/5"}`}
                                >
                                  <item.Icon
                                    size={15}
                                    className={
                                      flat === paletteIndex
                                        ? "text-[#c7a970]"
                                        : "text-[#a4824e]"
                                    }
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-semibold">
                                      {item.label}
                                    </span>
                                    <span
                                      className={`block truncate text-[11px] ${flat === paletteIndex ? "text-white/50" : "text-[#918a7f]"}`}
                                    >
                                      {item.hint}
                                    </span>
                                  </span>
                                  {flat === paletteIndex && (
                                    <ChevronRight
                                      size={14}
                                      className="shrink-0"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                        <div className="border-t border-black/10 px-3 py-2 text-[10px] text-[#a39b90]">
                          ↑↓ navigate · Enter open · Esc close
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#c7a970] text-xs font-bold">
              SA
            </div>
          </div>
        </header>
        <main className="p-5 md:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="eyebrow mb-2">{dayGreeting}, Arafat</div>
              <h1 className="display text-4xl md:text-5xl">
                {current.path === "/admin"
                  ? "The business at a glance."
                  : current.label}
              </h1>
            </div>
            {current.path === "/admin" && (
              <div className="flex gap-2">
                <select
                  value={range}
                  onChange={event => setRange(event.target.value)}
                  className="rounded-full border border-black/10 bg-[#f8f6f0] px-4 py-2 text-xs uppercase tracking-[.12em]"
                >
                  <option>Last 30 days</option>
                  <option>This month</option>
                  <option>Last 7 days</option>
                </select>
              </div>
            )}
          </div>
          {current.path === "/admin" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Total revenue"
                  value={`৳${rangeRevenue.toLocaleString("en-BD")}`}
                  change={revenueChange}
                  icon={CircleDollarSign}
                />
                <Metric
                  label="Orders"
                  value={rangeOrders.toString()}
                  change={`${liveOrders.length} total`}
                  icon={ClipboardList}
                />
                <Metric
                  label="Customers"
                  value={(customersQuery.data ?? []).length.toString()}
                  change={
                    newCustomers > 0 ? `+${newCustomers} in range` : "Total"
                  }
                  icon={Users}
                />
                <Metric
                  label="Products live"
                  value={products.length.toString()}
                  change={
                    lowStock.length > 0
                      ? `${lowStock.length} low stock`
                      : "Stock OK"
                  }
                  icon={Package}
                />
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
                <section className="rounded-2xl border border-black/10 bg-[#f8f6f0] p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="eyebrow">Revenue overview</div>
                      <div className="mt-2 text-2xl font-semibold">
                        ৳{rangeRevenue.toLocaleString("en-BD")}{" "}
                        <span className="ml-2 text-xs font-normal text-[#7b936e]">
                          {rangeOrders} orders
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-[#918a7f]">{range}</div>
                  </div>
                  <div className="mt-8 flex h-48 items-end gap-2 border-b border-l border-black/10 px-3 pb-0">
                    {buckets.map((bucket, index) => (
                      <div
                        key={index}
                        title={`${bucket.label} · ৳${bucket.total.toLocaleString("en-BD")}`}
                        className="group relative min-w-0 flex-1 rounded-t-sm bg-[#c7a970] transition-all hover:bg-[#a4824e]"
                        style={{
                          height: `${bucket.total === 0 ? 3 : Math.max(6, Math.round((bucket.total / maxBucket) * 100))}%`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-xs uppercase tracking-[.1em] text-[#a39b90]">
                    <span>{buckets[0]?.label ?? ""}</span>
                    <span>
                      {buckets[Math.floor(buckets.length / 2)]?.label ?? ""}
                    </span>
                    <span>{buckets[buckets.length - 1]?.label ?? ""}</span>
                  </div>
                </section>
                <section className="rounded-2xl bg-[#1a1a18] p-5 text-[#f5f0e6] md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="eyebrow text-[#c7a970]">
                      Low stock alerts
                    </div>
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#9c715f] text-xs">
                      {lowStock.length}
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    {lowStock.length === 0 && (
                      <div className="py-6 text-center text-xs text-white/40">
                        Stock levels look healthy.
                      </div>
                    )}
                    {lowStock.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b border-white/10 pb-4"
                      >
                        <div>
                          <div className="text-sm">{item.name}</div>
                          <div className="mt-1 text-xs text-white/40">
                            {item.detail}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#d6a08b]">
                            {item.left}
                          </div>
                          <button
                            onClick={() => restockProduct(item.id)}
                            className="mt-1 text-xs uppercase tracking-[.1em] text-white/45 hover:text-white"
                          >
                            Restock →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <section className="mt-6 rounded-2xl border border-black/10 bg-[#f8f6f0] p-5 md:p-6">
                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="eyebrow">Latest orders</div>
                    <div className="mt-2 text-xl font-semibold">
                      Keep the queue moving.
                    </div>
                  </div>
                  <button
                    onClick={() => goTab("/admin/orders")}
                    className="text-xs font-bold uppercase tracking-[.12em] text-[#8d744e]"
                  >
                    View all orders →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="border-y border-black/10 text-xs uppercase tracking-[.13em] text-[#918a7f]">
                      <tr>
                        <th className="py-3">Order</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveOrders.slice(0, 6).map(order => (
                        <tr key={order.id} className="border-b border-black/8">
                          <td className="py-4">
                            <div className="font-semibold">
                              #UKIZ-{order.id}
                            </div>
                            <div className="mt-0.5 text-xs text-[#918a7f]">
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </td>
                          <td>
                            <div>{order.customerName}</div>
                            <div className="mt-0.5 text-xs text-[#918a7f]">
                              {order.customerEmail}
                            </div>
                          </td>
                          <td className="max-w-[220px] truncate text-[#777269]">
                            {order.items
                              .map(
                                item =>
                                  `${item.name} · ${item.size} ×${item.quantity}${item.premium ? ` +${item.premium}` : ""}`
                              )
                              .join(", ")}
                          </td>
                          <td>৳{order.total.toLocaleString("en-BD")}</td>
                          <td>
                            <OrderStatusPill status={order.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!ordersQuery.isLoading && liveOrders.length === 0 && (
                    <div className="py-10 text-center text-sm text-[#918a7f]">
                      No orders yet.
                    </div>
                  )}
                </div>
              </section>
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-black/10 bg-[#f8f6f0] p-5 md:p-6">
                  <div className="eyebrow">Orders by status</div>
                  <div className="mt-2 text-xl font-semibold">
                    Where the queue stands.
                  </div>
                  <div className="mt-5 grid gap-3">
                    {statusOptions.map(s => {
                      const n = statusCounts.get(s) ?? 0;
                      const pct =
                        rangeOrders === 0
                          ? 0
                          : Math.round((n / rangeOrders) * 100);
                      return (
                        <div key={s}>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">{s}</span>
                            <span className="text-[#777269]">
                              {n} · {pct}%
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/10">
                            <div
                              className="h-full rounded-full bg-[#a4824e]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="rounded-2xl border border-black/10 bg-[#f8f6f0] p-5 md:p-6">
                  <div className="eyebrow">Top products</div>
                  <div className="mt-2 text-xl font-semibold">
                    By revenue in range.
                  </div>
                  <div className="mt-5 grid gap-4">
                    {topProducts.length === 0 && (
                      <div className="py-6 text-center text-sm text-[#918a7f]">
                        No sales in this range yet.
                      </div>
                    )}
                    {topProducts.map(t => (
                      <div key={t.name}>
                        <div className="flex justify-between gap-3 text-xs">
                          <span className="truncate font-semibold">
                            {t.name}
                          </span>
                          <span className="whitespace-nowrap text-[#777269]">
                            ×{t.qty} · ৳{t.total.toLocaleString("en-BD")}
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/10">
                          <div
                            className="h-full rounded-full bg-[#54724c]"
                            style={{
                              width: `${Math.max(4, Math.round((t.total / maxTop) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <section className="rounded-2xl border border-black/10 bg-[#f8f6f0] p-5 md:p-6">
              <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="eyebrow">{current.label} / management</div>
                  <div className="mt-2 text-xl font-semibold">
                    Search, review and update your {current.label.toLowerCase()}
                    .
                  </div>
                </div>
                {current.path === "/admin/products" && (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="primary-button dark py-2"
                  >
                    + Add new
                  </button>
                )}
              </div>
              {isAdding && current.path === "/admin/products" ? (
                <div className="mb-6 rounded-2xl border border-black/10 bg-white p-6 md:p-8">
                  <h3 className="text-xl font-bold">Add New Product</h3>
                  <p className="mt-1 text-sm text-[#777269]">
                    Fill out the information below to add a new item to your
                    inventory database.
                  </p>
                  <div className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-[#6b7280]">
                    1. Basic information
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                      Name{" "}
                      <input
                        className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
                        autoComplete="off"
                        name="new-product-name"
                        placeholder="e.g. Santal 04"
                        required
                        value={newProduct.name}
                        onChange={e =>
                          setNewProduct({ ...newProduct, name: e.target.value })
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                      Brand{" "}
                      <input
                        className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
                        autoComplete="off"
                        name="new-product-brand"
                        placeholder="e.g. Maison NÃ©roli"
                        required
                        value={newProduct.brand}
                        onChange={e =>
                          setNewProduct({
                            ...newProduct,
                            brand: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                      Family{" "}
                      <input
                        className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
                        placeholder="e.g. Woody / Amber"
                        value={newProduct.family}
                        onChange={e =>
                          setNewProduct({
                            ...newProduct,
                            family: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                      Notes{" "}
                      <input
                        className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
                        value={newProduct.notes}
                        onChange={e =>
                          setNewProduct({
                            ...newProduct,
                            notes: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                      For{" "}
                      <select
                        className="rounded border px-3 py-2 text-sm font-normal"
                        value={newProduct.audience}
                        onChange={e =>
                          setNewProduct({
                            ...newProduct,
                            audience: e.target.value,
                          })
                        }
                      >
                        <option>Unisex</option>
                        <option>Men</option>
                        <option>Women</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                      Vibe{" "}
                      <input
                        className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
                        autoComplete="off"
                        placeholder="e.g. Fresh, Warm, Bold"
                        value={newProduct.vibe}
                        onChange={e =>
                          setNewProduct({ ...newProduct, vibe: e.target.value })
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                      Type{" "}
                      <input
                        className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
                        autoComplete="off"
                        placeholder="e.g. EDP, EDT, Parfum"
                        value={newProduct.type}
                        onChange={e =>
                          setNewProduct({ ...newProduct, type: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-[.12em] text-[#6b7280]">
                      2. Sizes & pricing
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      (price in ৳)
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-[#f3f4f6] p-4">
                    <div className="grid gap-2">
                      {sizeRows.map((row, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
                            autoComplete="off"
                            placeholder="Size (e.g. 10ml)"
                            value={row.size}
                            onChange={e =>
                              setSizeRows(
                                sizeRows.map((r, i) =>
                                  i === index
                                    ? { ...r, size: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
                            placeholder="Price"
                            value={row.price}
                            onChange={e =>
                              setSizeRows(
                                sizeRows.map((r, i) =>
                                  i === index
                                    ? {
                                        ...r,
                                        price: parseInt(e.target.value) || 0,
                                      }
                                    : r
                                )
                              )
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            className="w-24 shrink-0 rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a39b90] focus:border-[#4f46e5]"
                            placeholder="Stock"
                            value={row.stock}
                            onChange={e =>
                              setSizeRows(
                                sizeRows.map((r, i) =>
                                  i === index
                                    ? {
                                        ...r,
                                        stock: parseInt(e.target.value) || 0,
                                      }
                                    : r
                                )
                              )
                            }
                          />
                          {sizeRows.length > 1 && (
                            <button
                              onClick={() =>
                                setSizeRows(
                                  sizeRows.filter((_, i) => i !== index)
                                )
                              }
                              className="shrink-0 rounded-full border border-black/15 px-3 py-1 text-xs"
                              aria-label="Remove size"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        setSizeRows([
                          ...sizeRows,
                          { size: "", price: 0, stock: 0 },
                        ])
                      }
                      className="mt-3 text-xs font-bold uppercase tracking-[.1em] text-[#4f46e5]"
                    >
                      + Add size
                    </button>
                  </div>
                  <div className="mt-8 text-xs font-bold uppercase tracking-[.12em] text-[#6b7280]">
                    3. Product media
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[.1em]">
                      Image
                    </div>
                    <ImagePicker
                      value={newProduct.image}
                      onChange={url =>
                        setNewProduct({ ...newProduct, image: url })
                      }
                    />
                  </div>
                  <div className="mt-8 text-xs font-bold uppercase tracking-[.12em] text-[#6b7280]">
                    4. Premium bottle{" "}
                    <span className="font-normal normal-case tracking-normal text-[#9ca3af]">
                      (optional)
                    </span>
                  </div>
                  <div className="mt-4 rounded-xl bg-[#f3f4f6] p-4">
                    <div className="grid gap-2 md:grid-cols-3">
                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                        Label{" "}
                        <input
                          className="rounded border px-3 py-2 text-sm font-normal"
                          autoComplete="off"
                          placeholder="e.g. Crystal flacon"
                          value={newProduct.premiumName}
                          onChange={e =>
                            setNewProduct({
                              ...newProduct,
                              premiumName: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                        Extra price (৳){" "}
                        <input
                          type="number"
                          min={0}
                          className="rounded border px-3 py-2 text-sm font-normal"
                          value={newProduct.premiumPrice}
                          onChange={e =>
                            setNewProduct({
                              ...newProduct,
                              premiumPrice: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                        Stock{" "}
                        <input
                          type="number"
                          min={0}
                          className="rounded border px-3 py-2 text-sm font-normal"
                          value={newProduct.premiumStock}
                          onChange={e =>
                            setNewProduct({
                              ...newProduct,
                              premiumStock: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={saveNewProduct}
                      disabled={addProduct.isPending}
                      className="rounded-lg bg-[#4f46e5] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338ca] disabled:opacity-50"
                    >
                      {addProduct.isPending ? "Adding..." : "Save Product"}
                    </button>
                    <button
                      onClick={() => setIsAdding(false)}
                      className="rounded-lg border border-black/15 bg-white px-6 py-2.5 text-sm font-semibold text-[#151515] transition-colors hover:border-black/40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : current.path === "/admin/products" ? (
                <>
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-black/10 bg-white/50 px-3 py-2 md:w-80">
                    <Search size={14} className="text-[#918a7f]" />
                    <input
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                      placeholder="Search products..."
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    {productsLoading ? (
                      <div className="py-10 text-center text-sm text-[#918a7f]">
                        Loading products...
                      </div>
                    ) : productsError ? (
                      <div className="py-10 text-center text-sm">
                        <p className="text-red-600">Could not load products.</p>
                        <button
                          onClick={() => refetch()}
                          className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-y border-black/10 text-xs uppercase tracking-[.13em] text-[#918a7f]">
                          <tr>
                            <th className="py-3">Product</th>
                            <th>Brand</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map(row => (
                            <Fragment key={row.id}>
                              {editingId === row.id ? (
                                <tr
                                  key={row.id}
                                  className="border-b border-black/8 bg-white"
                                >
                                  <td colSpan={6} className="py-4">
                                    <div className="grid gap-3 md:grid-cols-3">
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Name
                                        <input
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          autoComplete="off"
                                          name="edit-product-name"
                                          value={editForm.name}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              name: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Brand
                                        <input
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          autoComplete="off"
                                          name="edit-product-brand"
                                          value={editForm.brand}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              brand: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                      <div className="rounded-lg border border-black/10 p-3 md:col-span-3">
                                        <div className="mb-3 text-xs font-bold uppercase tracking-[.1em]">
                                          Sizes & prices (৳)
                                        </div>
                                        <div className="grid gap-2">
                                          {editForm.sizeRows.map((sr, si) => (
                                            <div
                                              key={si}
                                              className="flex items-center gap-2"
                                            >
                                              <input
                                                className="w-full rounded border px-3 py-2 text-sm font-normal"
                                                autoComplete="off"
                                                placeholder="Size (e.g. 10ml)"
                                                value={sr.size}
                                                onChange={e =>
                                                  setEditForm({
                                                    ...editForm,
                                                    sizeRows:
                                                      editForm.sizeRows.map(
                                                        (r, i) =>
                                                          i === si
                                                            ? {
                                                                ...r,
                                                                size: e.target
                                                                  .value,
                                                              }
                                                            : r
                                                      ),
                                                  })
                                                }
                                              />
                                              <input
                                                type="number"
                                                min={0}
                                                className="w-full rounded border px-3 py-2 text-sm font-normal"
                                                placeholder="Price"
                                                value={sr.price}
                                                onChange={e =>
                                                  setEditForm({
                                                    ...editForm,
                                                    sizeRows:
                                                      editForm.sizeRows.map(
                                                        (r, i) =>
                                                          i === si
                                                            ? {
                                                                ...r,
                                                                price:
                                                                  parseInt(
                                                                    e.target
                                                                      .value
                                                                  ) || 0,
                                                              }
                                                            : r
                                                      ),
                                                  })
                                                }
                                              />
                                              <input
                                                type="number"
                                                min={0}
                                                className="w-24 shrink-0 rounded border px-3 py-2 text-sm font-normal"
                                                placeholder="Stock"
                                                value={sr.stock}
                                                onChange={e =>
                                                  setEditForm({
                                                    ...editForm,
                                                    sizeRows:
                                                      editForm.sizeRows.map(
                                                        (r, i) =>
                                                          i === si
                                                            ? {
                                                                ...r,
                                                                stock:
                                                                  parseInt(
                                                                    e.target
                                                                      .value
                                                                  ) || 0,
                                                              }
                                                            : r
                                                      ),
                                                  })
                                                }
                                              />
                                              {editForm.sizeRows.length > 1 && (
                                                <button
                                                  onClick={() =>
                                                    setEditForm({
                                                      ...editForm,
                                                      sizeRows:
                                                        editForm.sizeRows.filter(
                                                          (_, i) => i !== si
                                                        ),
                                                    })
                                                  }
                                                  className="shrink-0 rounded-full border border-black/15 px-3 py-1 text-xs"
                                                  aria-label="Remove size"
                                                >
                                                  ✕
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                        <button
                                          onClick={() =>
                                            setEditForm({
                                              ...editForm,
                                              sizeRows: [
                                                ...editForm.sizeRows,
                                                {
                                                  size: "",
                                                  price: 0,
                                                  stock: 0,
                                                },
                                              ],
                                            })
                                          }
                                          className="mt-3 text-xs font-bold uppercase tracking-[.1em] text-[#8d744e]"
                                        >
                                          + Add size
                                        </button>
                                      </div>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Family
                                        <input
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          value={editForm.family}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              family: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Notes
                                        <input
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          value={editForm.notes}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              notes: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        For
                                        <select
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          value={editForm.audience}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              audience: e.target.value,
                                            })
                                          }
                                        >
                                          <option>Unisex</option>
                                          <option>Men</option>
                                          <option>Women</option>
                                        </select>
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Vibe
                                        <input
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          autoComplete="off"
                                          placeholder="e.g. Fresh, Warm, Bold"
                                          value={editForm.vibe}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              vibe: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Type
                                        <input
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          autoComplete="off"
                                          placeholder="e.g. EDP, EDT, Parfum"
                                          value={editForm.type}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              type: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Image
                                        <ImagePicker
                                          value={editForm.image}
                                          onChange={url =>
                                            setEditForm({
                                              ...editForm,
                                              image: url,
                                            })
                                          }
                                        />
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Stock
                                        <input
                                          type="number"
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          value={editForm.stock}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              stock:
                                                parseInt(e.target.value) || 0,
                                            })
                                          }
                                        />
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Status
                                        <select
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          value={editForm.status}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              status: e.target.value as
                                                | "In stock"
                                                | "Low stock"
                                                | "Out of stock",
                                            })
                                          }
                                        >
                                          <option>In stock</option>
                                          <option>Low stock</option>
                                          <option>Out of stock</option>
                                        </select>
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                        Tone
                                        <input
                                          className="rounded border px-3 py-2 text-sm font-normal"
                                          value={editForm.tone}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              tone: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                      <div className="rounded-lg border border-black/10 p-3 md:col-span-3">
                                        <div className="mb-3 text-xs font-bold uppercase tracking-[.1em]">
                                          Premium bottle{" "}
                                          <span className="font-normal normal-case tracking-normal text-[#a39b90]">
                                            (optional)
                                          </span>
                                        </div>
                                        <div className="grid gap-2 md:grid-cols-3">
                                          <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                            Label{" "}
                                            <input
                                              className="rounded border px-3 py-2 text-sm font-normal"
                                              autoComplete="off"
                                              placeholder="e.g. Crystal flacon"
                                              value={editForm.premiumName}
                                              onChange={e =>
                                                setEditForm({
                                                  ...editForm,
                                                  premiumName: e.target.value,
                                                })
                                              }
                                            />
                                          </label>
                                          <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                            Extra price (৳){" "}
                                            <input
                                              type="number"
                                              min={0}
                                              className="rounded border px-3 py-2 text-sm font-normal"
                                              value={editForm.premiumPrice}
                                              onChange={e =>
                                                setEditForm({
                                                  ...editForm,
                                                  premiumPrice:
                                                    parseInt(e.target.value) ||
                                                    0,
                                                })
                                              }
                                            />
                                          </label>
                                          <label className="grid gap-1 text-xs font-bold uppercase tracking-[.1em]">
                                            Stock{" "}
                                            <input
                                              type="number"
                                              min={0}
                                              className="rounded border px-3 py-2 text-sm font-normal"
                                              value={editForm.premiumStock}
                                              onChange={e =>
                                                setEditForm({
                                                  ...editForm,
                                                  premiumStock:
                                                    parseInt(e.target.value) ||
                                                    0,
                                                })
                                              }
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                      <button
                                        onClick={() => saveEdit(row.id)}
                                        disabled={updateProduct.isPending}
                                        className="primary-button dark py-2"
                                      >
                                        {updateProduct.isPending
                                          ? "Saving..."
                                          : "Save changes"}
                                      </button>
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="px-4 py-2 text-sm text-[#777269]"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                <tr
                                  key={row.id}
                                  className="border-b border-black/8"
                                >
                                  <td className="py-4 font-semibold">
                                    {row.name}
                                  </td>
                                  <td>{row.brand}</td>
                                  <td>
                                    From ৳
                                    {minPrice(
                                      row.price,
                                      row.sizePrices
                                    ).toLocaleString("en-BD")}
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-1.5">
                                      <span>{row.stock}</span>
                                      <button
                                        onClick={() =>
                                          quickAdjustStock(row.id, -1)
                                        }
                                        disabled={updateProduct.isPending}
                                        className="grid h-5 w-5 place-items-center rounded-full border border-black/15 text-xs hover:bg-black hover:text-white disabled:opacity-40"
                                        aria-label={`Decrease stock of ${row.name}`}
                                      >
                                        −
                                      </button>
                                      <button
                                        onClick={() =>
                                          quickAdjustStock(row.id, 1)
                                        }
                                        disabled={updateProduct.isPending}
                                        className="grid h-5 w-5 place-items-center rounded-full border border-black/15 text-xs hover:bg-black hover:text-white disabled:opacity-40"
                                        aria-label={`Increase stock of ${row.name}`}
                                      >
                                        +
                                      </button>
                                    </div>
                                    <div className="mt-1 max-w-[160px] text-xs text-[#918a7f]">
                                      {Object.entries(
                                        parseSizePrices(row.sizeStocks)
                                      )
                                        .map(([s, q]) => `${s}: ${q}`)
                                        .join(" · ")}
                                    </div>
                                  </td>
                                  <td>
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-[.08em] ${row.status === "Low stock" ? "bg-[#f2ddcf] text-[#9c614b]" : row.status === "Out of stock" ? "bg-red-100 text-red-700" : "bg-[#dce8d6] text-[#54724c]"}`}
                                    >
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => startEdit(row)}
                                        className="rounded-full border border-black/15 px-3 py-1 text-xs font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm(`Delete ${row.name}?`))
                                            deleteProduct.mutate({
                                              id: row.id,
                                            });
                                        }}
                                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-bold uppercase tracking-[.1em] text-red-600 hover:bg-red-600 hover:text-white"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {!productsLoading &&
                      !productsError &&
                      filteredProducts.length === 0 && (
                        <div className="py-10 text-center text-sm text-[#918a7f]">
                          {products.length === 0
                            ? "No products yet. Click + Add new to create your first one."
                            : "No products match this search."}
                        </div>
                      )}
                  </div>
                </>
              ) : current.path === "/admin/orders" ? (
                <>
                  <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <div className="eyebrow">
                        Orders / {filteredOrders.length}
                      </div>
                      <div className="mt-2 text-xl font-semibold">
                        Every order, with its status.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex items-center gap-2 rounded-full border border-black/10 bg-[#f8f6f0] px-4 py-2">
                        <Search size={13} className="text-[#918a7f]" />
                        <input
                          value={orderSearch}
                          onChange={e => setOrderSearch(e.target.value)}
                          placeholder="Search id, name, phone, TrxID…"
                          className="w-48 bg-transparent text-xs outline-none placeholder:text-[#a39b90]"
                        />
                      </div>
                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.12em] text-[#918a7f]">
                        From
                        <input
                          type="date"
                          value={exportFrom}
                          onChange={e => setExportFrom(e.target.value)}
                          className="rounded-full border border-black/10 bg-[#f8f6f0] px-4 py-2 text-xs font-normal text-[#151515] outline-none"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-bold uppercase tracking-[.12em] text-[#918a7f]">
                        To
                        <input
                          type="date"
                          value={exportTo}
                          onChange={e => setExportTo(e.target.value)}
                          className="rounded-full border border-black/10 bg-[#f8f6f0] px-4 py-2 text-xs font-normal text-[#151515] outline-none"
                        />
                      </label>
                      <button
                        onClick={() => exportOrders("excel")}
                        className="primary-button dark py-2"
                      >
                        <Download size={13} /> Excel
                      </button>
                      <button
                        onClick={() => exportOrders("json")}
                        className="secondary-button py-2"
                      >
                        <Download size={13} /> JSON
                      </button>
                    </div>
                  </div>
                  {ordersQuery.isLoading ? (
                    <div className="py-10 text-center text-sm text-[#918a7f]">
                      Loading orders...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="grid gap-4">
                        {filteredOrders.map(order => {
                          const paid = order.paidAmount ?? 0;
                          const due = Math.max(0, order.total - paid);
                          return (
                            <div
                              key={order.id}
                              className="rounded-2xl border border-black/10 bg-white p-5 md:p-6"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
                                <div className="flex items-center gap-3">
                                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1a1a18] text-xs font-extrabold text-[#c7a970]">
                                    #{order.id}
                                  </span>
                                  <div>
                                    <div className="font-bold">
                                      #UKIZ-{order.id}
                                    </div>
                                    <div className="mt-0.5 text-xs text-[#918a7f]">
                                      {new Date(order.createdAt).toLocaleString(
                                        "en-GB",
                                        {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <OrderStatusPill status={order.status} />
                                  <select
                                    value={
                                      statusOptions.includes(order.status)
                                        ? order.status
                                        : "Pending"
                                    }
                                    onChange={e => {
                                      setUpdatingOrderId(order.id);
                                      updateOrderStatus.mutate({
                                        id: order.id,
                                        status: e.target.value as
                                          | "Pending"
                                          | "Processing"
                                          | "Shipped"
                                          | "Delivered"
                                          | "Cancelled",
                                      });
                                    }}
                                    disabled={
                                      updateOrderStatus.isPending &&
                                      updatingOrderId === order.id
                                    }
                                    className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[.1em]"
                                  >
                                    <option>Pending</option>
                                    <option>Processing</option>
                                    <option>Shipped</option>
                                    <option>Delivered</option>
                                    <option>Cancelled</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid gap-5 py-4 md:grid-cols-[1fr_1.2fr_.9fr]">
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-[.13em] text-[#918a7f]">
                                    Customer
                                  </div>
                                  <div className="mt-1.5 text-sm font-semibold">
                                    {order.customerName}
                                  </div>
                                  <div className="mt-0.5 text-xs text-[#918a7f]">
                                    {order.customerEmail}
                                  </div>
                                  <div className="mt-0.5 text-xs text-[#918a7f]">
                                    {order.phone ?? ""}
                                  </div>
                                  <div className="mt-1.5 text-xs leading-relaxed text-[#777269]">
                                    {order.name} · {order.address ?? ""}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-[.13em] text-[#918a7f]">
                                    Items / {order.items.length}
                                  </div>
                                  <div className="mt-1.5 grid gap-2">
                                    {order.items.map((item, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-2.5 text-sm"
                                      >
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="h-10 w-9 rounded-lg object-cover mix-blend-multiply"
                                        />
                                        <div className="min-w-0">
                                          <div className="truncate font-semibold">
                                            {item.name}
                                          </div>
                                          <div className="text-xs text-[#918a7f]">
                                            {item.size} × {item.quantity}
                                            {item.premium
                                              ? ` + ${item.premium}`
                                              : ""}
                                          </div>
                                        </div>
                                        <span className="ml-auto whitespace-nowrap pl-2 text-[#777269]">
                                          ৳
                                          {(
                                            item.price * item.quantity
                                          ).toLocaleString("en-BD")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-[.13em] text-[#918a7f]">
                                    Payment
                                  </div>
                                  <div className="mt-1.5 text-sm font-semibold">
                                    {order.paymentMethod === "online"
                                      ? "bKash / Nagad"
                                      : "Cash on Delivery"}
                                  </div>
                                  <div className="mt-0.5 text-xs text-[#918a7f]">
                                    {(
                                      DELIVERY_ZONE_LABELS as Record<
                                        string,
                                        string
                                      >
                                    )[order.zone ?? ""] ??
                                      order.zone ??
                                      ""}
                                  </div>
                                  <div className="mt-0.5 text-xs text-[#918a7f]">
                                    Paid ৳{paid.toLocaleString("en-BD")} · Due ৳
                                    {due.toLocaleString("en-BD")}
                                  </div>
                                  {order.trxId ? (
                                    <div className="mt-0.5 text-xs text-[#918a7f]">
                                      Trx {order.trxId}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-sm">
                                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[#777269]">
                                  <span>
                                    Subtotal{" "}
                                    <span className="font-semibold text-[#151515]">
                                      ৳{order.subtotal.toLocaleString("en-BD")}
                                    </span>
                                  </span>
                                  <span>
                                    Delivery{" "}
                                    <span className="font-semibold text-[#151515]">
                                      {order.delivery === 0
                                        ? "Free"
                                        : `৳${order.delivery.toLocaleString("en-BD")}`}
                                    </span>
                                  </span>
                                  {order.discount ? (
                                    <span>
                                      Coupon {order.couponCode}{" "}
                                      <span className="font-semibold text-[#7b936e]">
                                        −৳
                                        {order.discount.toLocaleString("en-BD")}
                                      </span>
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-base font-bold">
                                  Total ৳{order.total.toLocaleString("en-BD")}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {filteredOrders.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-black/15 py-14 text-center text-sm text-[#918a7f]">
                          {liveOrders.length === 0
                            ? "No orders yet. New customer orders will appear here."
                            : "No orders match these filters."}
                        </div>
                      )}
                      {filteredOrders.length > 0 &&
                        filteredOrders.length >= liveOrders.length &&
                        liveOrders.length >= ordersLimit && (
                          <button
                            onClick={() => setOrdersLimit(l => l + 100)}
                            disabled={ordersQuery.isFetching}
                            className="mx-auto mt-5 flex rounded-full border border-black/15 px-6 py-2 text-xs font-bold uppercase tracking-[.12em] hover:bg-black hover:text-white disabled:opacity-50"
                          >
                            {ordersQuery.isFetching
                              ? "Loading..."
                              : "Load more orders"}
                          </button>
                        )}
                    </div>
                  )}
                  {ordersQuery.isError && (
                    <div className="py-10 text-center text-sm">
                      <p className="text-red-600">Could not load orders.</p>
                      <button
                        onClick={() => ordersQuery.refetch()}
                        className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </>
              ) : current.path === "/admin/customers" ? (
                <>
                  <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <div className="eyebrow">
                        {(customersQuery.data ?? []).length} customers
                      </div>
                      <div className="mt-2 text-xl font-semibold">
                        Everyone who signed up.
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/50 px-3 py-2 md:w-80">
                      <Search size={14} className="text-[#918a7f]" />
                      <input
                        value={customerSearch}
                        onChange={event =>
                          setCustomerSearch(event.target.value)
                        }
                        placeholder="Search name, email, phone..."
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>
                  {customersQuery.isLoading ? (
                    <div className="py-10 text-center text-sm text-[#918a7f]">
                      Loading customers...
                    </div>
                  ) : customersQuery.isError ? (
                    <div className="py-10 text-center text-sm">
                      <p className="text-red-600">Could not load customers.</p>
                      <button
                        onClick={() => customersQuery.refetch()}
                        className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[.1em] hover:bg-black hover:text-white"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="border-y border-black/10 text-xs uppercase tracking-[.13em] text-[#918a7f]">
                          <tr>
                            <th className="py-3">Customer</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Orders</th>
                            <th>Spent</th>
                            <th>Joined</th>
                            <th>Last sign-in</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCustomers.map(row => {
                            const mine = liveOrders.filter(
                              o => o.customerId === row.id
                            );
                            const spent = mine.reduce((s, o) => s + o.total, 0);
                            return (
                              <tr
                                key={row.id}
                                className="border-b border-black/8"
                              >
                                <td className="py-4 font-semibold">
                                  {row.name}
                                </td>
                                <td>{row.email}</td>
                                <td>{row.phone ?? "—"}</td>
                                <td>{mine.length}</td>
                                <td>৳{spent.toLocaleString("en-BD")}</td>
                                <td>
                                  {new Date(row.createdAt).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </td>
                                <td>
                                  {new Date(
                                    row.lastSignedIn
                                  ).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {filteredCustomers.length === 0 && (
                        <div className="py-10 text-center text-sm text-[#918a7f]">
                          No customers yet. New sign-ups will appear here.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : current.path === "/admin/coupons" ? (
                <CouponsSection />
              ) : (
                <SettingsSection />
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AdminRoute({ login = false }: { login?: boolean }) {
  return login ? <AdminLogin /> : <AdminDashboard />;
}
