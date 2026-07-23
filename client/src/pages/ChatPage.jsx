import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  openConversation,
  getConversations,
  getMessages,
  sendMessage,
} from "../services/chatService";
import { connectSocket, getSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { formatPrice, formatQty } from "../utils/pricing";
import { toast } from "../store/toastStore";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

/**
 * Chat page — two-pane layout (conversation list + active thread).
 * Real-time via Socket.io: joins the conversation room and appends
 * incoming `newMessage` events. Supports text + custom offer messages.
 */
export default function ChatPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [conversations, setConversations] = useState([]);
  const [resolving, setResolving] = useState(false);

  const loadConversations = async () => {
    try {
      setConversations(await getConversations());
    } catch {
      /* ignore */
    }
  };

  // Resolve a conversation from context query params (?product / ?rfq&participant).
  useEffect(() => {
    const product = searchParams.get("product");
    const rfq = searchParams.get("rfq");
    const participant = searchParams.get("participant");
    if (!product && !rfq) return;

    setResolving(true);
    (async () => {
      try {
        const { conversation } = await openConversation({
          contextType: product ? "product" : "rfq",
          contextRef: product || rfq,
          participantId: participant || undefined,
        });
        navigate(`/chat/${conversation._id}`, { replace: true });
      } catch (err) {
        toast.error(err.message);
        navigate("/chat", { replace: true });
      } finally {
        setResolving(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    loadConversations();
  }, [id]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-4 font-display text-2xl font-semibold text-text-primary">
        Messages
      </h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
        <ConversationList
          conversations={conversations}
          activeId={id}
          currentUserId={user?._id}
        />
        <div className="min-h-[60vh] rounded-xl border border-border bg-background">
          {resolving ? (
            <Centered>Opening conversation…</Centered>
          ) : id ? (
            <ChatWindow
              conversationId={id}
              currentUser={user}
              onActivity={loadConversations}
            />
          ) : (
            <Centered>Select a conversation to start chatting.</Centered>
          )}
        </div>
      </div>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-8 text-center text-text-secondary">
      {children}
    </div>
  );
}

function ConversationList({ conversations, activeId, currentUserId }) {
  const online = useChatStore((s) => s.online);

  if (conversations.length === 0) {
    return (
      <aside className="rounded-xl border border-border bg-background p-4 text-sm text-text-secondary">
        No conversations yet. Start one from a product or an RFQ.
      </aside>
    );
  }

  return (
    <aside className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
      {conversations.map((c) => {
        const isActive = c._id === activeId;
        const isOnline = c.other && online.has(String(c.other._id));
        return (
          <Link
            key={c._id}
            to={`/chat/${c._id}`}
            className={`block px-4 py-3 transition ${
              isActive ? "bg-fill-subtle" : "hover:bg-background-alt"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative inline-flex h-2.5 w-2.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isOnline ? "bg-success" : "bg-border"
                    }`}
                  />
                </span>
                <span className="font-medium text-text-primary">
                  {c.other?.name || "User"}
                </span>
              </div>
              {c.unreadCount > 0 && (
                <span className="num inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-xs font-semibold text-white">
                  {c.unreadCount}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className="truncate text-xs text-text-secondary">
                {c.context?.title || c.contextType}
              </span>
            </div>
            {c.lastMessage && (
              <p className="mt-1 truncate text-xs text-text-secondary">
                {c.lastMessage.type === "offer"
                  ? "📄 Custom offer"
                  : c.lastMessage.text}
              </p>
            )}
          </Link>
        );
      })}
    </aside>
  );
}

function ChatWindow({ conversationId, currentUser, onActivity }) {
  const [conversation, setConversation] = useState(null);
  const [context, setContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const online = useChatStore((s) => s.online);

  const other = conversation?.participants?.find(
    (p) => p._id !== currentUser?._id
  );
  const otherOnline = other && online.has(String(other._id));

  // Load messages + join the socket room.
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const data = await getMessages(conversationId);
        if (!active) return;
        setConversation(data.conversation);
        setContext(data.context);
        setMessages(data.messages);
        onActivity?.(); // refresh unread counts in the list
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();

    const socket = connectSocket();
    socket?.emit("conversation:join", conversationId);

    const onNew = (msg) => {
      if (msg.conversationRef !== conversationId) return;
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
    };
    socket?.on("newMessage", onNew);

    return () => {
      active = false;
      const s = getSocket();
      s?.emit("conversation:leave", conversationId);
      s?.off("newMessage", onNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Auto-scroll on new messages.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendText = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const msg = await sendMessage(conversationId, { text: body, type: "text" });
      setText("");
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleSendOffer = async (offerDetails) => {
    setSending(true);
    try {
      const msg = await sendMessage(conversationId, {
        type: "offer",
        text: "Sent a custom offer",
        offerDetails,
      });
      setShowOffer(false);
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Centered>Loading conversation…</Centered>;

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                otherOnline ? "bg-success" : "bg-border"
              }`}
            />
            <span className="font-medium text-text-primary">
              {other?.name || "User"}
            </span>
            <span className="text-xs capitalize text-text-secondary">
              {other?.role}
            </span>
          </div>
          {context?.title && (
            <p className="mt-0.5 text-xs text-text-secondary">
              Re: {context.title}
            </p>
          )}
        </div>
        {context?.type === "product" && (
          <Link
            to={`/product/${context.ref}`}
            className="text-sm font-semibold text-accent hover:underline"
          >
            View product
          </Link>
        )}
        {context?.type === "rfq" && (
          <Link
            to={`/rfqs/${context.ref}`}
            className="text-sm font-semibold text-accent hover:underline"
          >
            View RFQ
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-text-secondary">
            No messages yet. Say hello or send an offer.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m._id}
            message={m}
            mine={
              (m.senderRef?._id || m.senderRef) === currentUser?._id
            }
            currentUser={currentUser}
            context={context}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        {showOffer ? (
          <OfferForm
            onCancel={() => setShowOffer(false)}
            onSubmit={handleSendOffer}
            sending={sending}
          />
        ) : (
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOffer(true)}
              className="shrink-0 rounded-md border border-accent px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
            >
              + Offer
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, mine, currentUser, context }) {
  const navigate = useNavigate();

  if (message.type === "offer" && message.offerDetails) {
    const { pricePerUnit, quantity, notes } = message.offerDetails;
    const total = (pricePerUnit || 0) * (quantity || 0);
    // Buyers can accept an offer sent to them -> pre-fill the order flow.
    const canAccept = !mine && currentUser?.role === "buyer";

    const acceptOffer = () => {
      const sellerId = message.senderRef?._id || message.senderRef;
      const params = new URLSearchParams({
        conversation: message.conversationRef,
        offer: message._id,
        price: String(pricePerUnit),
        qty: String(quantity),
      });
      if (context?.type === "product") params.set("product", context.ref);
      if (context?.type === "rfq") {
        params.set("rfq", context.ref);
        if (sellerId) params.set("seller", String(sellerId));
      }
      navigate(`/orders/new?${params.toString()}`);
    };

    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[80%] rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Custom offer
          </p>
          <div className="mt-2 space-y-1 text-sm text-text-primary">
            <div className="flex justify-between gap-6">
              <span className="text-text-secondary">Price / unit</span>
              <span className="num font-medium">{formatPrice(pricePerUnit)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-text-secondary">Quantity</span>
              <span className="num font-medium">{formatQty(quantity)}</span>
            </div>
            <div className="flex justify-between gap-6 border-t border-accent/20 pt-1">
              <span className="text-text-secondary">Total</span>
              <span className="num font-semibold">{formatPrice(total)}</span>
            </div>
            {notes && <p className="pt-1 text-text-secondary">{notes}</p>}
          </div>
          {canAccept && (
            <button
              onClick={acceptOffer}
              className="mt-3 w-full rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Accept Offer
            </button>
          )}
          <p className="mt-1 text-right text-[10px] text-text-secondary">
            {fmtTime(message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  // Plain text bubble.
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
          mine
            ? "bg-primary text-white"
            : "bg-fill-subtle text-text-primary"
        }`}
      >
        <p className="whitespace-pre-line">{message.text}</p>
        <p
          className={`mt-0.5 text-right text-[10px] ${
            mine ? "text-white/60" : "text-text-secondary"
          }`}
        >
          {fmtTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function OfferForm({ onCancel, onSubmit, sending }) {
  const [form, setForm] = useState({ pricePerUnit: "", quantity: "", notes: "" });
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.pricePerUnit || Number(form.pricePerUnit) <= 0)
      return setError("Enter a valid price per unit.");
    if (!form.quantity || Number(form.quantity) < 1)
      return setError("Enter a valid quantity.");
    onSubmit({
      pricePerUnit: Number(form.pricePerUnit),
      quantity: Number(form.quantity),
      notes: form.notes,
    });
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-accent/30 bg-accent/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-accent">Send custom offer</span>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-text-secondary hover:text-danger"
        >
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.pricePerUnit}
          onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
          placeholder="Price / unit"
          className="num rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <input
          type="number"
          min="1"
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          placeholder="Quantity"
          className="num rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <input
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Notes (optional)"
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="mt-2 w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send Offer"}
      </button>
    </form>
  );
}
