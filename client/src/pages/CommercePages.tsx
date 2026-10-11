import { useEffect, useRef, useState } from "react";
import { ArrowRight, Banknote, Check, Copy, Heart, LockKeyhole, LogOut, Minus, Plus, Printer, ShoppingBag, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import StorefrontLayout from "@/components/StorefrontLayout";
import { money } from "./Home";
import { trpc } from "@/lib/trpc";
import { useCustomer } from "@/lib/customer";
import { useCart } from "@/lib/cart";
import { DELIVERY_ZONES, DELIVERY_ZONE_LABELS, deliveryFeeFor, type DeliveryZone, type PaymentMethod } from "@shared/order";
import { usePublicSettings } from "@/lib/settings";

export function OrderStatusPill({ status }: { status: string }) {
  const style =
    status === "Delivered"
      ? "bg-[#dce8d6] text-[#54724c]"
      : status === "Cancelled"
        ? "bg-red-100 text-red-700"
        : status === "Pending"
          ? "bg-[#f2ddcf] text-[#9c614b]"
          : "bg-[#e9e1d2] text-[#8d744e]";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-[.08em] ${style}`}>{status}</span>
  );
}

export function Account() {
  const { customer, isLoading, logout, logoutPending } = useCustomer();
  const myOrders = trpc.orders.mine.useQuery(undefined, { enabled: Boolean(customer) });
  if (isLoading) return <StorefrontLayout eyebrow="Your space / 05" title="Welcome back."><section className="container pb-24"><p className="text-sm text-[#777269]">Loading your account...</p></section></StorefrontLayout>;
  if (!customer) return <StorefrontLayout eyebrow="Your space / 05" title="Welcome back."><section className="container pb-24"><div className="grid gap-6 md:grid-cols-3"><div className="md:col-span-2 rounded-[1.5rem] bg-[#1a1a18] p-8 text-[#f5f0e6] md:p-12"><div className="eyebrow mb-5 text-[#c7a970]">Sign in to continue</div><h2 className="serif text-4xl">Your account is ready when you are.</h2><p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">Save your favourite compositions, track orders and keep your scent notes in one place.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/signin" className="primary-button">Sign in <ArrowRight size={14} /></Link><Link href="/signup" className="secondary-button border-white/20 text-white hover:border-white">Create account</Link></div></div><div className="rounded-[1.5rem] border border-black/10 bg-[#e9e5dc] p-8"><div className="eyebrow mb-5">Quick links</div><div className="grid gap-4 text-sm"><Link href="/wishlist" className="flex justify-between border-b border-black/10 pb-3">Wishlist <Heart size={16} /></Link><Link href="/cart" className="flex justify-between border-b border-black/10 pb-3">Your bag <ShoppingBag size={16} /></Link><Link href="/contact" className="flex justify-between">Need help? <ArrowRight size={16} /></Link></div></div></div></section></StorefrontLayout>;
  const orders = myOrders.data ?? [];
  return <StorefrontLayout eyebrow="Your space / 05" title="Welcome back."><section className="container pb-24"><div className="grid gap-6 md:grid-cols-3"><div className="md:col-span-2 rounded-[1.5rem] bg-[#1a1a18] p-8 text-[#f5f0e6] md:p-12"><div className="eyebrow mb-5 text-[#c7a970]">Signed in</div><h2 className="serif text-4xl">{customer.name}.</h2><p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="primary-button">Shop the edit <ArrowRight size={14} /></Link><button onClick={logout} disabled={logoutPending} className="secondary-button border-white/20 text-white hover:border-white disabled:opacity-50"><LogOut size={14} /> {logoutPending ? "Signing out..." : "Sign out"}</button></div></div><div className="rounded-[1.5rem] border border-black/10 bg-[#e9e5dc] p-8"><div className="eyebrow mb-5">Your details</div><div className="grid gap-4 text-sm"><div className="flex justify-between border-b border-black/10 pb-3"><span className="text-[#777269]">Name</span><span className="font-semibold">{customer.name}</span></div><div className="flex justify-between border-b border-black/10 pb-3"><span className="text-[#777269]">Email</span><span className="font-semibold">{customer.email}</span></div><div className="flex justify-between"><span className="text-[#777269]">Member since</span><span className="font-semibold">{new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></div></div><div className="mt-6 grid gap-4 text-sm"><Link href="/wishlist" className="flex justify-between border-b border-black/10 pb-3">Wishlist <Heart size={16} /></Link><Link href="/cart" className="flex justify-between border-b border-black/10 pb-3">Your bag <ShoppingBag size={16} /></Link><Link href="/contact" className="flex justify-between">Need help? <ArrowRight size={16} /></Link></div></div></div><div className="mt-6 rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-7 md:p-10"><div className="eyebrow mb-2">Your orders / {orders.length}</div><h2 className="serif text-3xl">What you've ordered.</h2>{myOrders.isLoading ? <p className="mt-6 text-sm text-[#777269]">Loading orders...</p> : orders.length === 0 ? <p className="mt-6 max-w-md text-sm leading-relaxed text-[#777269]">No orders yet. When you place an order it will appear here with its status.</p> : <div className="mt-6 grid gap-4">{orders.map((order) => <div key={order.id} className="rounded-xl border border-black/10 bg-white/60 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="text-sm font-bold">#UKIZ-{order.id}</span><span className="ml-3 text-xs text-[#918a7f]">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {money(order.total)}</span></div><OrderStatusPill status={order.status} /></div><div className="mt-3 grid gap-2">{order.items.map((item, index) => <div key={index} className="flex items-center gap-3 text-sm"><img src={item.image} alt={item.name} className="h-10 w-9 rounded-lg object-cover mix-blend-multiply" /><span className="font-semibold">{item.name}</span><span className="text-[#777269]">{item.size} × {item.quantity}{item.premium ? ` + ${item.premium}` : ""}</span><span className="ml-auto">{money(item.price * item.quantity)}</span></div>)}</div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-black/10 pt-3 text-xs text-[#777269]"><span>{order.paymentMethod === "online" ? "bKash / Nagad" : "Cash on Delivery"}{(DELIVERY_ZONE_LABELS as Record<string, string>)[order.zone ?? ""] ? ` · ${(DELIVERY_ZONE_LABELS as Record<string, string>)[order.zone ?? ""]}` : ""}</span><span>Paid {money(order.paidAmount ?? 0)} · Due {money(Math.max(0, order.total - (order.paidAmount ?? 0)))}</span>{(order.discount ?? 0) > 0 ? <span>Coupon {order.couponCode} · −{money(order.discount ?? 0)}</span> : null}</div></div>)}</div>}</div></section></StorefrontLayout>;
}

export function Wishlist() { return <StorefrontLayout eyebrow="Your edit / 06" title="Things worth keeping close."><section className="container pb-24"><div className="rounded-[1.5rem] border border-dashed border-black/15 bg-[#e9e5dc] px-6 py-20 text-center"><Heart className="mx-auto mb-5 text-[#a4824e]" size={26} /><h2 className="serif text-3xl">Your wishlist is waiting.</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#777269]">Save the fragrances you are curious about, then come back when the time feels right.</p><Link href="/shop" className="primary-button dark mt-7">Browse the edit <ArrowRight size={14} /></Link></div></section></StorefrontLayout>; }

export function Cart() {
  const { items, count, total, updateQuantity, removeItem } = useCart();
  const settings = usePublicSettings();
  const [, setLocation] = useLocation();
  const { requireAuth } = useCustomer();
  return <StorefrontLayout eyebrow="Your bag / 07" title="A good place to start."><section className="container pb-24"><div className="grid gap-10 md:grid-cols-[1.2fr_.8fr]"><div className="rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-6 md:p-8"><div className="mb-7 flex items-center justify-between border-b border-black/10 pb-5"><div className="eyebrow">{count} item{count === 1 ? "" : "s"}</div><Link href="/shop" className="text-xs font-bold uppercase tracking-[.12em] text-[#8e7650]">Continue shopping</Link></div>{items.length === 0 ? <div className="py-10 text-center"><ShoppingBag size={26} className="mx-auto mb-4 text-[#a4824e]" /><h2 className="serif text-2xl">Your bag is quiet.</h2><p className="mx-auto mt-2 max-w-xs text-sm text-[#777269]">Add a composition and make it yours.</p><Link href="/shop" className="primary-button dark mt-6">Explore the edit <ArrowRight size={14} /></Link></div> : <div className="grid gap-6">{items.map((item) => <div key={`${item.id}-${item.size}`} className="flex gap-5"><img src={item.image} alt={item.name} className="h-32 w-28 rounded-xl object-cover mix-blend-multiply" /><div className="min-w-0 flex-1"><div className="text-xs uppercase tracking-[.12em] text-[#907f66]">{item.brand}</div><h2 className="serif mt-1 text-3xl">{item.name}</h2><p className="mt-2 text-sm text-[#777269]">{item.size}{item.premium ? ` + ${item.premiumName ?? "Premium"}` : ""} · {item.notes}</p><div className="mt-3 flex items-center gap-2"><button onClick={() => updateQuantity(item.id, item.size, -1)} className="grid h-6 w-6 place-items-center rounded-full border border-black/15"><Minus size={11} /></button><span className="w-4 text-center text-xs">{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.size, 1)} className="grid h-6 w-6 place-items-center rounded-full border border-black/15"><Plus size={11} /></button><button onClick={() => removeItem(item.id, item.size)} className="ml-2 text-xs uppercase tracking-[.1em] text-[#9b6d5d]">Remove</button></div></div><div className="text-right text-sm font-semibold">{money(item.price * item.quantity)}</div></div>)}</div>}</div><div className="rounded-[1.5rem] bg-[#1a1a18] p-7 text-[#f5f0e6] md:p-8"><div className="eyebrow mb-6 text-[#c7a970]">Summary</div><div className="flex justify-between text-sm text-white/60"><span>Subtotal</span><span>{money(total)}</span></div><div className="mt-3 flex justify-between text-sm text-white/60"><span>Delivery</span><span>{total >= settings.freeThreshold || total === 0 ? "Complimentary" : `${money(80)}–${money(120)} by zone · free over ${money(settings.freeThreshold)}`}</span></div><div className="my-6 border-t border-white/10" /><div className="flex justify-between text-lg"><span>Total</span><span>{money(total)}</span></div><button onClick={() => requireAuth(() => setLocation("/checkout"), "/checkout")} className="primary-button mt-8 w-full">Checkout <ArrowRight size={14} /></button><div className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[.12em] text-white/40"><LockKeyhole size={12} /> Secure checkout</div><p className="mt-4 text-center text-xs leading-relaxed text-white/40">Decant policy: please unbox in front of the rider. Exchange only for damage / wrong item. <Link href="/refund-policy" className="text-[#c7a970] underline underline-offset-4">Details</Link></p></div></div></section></StorefrontLayout>;
}

export function Checkout() {
  const { items, total, clear } = useCart();
  const [, setLocation] = useLocation();
  const { customer, requireAuth, isAuthenticated, isLoading } = useCustomer();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState<DeliveryZone>("inside");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentChoice, setPaymentChoice] = useState<"full" | "advance">("full");
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const settings = usePublicSettings();
  const couponCheck = trpc.coupons.validate.useQuery({ code: couponInput.trim(), subtotal: total }, { enabled: false });
  const prevTotalRef = useRef(0);
  useEffect(() => {
    if (prevTotalRef.current !== 0 && prevTotalRef.current !== total) setCoupon(null);
    prevTotalRef.current = total;
  }, [total]);
  useEffect(() => {
    if (customer) {
      setName((v) => v || customer.name);
      setPhone((v) => v || customer.phone || "");
    }
  }, [customer]);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) requireAuth(undefined, "/checkout");
  }, [isLoading, isAuthenticated, requireAuth]);
  const createOrder = trpc.orders.create.useMutation({
    onSuccess: async (data) => {
      clear();
      try {
        sessionStorage.setItem("ukix-last-order", JSON.stringify({ id: data.orderId, total: data.total }));
      } catch {
        // ignore
      }
      await utils.orders.mine.invalidate();
      await utils.admin.orders.invalidate();
      setLocation("/order-success");
    },
    onError: (error) => toast.error(error.message || "Could not place the order. Please try again."),
  });
  const couponDiscount = coupon?.discount ?? 0;
  const delivery = deliveryFeeFor(zone, total - couponDiscount, settings.freeThreshold);
  const grandTotal = total - couponDiscount + delivery;
  const advanceAmount = paymentMethod === "online" && paymentChoice === "advance" ? delivery : grandTotal;
  const applyCoupon = async () => {
    if (!couponInput.trim()) { toast.error("Enter a coupon code."); return; }
    const res = await couponCheck.refetch();
    const data = res.data;
    if (data && data.valid) {
      setCoupon({ code: data.code, discount: data.discount });
      toast.success(`Coupon applied — ${money(data.discount)} off.`);
    } else {
      setCoupon(null);
      toast.error(data && !data.valid ? data.message : "This coupon is not valid.");
    }
  };
  const placeOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (items.length === 0) {
      toast.error("Your bag is empty.");
      setLocation("/shop");
      return;
    }
    if (!requireAuth(undefined, "/checkout")) return;
    createOrder.mutate({
      items: items.map((item) => ({
        productId: String(item.id),
        name: item.name,
        brand: item.brand,
        size: item.size,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        premium: item.premium ? (item.premiumName ?? "Premium bottle") : undefined,
      })),
      name: name.trim(),
      phone: phone.trim(),
      address: city.trim() ? `${address.trim()}, ${city.trim()}` : address.trim(),
      zone,
      paymentMethod,
      paymentChoice: paymentMethod === "online" ? paymentChoice : undefined,
      senderNumber: paymentMethod === "online" ? senderNumber.trim() : undefined,
      trxId: paymentMethod === "online" ? trxId.trim() : undefined,
      couponCode: coupon?.code,
    });
  };
  return <StorefrontLayout eyebrow="Checkout / 08" title="Make it yours."><section className="container pb-24"><div className="grid gap-10 md:grid-cols-[1.15fr_.85fr]"><form onSubmit={placeOrder} className="rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-7 md:p-10"><div className="eyebrow mb-7">Delivery details</div><div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em] md:col-span-2">Full name<input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em] md:col-span-2">Email<input value={customer?.email ?? ""} disabled className="border-b border-black/10 bg-transparent py-3 text-sm font-normal text-[#777269] outline-none" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">Phone<input required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">City<input value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" placeholder="Dhaka" className="border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em] md:col-span-2">Address<textarea required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" className="resize-none border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none" /></label></div><div className="eyebrow mb-4 mt-8">Delivery zone</div><div className="grid gap-3">{(Object.keys(DELIVERY_ZONES) as DeliveryZone[]).map((z) => <button key={z} type="button" onClick={() => setZone(z)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${zone === z ? "border-[#a4824e] bg-[#a4824e]/10" : "border-black/15"}`}><span><span className="block text-xs font-bold uppercase tracking-[.13em]">{zone === z ? "✓ " : ""}{DELIVERY_ZONE_LABELS[z]}</span><span className="mt-1 block text-xs text-[#777269]">{total >= settings.freeThreshold ? `Free over ${money(settings.freeThreshold)}` : "Cash on delivery available"}</span></span><span className="text-sm font-bold">{total >= settings.freeThreshold ? "Free" : money(DELIVERY_ZONES[z])}</span></button>)}</div><div className="eyebrow mb-4 mt-8">Payment method</div><div className="grid gap-3"><button type="button" onClick={() => setPaymentMethod("cod")} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${paymentMethod === "cod" ? "border-[#a4824e] bg-[#a4824e]/10" : "border-black/15"}`}><span><span className="block text-xs font-bold uppercase tracking-[.13em]">{paymentMethod === "cod" ? "✓ " : ""}Cash on Delivery</span><span className="mt-1 block text-xs text-[#777269]">Pay {money(grandTotal)} to the rider</span></span><Banknote size={18} className="text-[#a4824e]" /></button><button type="button" onClick={() => setPaymentMethod("online")} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${paymentMethod === "online" ? "border-[#a4824e] bg-[#a4824e]/10" : "border-black/15"}`}><span><span className="block text-xs font-bold uppercase tracking-[.13em]">{paymentMethod === "online" ? "✓ " : ""}bKash / Nagad</span><span className="mt-1 block text-xs text-[#777269]">Send Money to {settings.merchantNumber}</span></span><span className="text-sm font-bold">Online</span></button></div>{paymentMethod === "online" && <div className="mt-4 rounded-xl border border-[#a4824e]/30 bg-[#a4824e]/10 p-5"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-[.13em]">Send Money to</div><div className="mt-1 text-lg font-extrabold tracking-wider">{settings.merchantNumber}</div><div className="mt-1 text-xs text-[#777269]">bKash / Nagad · Send Money (not payment)</div></div><button type="button" onClick={() => { void navigator.clipboard?.writeText(settings.merchantNumber).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="grid h-9 w-9 place-items-center rounded-full border border-black/15" aria-label="Copy merchant number"><Copy size={14} /></button></div>{copied && <div className="mt-2 text-xs font-semibold text-[#54724c]">Number copied.</div>}<div className="eyebrow mb-3 mt-5">How much are you paying now?</div><div className="grid gap-3"><button type="button" onClick={() => setPaymentChoice("full")} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${paymentChoice === "full" ? "border-[#151515] bg-[#151515] text-[#f5f0e6]" : "border-black/15"}`}><span className="text-xs font-bold uppercase tracking-[.13em]">{paymentChoice === "full" ? "✓ " : ""}Full payment</span><span className="text-sm font-bold">{money(grandTotal)}</span></button><button type="button" onClick={() => setPaymentChoice("advance")} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${paymentChoice === "advance" ? "border-[#151515] bg-[#151515] text-[#f5f0e6]" : "border-black/15"}`}><span><span className="block text-xs font-bold uppercase tracking-[.13em]">{paymentChoice === "advance" ? "✓ " : ""}Delivery charge advance</span><span className={`mt-1 block text-xs ${paymentChoice === "advance" ? "text-white/60" : "text-[#777269]"}`}>Minimum required · rest on delivery</span></span><span className="text-sm font-bold">{money(delivery)}</span></button></div><div className="mt-5 grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">Your bKash / Nagad number<input required={paymentMethod === "online"} value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="01XXXXXXXXX" className="border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">Transaction ID (TrxID)<input required={paymentMethod === "online"} value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="e.g. 9HX2K7LM4Q" className="border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none" /></label></div></div>}<button disabled={createOrder.isPending} className="primary-button dark mt-8 disabled:opacity-50">{createOrder.isPending ? "Placing order..." : "Place order"} <ArrowRight size={14} /></button></form><div className="rounded-[1.5rem] bg-[#e9e5dc] p-7 md:p-10"><div className="eyebrow mb-5">Your order / {items.length} item{items.length === 1 ? "" : "s"}</div>{items.length === 0 ? <p className="text-sm text-[#777269]">Your bag is empty. <Link href="/shop" className="font-semibold underline underline-offset-4">Browse the edit</Link>.</p> : <><div className="grid gap-4">{items.map((item) => <div key={`${item.id}-${item.size}`} className="flex items-center justify-between gap-3 border-b border-black/10 pb-4 text-sm"><div><div className="serif text-xl">{item.name}</div><div className="mt-1 text-xs text-[#777269]">{item.size} × {item.quantity}{item.premium ? ` + ${item.premiumName ?? "Premium"}` : ""}</div></div><span className="font-bold">{money(item.price * item.quantity)}</span></div>)}</div><div className="mb-4 flex gap-2"><input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Coupon code" className="w-full rounded-full border border-black/15 bg-white/60 px-4 py-2 text-xs uppercase tracking-[.1em] outline-none placeholder:normal-case placeholder:tracking-normal" /><button type="button" onClick={applyCoupon} className="whitespace-nowrap rounded-full bg-[#151515] px-4 py-2 text-xs font-bold uppercase tracking-[.1em] text-[#f5f0e6]">Apply</button></div>{coupon && <div className="mb-3 flex items-center justify-between rounded-xl bg-[#dce8d6] px-4 py-2 text-xs font-bold text-[#54724c]"><span>{coupon.code} applied</span><button type="button" onClick={() => setCoupon(null)} className="underline underline-offset-4">Remove</button></div>}<div className="mt-5 grid gap-2 text-sm text-[#777269]"><div className="flex justify-between"><span>Subtotal</span><span>{money(total)}</span></div>{couponDiscount > 0 && <div className="flex justify-between font-semibold text-[#54724c]"><span>Discount{coupon ? ` (${coupon.code})` : ""}</span><span>−{money(couponDiscount)}</span></div>}<div className="flex justify-between"><span>Delivery · {DELIVERY_ZONE_LABELS[zone]}</span><span>{delivery === 0 ? "Complimentary" : money(delivery)}</span></div><div className="flex justify-between border-t border-black/10 pt-3 text-base font-bold text-[#151515"><span>Total</span><span>{money(grandTotal)}</span></div><div className="flex justify-between"><span>{paymentMethod === "online" ? (paymentChoice === "advance" ? "Paying now (advance)" : "Paying now (full)") : "Pay on delivery"}</span><span>{paymentMethod === "online" ? money(advanceAmount) : money(grandTotal)}</span></div></div></>}<div className="mt-6 grid gap-4 text-sm text-[#777269]"><div className="flex gap-3"><Truck size={16} className="text-[#a4824e]" /> Nationwide delivery</div><div className="flex gap-3"><LockKeyhole size={16} className="text-[#a4824e]" /> Your payment is protected</div><p className="rounded-xl border border-black/10 bg-white/50 p-4 text-[12px] leading-relaxed">Decant policy: unbox in front of the delivery man. Refund / exchange only for damaged or wrong product — not for scent preference. <Link href="/refund-policy" className="font-semibold text-[#8e7650] underline underline-offset-4">Read policy</Link></p></div></div></div></section></StorefrontLayout>;
}

export function OrderSuccess() {
  let last: { id?: number; total?: number } = {};
  try {
    last = JSON.parse(sessionStorage.getItem("ukix-last-order") || "{}");
  } catch {
    // ignore
  }
  const { customer } = useCustomer();
  const { supportEmail } = usePublicSettings();
  const myOrders = trpc.orders.mine.useQuery(undefined, { enabled: typeof last.id === "number" });
  const order = (myOrders.data ?? []).find((item) => item.id === last.id);

  if (typeof last.id === "number" && !myOrders.isLoading && !order) {
    return <StorefrontLayout eyebrow="Order confirmed / 09" title="It is on its way to becoming yours."><section className="container pb-24"><div className="mx-auto max-w-2xl rounded-[1.5rem] bg-[#1a1a18] p-8 text-center text-[#f5f0e6] md:p-14"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#c7a970] text-[#151515]"><Check size={28} /></div><div className="eyebrow mt-8 text-[#c7a970]">Order #UKIZ-{last.id}</div><h2 className="serif mt-4 text-4xl">A beautiful choice.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/55">We have received your order{typeof last.total === "number" ? ` (${money(last.total)})` : ""} and will send tracking details as soon as it leaves our hands. You can track it anytime from your account.</p><div className="mt-9 flex justify-center gap-3"><Link href="/shop" className="primary-button">Keep exploring <ArrowRight size={14} /></Link><Link href="/account" className="secondary-button border-white/20 text-white">Your orders</Link></div></div></section></StorefrontLayout>;
  }

  if (!order) {
    return <StorefrontLayout eyebrow="Order confirmed / 09" title="It is on its way to becoming yours."><section className="container pb-24"><p className="text-sm text-[#777269]">Loading your invoice...</p></section></StorefrontLayout>;
  }

  const created = new Date(order.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const paid = order.paidAmount ?? 0;
  const due = Math.max(0, order.total - paid);
  const zoneLabel = (DELIVERY_ZONE_LABELS as Record<string, string>)[order.zone ?? ""] ?? order.zone ?? "";
  const payLabel = order.paymentMethod === "online" ? "bKash / Nagad" : "Cash on Delivery";
  return <StorefrontLayout eyebrow="Order confirmed / 09" title="It is on its way to becoming yours."><section className="container pb-24">
    <div className="no-print mx-auto mb-6 flex max-w-3xl flex-col items-center gap-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#c7a970] text-[#151515]"><Check size={28} /></div>
      <p className="max-w-md text-sm leading-relaxed text-[#777269]">Thank you, {order.name.split(" ")[0]}. Your order is confirmed — here is your invoice.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={() => window.print()} className="primary-button dark"><Printer size={14} /> Print invoice</button>
        <Link href="/shop" className="secondary-button">Keep exploring <ArrowRight size={14} /></Link>
      </div>
    </div>
    <div className="invoice-sheet mx-auto max-w-3xl overflow-hidden rounded-[1.5rem] border border-black/10 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-6 bg-[#1a1a18] p-7 text-[#f5f0e6] md:p-10">
        <div className="flex items-center gap-4">
          <img src="/ukiz-bd-logo.png" alt="UKIZ-BD logo" className="h-14 w-14 rounded-full border border-white/25 object-cover" />
          <div>
            <div className="text-[13px] font-extrabold tracking-[.22em]">UKIZ-BD</div>
            <div className="mt-1 text-xs leading-relaxed text-white/50">Online perfume decant shop<br />Dhaka, Bangladesh<br />{supportEmail}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="eyebrow text-[#c7a970]">Invoice</div>
          <div className="serif mt-2 text-3xl">#UKIZ-{order.id}</div>
          <div className="mt-2 text-xs text-white/50">{created}</div>
          <div className="mt-2"><OrderStatusPill status={order.status} /></div>
        </div>
      </div>
      <div className="grid gap-6 p-7 md:grid-cols-2 md:p-10">
        <div>
          <div className="text-xs font-bold uppercase tracking-[.13em] text-[#907f66]">Billed to</div>
          <div className="mt-2 text-sm font-bold">{order.name}</div>
          <div className="mt-1 text-sm text-[#777269]">{order.phone}</div>
          {customer?.email && <div className="mt-1 text-sm text-[#777269]">{customer.email}</div>}
          <div className="mt-1 text-sm leading-relaxed text-[#777269]">{order.address}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[.13em] text-[#907f66]">Payment</div>
          <div className="mt-2 text-sm font-bold">{payLabel}</div>
          {order.paymentMethod === "online" ? <div className="mt-1 text-sm text-[#777269]">Paid {money(paid)}{order.trxId ? ` · TrxID ${order.trxId}` : ""}{order.senderNumber ? ` · from ${order.senderNumber}` : ""}</div> : <div className="mt-1 text-sm text-[#777269]">Pay {money(order.total)} to the rider on arrival.</div>}
          {zoneLabel && <div className="mt-1 text-sm text-[#777269]">Delivery zone: {zoneLabel}</div>}
        </div>
      </div>
      <div className="px-7 md:px-10">
        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-[#f3f0e9] text-left text-xs uppercase tracking-[.12em] text-[#907f66]">
                <th className="px-4 py-3 font-bold">Item</th>
                <th className="px-4 py-3 text-center font-bold">Qty</th>
                <th className="px-4 py-3 text-right font-bold">Unit price</th>
                <th className="px-4 py-3 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => <tr key={index} className="border-t border-black/10">
                <td className="px-4 py-3"><div className="font-semibold">{item.name}</div><div className="mt-0.5 text-xs text-[#777269]">{item.brand ? `${item.brand} · ` : ""}{item.size}{item.premium ? ` + ${item.premium}` : ""}</div></td>
                <td className="px-4 py-3 text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{money(item.price)}</td>
                <td className="px-4 py-3 text-right font-semibold">{money(item.price * item.quantity)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="ml-auto mt-5 w-full max-w-xs text-sm">
          <div className="flex justify-between py-1.5 text-[#777269]"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
          <div className="flex justify-between py-1.5 text-[#777269]"><span>Delivery</span><span>{order.delivery === 0 ? "Complimentary" : money(order.delivery)}</span></div>
          {(order.discount ?? 0) > 0 && <div className="flex justify-between py-1.5 font-semibold text-[#54724c]"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><span>−{money(order.discount ?? 0)}</span></div>}
          <div className="flex justify-between border-t border-black/10 pt-3 text-base font-bold"><span>Total</span><span>{money(order.total)}</span></div>
          <div className="flex justify-between py-1.5 text-[#777269]"><span>Paid</span><span>{money(paid)}</span></div>
          <div className="flex justify-between py-1.5 text-sm"><span className="text-[#777269]">Due</span><span className={due === 0 ? "font-bold text-[#54724c]" : "font-bold text-[#9b6d5d]"}>{money(due)}</span></div>
        </div>
      </div>
      <div className="mt-7 border-t border-black/10 bg-[#f8f6f0] px-7 py-5 text-xs leading-relaxed text-[#777269] md:px-10">
        Please unbox your parcel in front of the delivery man. Refund / exchange applies only for damaged or wrong products — not for scent preference. <Link href="/refund-policy" className="font-semibold text-[#8e7650] underline underline-offset-4">Read policy</Link>
        <div className="mt-3 text-xs uppercase tracking-[.13em] text-[#9a9388]">Thank you for shopping with UKIZ-BD</div>
      </div>
    </div>
  </section></StorefrontLayout>;
}
