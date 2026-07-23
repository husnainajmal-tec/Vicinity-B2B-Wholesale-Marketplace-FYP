import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Toaster from "./components/Toaster";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { useChatStore } from "./store/chatStore";
import { useNotificationStore } from "./store/notificationStore";
import { useFavoriteStore } from "./store/favoriteStore";
import { connectSocket, disconnectSocket, getSocket } from "./services/socket";
import { getConversations } from "./services/chatService";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CompanyProfileEdit from "./pages/CompanyProfileEdit";
import CompanyProfilePublic from "./pages/CompanyProfilePublic";
import MyProducts from "./pages/MyProducts";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import Search from "./pages/Search";
import BuyingLeads from "./pages/BuyingLeads";
import RFQDetail from "./pages/RFQDetail";
import PostRFQ from "./pages/PostRFQ";
import MyRFQs from "./pages/MyRFQs";
import MyQuotes from "./pages/MyQuotes";
import ChatPage from "./pages/ChatPage";
import OrderCreate from "./pages/OrderCreate";
import MyOrders from "./pages/MyOrders";
import ReceivedOrders from "./pages/ReceivedOrders";
import OrderDetail from "./pages/OrderDetail";
import SettlementSummary from "./pages/SettlementSummary";
import AdminLayout from "./components/AdminLayout";
import AdminStats from "./pages/admin/AdminStats";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import MyFavorites from "./pages/MyFavorites";
import Unauthorized from "./pages/Unauthorized";
import About from "./pages/About";
import Contact from "./pages/Contact";
import DevHealth from "./pages/DevHealth";
import NotFound from "./pages/NotFound";

/**
 * App shell: shared Navbar + Toaster, then routes.
 * On mount, refresh the persisted user from the API (validates the token).
 */
function App() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { setUnreadTotal, setOnlineSnapshot, markOnline, markOffline } =
    useChatStore();
  const { addNotification, reset: resetNotifications } = useNotificationStore();
  const { loadIds: loadFavoriteIds, reset: resetFavorites } = useFavoriteStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Global socket lifecycle + unread badges, tied to auth state.
  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setUnreadTotal(0);
      resetNotifications();
      resetFavorites();
      return;
    }

    const socket = connectSocket();

    const refreshUnread = async () => {
      try {
        const conversations = await getConversations();
        const total = conversations.reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadTotal(total);
      } catch {
        /* ignore */
      }
    };

    refreshUnread();

    if (socket) {
      socket.on("conversationUpdated", refreshUnread);
      socket.on("newNotification", addNotification);
      socket.on("presence:snapshot", ({ online }) => setOnlineSnapshot(online));
      socket.on("presence:online", ({ userId }) => markOnline(userId));
      socket.on("presence:offline", ({ userId }) => markOffline(userId));
    }

    return () => {
      const s = getSocket();
      if (s) {
        s.off("conversationUpdated", refreshUnread);
        s.off("newNotification", addNotification);
        s.off("presence:snapshot");
        s.off("presence:online");
        s.off("presence:offline");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load buyer favorite ids for heart-toggle state.
  useEffect(() => {
    if (token && user?.role === "buyer") {
      loadFavoriteIds();
    } else if (!token) {
      resetFavorites();
    }
  }, [token, user?.role, loadFavoriteIds, resetFavorites]);

  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      {!isAdminArea && <Navbar />}
      <Toaster />

      <div className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dev/health" element={<DevHealth />} />
          <Route path="/company/:id" element={<CompanyProfilePublic />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/marketplace" element={<Search />} />

          {/* RFQ — public feed + detail */}
          <Route path="/rfqs" element={<BuyingLeads />} />
          <Route path="/rfqs/:id" element={<RFQDetail />} />

          {/* RFQ — buyer */}
          <Route
            path="/rfqs/new"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <PostRFQ />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rfqs/mine"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <MyRFQs />
              </ProtectedRoute>
            }
          />

          {/* Quotes — seller */}
          <Route
            path="/quotes/mine"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <MyQuotes />
              </ProtectedRoute>
            }
          />

          {/* Chat — any authenticated user */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* Orders */}
          <Route
            path="/orders/new"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <OrderCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/mine"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/received"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <ReceivedOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/settlement"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <SettlementSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <MyFavorites />
              </ProtectedRoute>
            }
          />

          {/* Seller-only product management */}
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <MyProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/new"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id/edit"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <ProductForm />
              </ProtectedRoute>
            }
          />

          {/* Protected — any authenticated role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/edit"
            element={
              <ProtectedRoute>
                <CompanyProfileEdit />
              </ProtectedRoute>
            }
          />

          {/* Admin — internal tool with its own primary sidebar layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminStats />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="products" element={<AdminProducts />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Site footer — hidden in the admin tool */}
      {!isAdminArea && <Footer />}
    </div>
  );
}

export default App;
