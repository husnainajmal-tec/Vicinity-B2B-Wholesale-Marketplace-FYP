import OrdersView from "../components/OrdersView";
import { getReceivedOrders } from "../services/orderService";

/** Seller "Orders Received" page. */
export default function ReceivedOrders() {
  return (
    <OrdersView
      title="Orders Received"
      subtitle="Fulfill orders and update their status."
      fetcher={getReceivedOrders}
      mode="seller"
    />
  );
}
