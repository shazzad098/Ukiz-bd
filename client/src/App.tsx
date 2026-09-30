import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import { SignIn, SignUp } from "./pages/AuthPages";
import ScentIndex from "./pages/ScentIndex";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProductDetails from "./pages/ProductDetails";
import RefundPolicy from "./pages/RefundPolicy";
import { Account, Wishlist, Cart, Checkout, OrderSuccess } from "./pages/CommercePages";
import AdminRoute from "./pages/Admin";
import { CartProvider } from "@/lib/cart";

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Router() {
  return <>
    <ScrollToTop />
    <Switch>
    <Route path="/" component={Home} />
    <Route path="/shop" component={Shop} />
    <Route path="/finder" component={ScentIndex} />
    <Route path="/signin" component={SignIn} />
    <Route path="/signup" component={SignUp} />
    <Route path="/about" component={About} />
    <Route path="/contact" component={Contact} />
    <Route path="/product/:id" component={ProductDetails} />
    <Route path="/refund-policy" component={RefundPolicy} />
    <Route path="/returns" component={RefundPolicy} />
    <Route path="/account" component={Account} />
    <Route path="/wishlist" component={Wishlist} />
    <Route path="/cart" component={Cart} />
    <Route path="/checkout" component={Checkout} />
    <Route path="/order-success" component={OrderSuccess} />
    <Route path="/admin/login" component={() => <AdminRoute login />} />
    <Route path="/admin" component={() => <AdminRoute />} />
    <Route path="/admin/:section" component={() => <AdminRoute />} />
    <Route component={Home} />
  </Switch></>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster position="top-center" /><CartProvider><Router /></CartProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
