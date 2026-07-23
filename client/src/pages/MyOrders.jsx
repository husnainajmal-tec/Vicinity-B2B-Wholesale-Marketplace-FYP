import OrdersView from "../components/OrdersView";
import { getMyOrders } from "../services/orderService";

/** Buyer "My Orders" page. */
export default function MyOrders() {
  return (
    <OrdersView
      title="My Orders"
      subtitle="Track your purchases and their delivery status."
      fetcher={getMyOrders}
      mode="buyer"
    />
  );
}
