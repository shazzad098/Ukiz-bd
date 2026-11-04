import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AnalyticsTracker from "./components/AnalyticsTracker";
import SeoController from "./components/Seo";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Route-level code splitting: Shop/Admin/Checkout chunks load on demand,
// keeping the first paint (~Home) small.
const Shop = lazy(() => import("./pages/Shop"));
const ScentIndex = lazy(() => import("./pages/ScentIndex"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const AuthPagesSignIn = lazy(() => import("./pages/AuthPages").then(m => ({ default: m.SignIn })));
const AuthPagesSignUp = lazy(() => import("./pages/AuthPages").then(m => ({ default: m.SignUp })));
const CommerceAccount = lazy(() => import("./pages/CommercePages").then(m => ({ default: m.Account })));
const CommerceWishlist = lazy(() => import("./pages/CommercePages").then(m => ({ default: m.Wishlist })));
const CommerceCart = lazy(() => import("./pages/CommercePages").then(m => ({ default: m.Cart })));
const CommerceCheckout = lazy(() => import("./pages/CommercePages").then(m => ({ default: m.Checkout })));
const CommerceOrderSuccess = lazy(() => import("./pages/CommercePages").then(m => ({ default: m.OrderSuccess })));
const AdminRoute = lazy(() => import("./pages/Admin"));

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageFallback() {
  return <div className="grid min-h-[40vh] place-items-center text-sm text-[#777269]">Loading…</div>;
}

function Router() {
  return <>
    <ScrollToTop />
    <Suspense fallback={<PageFallback />}>
    <Switch>
    <Route path="/" component={Home} />
    <Route path="/shop" component={Shop} />
    <Route path="/finder" component={ScentIndex} />
    <Route path="/signin" component={AuthPagesSignIn} />
    <Route path="/signup" component={AuthPagesSignUp} />
    <Route path="/about" component={About} />
    <Route path="/contact" component={Contact} />
    <Route path="/product/:id" component={ProductDetails} />
    <Route path="/refund-policy" component={RefundPolicy} />
    <Route path="/returns" component={RefundPolicy} />
    <Route path="/account" component={CommerceAccount} />
    <Route path="/wishlist" component={CommerceWishlist} />
    <Route path="/cart" component={CommerceCart} />
    <Route path="/checkout" component={CommerceCheckout} />
    <Route path="/order-success" component={CommerceOrderSuccess} />
    <Route path="/admin/login" component={() => <AdminRoute login />} />
    <Route path="/admin" component={() => <AdminRoute />} />
    <Route path="/admin/:section" component={() => <AdminRoute />} />
    <Route component={NotFound} />
  </Switch>
    </Suspense>
  </>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster position="top-center" /><CartProvider><WishlistProvider><SeoController /><AnalyticsTracker /><Router /></WishlistProvider></CartProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
