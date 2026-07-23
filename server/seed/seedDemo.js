require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const CompanyProfile = require("../models/CompanyProfile");
const Product = require("../models/Product");
const RFQ = require("../models/RFQ");
const Quote = require("../models/Quote");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Favorite = require("../models/Favorite");

/**
 * Populate the database with a realistic demo dataset for the FYP demo:
 * buyers, sellers, verified + unverified companies, products, RFQs, quotes,
 * orders across every status, reviews, favorites, a chat thread, and
 * notifications.
 *
 *   npm run seed:demo
 *
 * SAFE TO RE-RUN: it wipes all NON-admin data first, then recreates it.
 * The seeded admin account (npm run seed:admin) is left untouched.
 *
 * Every demo account uses the same password: demo1234
 */
const DEMO_PASSWORD = "demo1234";

// Relative time helpers (days/hours ago) for believable timelines.
const now = Date.now();
const daysAgo = (d) => new Date(now - d * 24 * 60 * 60 * 1000);
const daysAhead = (d) => new Date(now + d * 24 * 60 * 60 * 1000);
const hoursAfter = (date, h) => new Date(date.getTime() + h * 60 * 60 * 1000);

/** Build a forward status history up to the given final status. */
const buildStatusHistory = (finalStatus, placedAt) => {
  if (finalStatus === "cancelled") {
    return [
      { status: "pending_payment", timestamp: placedAt },
      { status: "cancelled", timestamp: hoursAfter(placedAt, 2) },
    ];
  }
  const flow = ["pending_payment", "processing", "shipped", "delivered"];
  const end = flow.indexOf(finalStatus);
  return flow
    .slice(0, end + 1)
    .map((status, i) => ({ status, timestamp: hoursAfter(placedAt, i * 20) }));
};

const seedDemo = async () => {
  await connectDB();

  try {
    // ---------------------------------------------------------------------
    // 0. Clear existing NON-admin data (idempotent re-runs).
    // ---------------------------------------------------------------------
    console.log("🧹 Clearing existing demo data (admin preserved)…");
    await Promise.all([
      User.deleteMany({ role: { $ne: "admin" } }),
      CompanyProfile.deleteMany({}),
      Product.deleteMany({}),
      RFQ.deleteMany({}),
      Quote.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Favorite.deleteMany({}),
    ]);

    // ---------------------------------------------------------------------
    // 1. Users (create() so the password pre-save hook hashes each one).
    // ---------------------------------------------------------------------
    console.log("👤 Creating users…");
    const [seller1, seller2, seller3] = await User.create([
      { name: "Ayesha Khan", email: "seller1@demo.com", password: DEMO_PASSWORD, role: "seller", phone: "+92 300 1112221" },
      { name: "Bilal Ahmed", email: "seller2@demo.com", password: DEMO_PASSWORD, role: "seller", phone: "+92 301 2223332" },
      { name: "Fatima Noor", email: "seller3@demo.com", password: DEMO_PASSWORD, role: "seller", phone: "+92 302 3334443" },
    ]);
    const [buyer1, buyer2, buyer3] = await User.create([
      { name: "Hassan Raza", email: "buyer1@demo.com", password: DEMO_PASSWORD, role: "buyer", phone: "+92 311 4445551" },
      { name: "Sana Malik", email: "buyer2@demo.com", password: DEMO_PASSWORD, role: "buyer", phone: "+92 312 5556662" },
      { name: "Usman Tariq", email: "buyer3@demo.com", password: DEMO_PASSWORD, role: "buyer", phone: "+92 313 6667773" },
    ]);

    // ---------------------------------------------------------------------
    // 2. Company profiles (two verified, one pending — for the admin demo).
    // ---------------------------------------------------------------------
    console.log("🏢 Creating company profiles…");
    const company1 = await CompanyProfile.create({
      userRef: seller1._id,
      companyName: "Khan Textiles Ltd.",
      businessType: "Manufacturer",
      description: "Vertically integrated textile manufacturer specialising in cotton fabric, yarn, and finished apparel for bulk export.",
      location: { city: "Faisalabad", region: "Punjab" },
      certifications: ["ISO 9001", "OEKO-TEX"],
      isVerified: true,
      verificationStatus: "approved",
    });
    const company2 = await CompanyProfile.create({
      userRef: seller2._id,
      companyName: "Ahmed Electronics Distribution",
      businessType: "Distributor",
      description: "Authorised distributor of consumer electronics and components, serving retailers across South Asia.",
      location: { city: "Karachi", region: "Sindh" },
      certifications: ["ISO 14001"],
      isVerified: true,
      verificationStatus: "approved",
    });
    const company3 = await CompanyProfile.create({
      userRef: seller3._id,
      companyName: "Noor Foods Trading Co.",
      businessType: "Trader",
      description: "Wholesale trader of packaged foods, spices, and beverages sourced from certified producers.",
      location: { city: "Lahore", region: "Punjab" },
      certifications: ["HALAL"],
      isVerified: false,
      verificationStatus: "pending",
      verificationDocs: ["/uploads/demo-verification-placeholder.pdf"],
    });

    // ---------------------------------------------------------------------
    // 3. Products (valid tiered pricing; lowest tier minQty >= MOQ).
    // ---------------------------------------------------------------------
    console.log("📦 Creating products…");
    const products = await Product.create([
      {
        sellerRef: seller1._id,
        title: "Premium Combed Cotton T-Shirts (Blank)",
        description: "180 GSM combed cotton crew-neck tees. Bulk blanks ideal for printing and private label.",
        category: "Textiles & Apparel",
        moq: 100,
        pricingTiers: [
          { minQty: 100, maxQty: 499, pricePerUnit: 4.5 },
          { minQty: 500, maxQty: 1999, pricePerUnit: 3.8 },
          { minQty: 2000, maxQty: null, pricePerUnit: 3.2 },
        ],
        stockStatus: "in_stock",
      },
      {
        sellerRef: seller1._id,
        title: "Cotton Yarn Cones (30s)",
        description: "Ring-spun 30s cotton yarn on 1.25kg cones. Consistent count for weaving and knitting.",
        category: "Textiles & Apparel",
        moq: 50,
        pricingTiers: [
          { minQty: 50, maxQty: 199, pricePerUnit: 6.0 },
          { minQty: 200, maxQty: null, pricePerUnit: 5.25 },
        ],
        stockStatus: "low_stock",
      },
      {
        sellerRef: seller2._id,
        title: "USB-C Fast Charging Cables (1m)",
        description: "60W USB-C to USB-C cables, braided nylon, retail-boxed. Bulk cartons of 50.",
        category: "Electronics",
        moq: 200,
        pricingTiers: [
          { minQty: 200, maxQty: 999, pricePerUnit: 1.9 },
          { minQty: 1000, maxQty: 4999, pricePerUnit: 1.55 },
          { minQty: 5000, maxQty: null, pricePerUnit: 1.25 },
        ],
        stockStatus: "in_stock",
      },
      {
        sellerRef: seller2._id,
        title: "10000mAh Power Banks",
        description: "Slim aluminium power banks with dual output. OEM branding available on large orders.",
        category: "Electronics",
        moq: 100,
        pricingTiers: [
          { minQty: 100, maxQty: 499, pricePerUnit: 8.5 },
          { minQty: 500, maxQty: null, pricePerUnit: 7.2 },
        ],
        stockStatus: "in_stock",
      },
      {
        sellerRef: seller3._id,
        title: "Basmati Rice 25kg Sacks (Premium)",
        description: "Aged long-grain basmati rice in 25kg woven sacks. Export-grade, aromatic.",
        category: "Food & Beverage",
        moq: 40,
        pricingTiers: [
          { minQty: 40, maxQty: 199, pricePerUnit: 22.0 },
          { minQty: 200, maxQty: null, pricePerUnit: 19.5 },
        ],
        stockStatus: "in_stock",
      },
      {
        sellerRef: seller3._id,
        title: "Assorted Spice Powders (Retail Packs)",
        description: "Turmeric, chilli, coriander, and cumin in 200g retail pouches. Mixed cartons available.",
        category: "Food & Beverage",
        moq: 60,
        pricingTiers: [
          { minQty: 60, maxQty: 299, pricePerUnit: 1.1 },
          { minQty: 300, maxQty: null, pricePerUnit: 0.85 },
        ],
        stockStatus: "out_of_stock",
      },
    ]);
    const [tshirts, yarn, cables, powerbanks, rice] = products;

    // ---------------------------------------------------------------------
    // 4. RFQs (buying leads) — mix of open and closed.
    // ---------------------------------------------------------------------
    console.log("📝 Creating RFQs…");
    const rfqOpen1 = await RFQ.create({
      buyerRef: buyer1._id,
      title: "Bulk blank hoodies for winter line",
      description: "Looking for 350 GSM fleece hoodies, unbranded, sizes S–XL. Need a reliable manufacturer.",
      category: "Textiles & Apparel",
      quantityNeeded: 1500,
      targetPrice: 7.5,
      deadline: daysAhead(14),
      status: "open",
    });
    const rfqClosed = await RFQ.create({
      buyerRef: buyer1._id,
      title: "Wholesale power banks for electronics store",
      description: "Need 500 power banks, 10000mAh minimum, with retail packaging.",
      category: "Electronics",
      quantityNeeded: 500,
      targetPrice: 7.0,
      deadline: daysAgo(2),
      status: "closed",
    });
    const rfqOpen2 = await RFQ.create({
      buyerRef: buyer2._id,
      title: "Basmati rice — recurring monthly supply",
      description: "Seeking a supplier for ~200 sacks/month of premium basmati. Long-term relationship preferred.",
      category: "Food & Beverage",
      quantityNeeded: 200,
      targetPrice: 20.0,
      deadline: daysAhead(21),
      status: "open",
    });
    await RFQ.create({
      buyerRef: buyer3._id,
      title: "USB-C cables for retail chain",
      description: "Evaluating suppliers for 2000 braided USB-C cables. Send samples if possible.",
      category: "Electronics",
      quantityNeeded: 2000,
      targetPrice: 1.4,
      deadline: daysAhead(10),
      status: "open",
    });

    // ---------------------------------------------------------------------
    // 5. Quotes on RFQs — submitted / accepted / rejected.
    // ---------------------------------------------------------------------
    console.log("💬 Creating quotes…");
    await Quote.create([
      { rfqRef: rfqOpen1._id, sellerRef: seller1._id, pricePerUnit: 7.2, message: "We can produce these in 3 weeks. Sample available.", deliveryEstimate: "3 weeks", status: "submitted" },
      { rfqRef: rfqOpen1._id, sellerRef: seller3._id, pricePerUnit: 7.8, message: "Can source via partner factory.", deliveryEstimate: "4 weeks", status: "submitted" },
      { rfqRef: rfqOpen2._id, sellerRef: seller3._id, pricePerUnit: 19.75, message: "Premium aged basmati, monthly supply guaranteed.", deliveryEstimate: "Monthly", status: "submitted" },
      { rfqRef: rfqOpen2._id, sellerRef: seller1._id, pricePerUnit: 21.0, message: "We can also supply rice through our network.", deliveryEstimate: "2 weeks", status: "rejected" },
    ]);
    // Accepted quote backs the closed RFQ's order (below).
    const acceptedQuote = await Quote.create({
      rfqRef: rfqClosed._id,
      sellerRef: seller2._id,
      pricePerUnit: 6.9,
      message: "Retail-packaged, 12-month warranty. Ready to ship.",
      deliveryEstimate: "1 week",
      status: "accepted",
    });

    // ---------------------------------------------------------------------
    // 6. Orders — one for every status + payment combination.
    // ---------------------------------------------------------------------
    console.log("🧾 Creating orders…");
    const makeOrder = ({
      buyer,
      seller,
      product = null,
      rfq = null,
      quantity,
      price,
      status,
      paymentStatus,
      placedAt,
      address,
    }) => ({
      buyerRef: buyer._id,
      sellerRef: seller._id,
      productRef: product ? product._id : null,
      rfqRef: rfq ? rfq._id : null,
      quantity,
      agreedPricePerUnit: price,
      totalAmount: Number((price * quantity).toFixed(2)),
      shippingAddress: address,
      paymentMethod: "cod",
      paymentStatus,
      status,
      statusHistory: buildStatusHistory(status, placedAt),
      createdAt: placedAt,
    });

    // insertMany with timestamps:false so the believable createdAt dates persist
    // (Mongoose would otherwise overwrite createdAt with "now" on creation).
    const orders = await Order.insertMany(
      [
        // Pending payment (fresh order, buyer can still cancel)
        makeOrder({ buyer: buyer1, seller: seller1, product: tshirts, quantity: 500, price: 3.8, status: "pending_payment", paymentStatus: "pending", placedAt: daysAgo(1), address: "Shop 12, Anarkali Bazaar, Lahore, Punjab" }),
        // Processing
        makeOrder({ buyer: buyer2, seller: seller1, product: yarn, quantity: 200, price: 5.25, status: "processing", paymentStatus: "pending", placedAt: daysAgo(4), address: "Warehouse 3, SITE Area, Karachi, Sindh" }),
        // Shipped
        makeOrder({ buyer: buyer1, seller: seller2, product: cables, quantity: 1000, price: 1.55, status: "shipped", paymentStatus: "pending", placedAt: daysAgo(6), address: "Unit 8, Hall Road, Lahore, Punjab" }),
        // Delivered + PAID (has a review)
        makeOrder({ buyer: buyer2, seller: seller2, product: powerbanks, quantity: 500, price: 7.2, status: "delivered", paymentStatus: "paid", placedAt: daysAgo(20), address: "Retail Plaza, Saddar, Karachi, Sindh" }),
        // Delivered + PENDING payment (seller can demo "Mark Payment as Received")
        makeOrder({ buyer: buyer3, seller: seller1, product: tshirts, quantity: 2000, price: 3.2, status: "delivered", paymentStatus: "pending", placedAt: daysAgo(9), address: "Gulberg III, Lahore, Punjab" }),
        // Cancelled
        makeOrder({ buyer: buyer3, seller: seller3, product: rice, quantity: 40, price: 22.0, status: "cancelled", paymentStatus: "pending", placedAt: daysAgo(12), address: "Model Town, Lahore, Punjab" }),
        // Delivered + PAID from an accepted RFQ quote (has a review)
        makeOrder({ buyer: buyer1, seller: seller2, rfq: rfqClosed, quantity: 500, price: acceptedQuote.pricePerUnit, status: "delivered", paymentStatus: "paid", placedAt: daysAgo(15), address: "Unit 8, Hall Road, Lahore, Punjab" }),
      ],
      { timestamps: false }
    );
    const deliveredPaidProduct = orders[3];
    const deliveredPaidRfq = orders[6];

    // ---------------------------------------------------------------------
    // 7. Reviews — only on delivered orders (one per order).
    // ---------------------------------------------------------------------
    console.log("⭐ Creating reviews…");
    await Review.create([
      {
        orderRef: deliveredPaidProduct._id,
        buyerRef: deliveredPaidProduct.buyerRef,
        sellerRef: deliveredPaidProduct.sellerRef,
        ratings: { productQuality: 5, onTimeDelivery: 4, communication: 5 },
        comment: "Excellent power banks, well packaged. Delivery was a day late but communication was great.",
      },
      {
        orderRef: deliveredPaidRfq._id,
        buyerRef: deliveredPaidRfq.buyerRef,
        sellerRef: deliveredPaidRfq.sellerRef,
        ratings: { productQuality: 4, onTimeDelivery: 5, communication: 4 },
        comment: "Fast turnaround on the RFQ and shipped ahead of schedule. Would order again.",
      },
    ]);

    // ---------------------------------------------------------------------
    // 8. Favorites — buyer watchlists.
    // ---------------------------------------------------------------------
    console.log("❤️  Creating favorites…");
    await Favorite.create([
      { userRef: buyer1._id, itemType: "product", itemRef: tshirts._id },
      { userRef: buyer1._id, itemType: "product", itemRef: powerbanks._id },
      { userRef: buyer1._id, itemType: "company", itemRef: company2._id },
      { userRef: buyer2._id, itemType: "product", itemRef: rice._id },
      { userRef: buyer2._id, itemType: "company", itemRef: company1._id },
    ]);

    // ---------------------------------------------------------------------
    // 9. A chat thread (buyer1 <-> seller1 about the t-shirts product).
    // ---------------------------------------------------------------------
    console.log("🗨️  Creating a chat thread…");
    const convo = await Conversation.create({
      participants: [buyer1._id, seller1._id],
      contextType: "product",
      contextRef: tshirts._id,
      lastMessageAt: daysAgo(1),
    });
    await Message.insertMany(
      [
        { conversationRef: convo._id, senderRef: buyer1._id, text: "Hi, can you do 800 units of the combed cotton tees in navy?", type: "text", readBy: [buyer1._id, seller1._id], createdAt: daysAgo(2) },
        { conversationRef: convo._id, senderRef: seller1._id, text: "Yes, navy is in stock. At 800 units you'd be in the 500+ tier at $3.80/unit.", type: "text", readBy: [seller1._id], createdAt: daysAgo(1) },
        { conversationRef: convo._id, senderRef: seller1._id, text: "Here's a formal offer for your order.", type: "offer", offerDetails: { pricePerUnit: 3.75, quantity: 800, notes: "Includes free navy dye upgrade." }, readBy: [seller1._id], createdAt: daysAgo(1) },
      ],
      { timestamps: false }
    );

    // ---------------------------------------------------------------------
    // 10. Notifications — a few unread ones so the bell isn't empty.
    // ---------------------------------------------------------------------
    console.log("🔔 Creating notifications…");
    await Notification.insertMany(
      [
        { userRef: buyer1._id, type: "new_message", message: "Ayesha Khan: Here's a formal offer for your order.", linkTo: `/chat/${convo._id}`, isRead: false, createdAt: daysAgo(1) },
        { userRef: buyer1._id, type: "order_status_change", message: "Your order is now Shipped", linkTo: `/orders/${orders[2]._id}`, isRead: false, createdAt: daysAgo(3) },
        { userRef: buyer2._id, type: "order_status_change", message: "Your order is now Delivered", linkTo: `/orders/${deliveredPaidProduct._id}`, isRead: true, createdAt: daysAgo(18) },
        { userRef: seller1._id, type: "new_quote", message: 'Hassan Raza posted an RFQ you can quote on: "Bulk blank hoodies for winter line"', linkTo: `/rfqs/${rfqOpen1._id}`, isRead: false, createdAt: daysAgo(5) },
      ],
      { timestamps: false }
    );

    // ---------------------------------------------------------------------
    // Summary
    // ---------------------------------------------------------------------
    const counts = {
      users: await User.countDocuments({ role: { $ne: "admin" } }),
      companies: await CompanyProfile.countDocuments(),
      products: await Product.countDocuments(),
      rfqs: await RFQ.countDocuments(),
      quotes: await Quote.countDocuments(),
      orders: await Order.countDocuments(),
      reviews: await Review.countDocuments(),
      favorites: await Favorite.countDocuments(),
      notifications: await Notification.countDocuments(),
    };

    console.log("\n✅ Demo data seeded successfully:");
    console.table(counts);
    console.log("\n🔑 Demo logins (password for all: " + DEMO_PASSWORD + ")");
    console.table([
      { role: "seller", name: "Ayesha Khan", email: "seller1@demo.com", note: "Verified · has orders/reviews" },
      { role: "seller", name: "Bilal Ahmed", email: "seller2@demo.com", note: "Verified · settlement demo" },
      { role: "seller", name: "Fatima Noor", email: "seller3@demo.com", note: "PENDING verification (admin demo)" },
      { role: "buyer", name: "Hassan Raza", email: "buyer1@demo.com", note: "Favorites, chat, RFQs" },
      { role: "buyer", name: "Sana Malik", email: "buyer2@demo.com", note: "Delivered+reviewed order" },
      { role: "buyer", name: "Usman Tariq", email: "buyer3@demo.com", note: "Delivered (unpaid) + cancelled" },
    ]);
    console.log(
      "\nℹ️  Admin is seeded separately: npm run seed:admin (default admin@vicinity.trade / admin12345).\n"
    );
  } catch (error) {
    console.error(`❌ Failed to seed demo data: ${error.message}`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedDemo();
