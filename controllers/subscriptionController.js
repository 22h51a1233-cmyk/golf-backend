const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

exports.createCheckout = async (req, res) => {
  try {
    const { plan } = req.body;
    const user = req.user;
    const priceId = plan === 'yearly' ? process.env.STRIPE_YEARLY_PRICE_ID : process.env.STRIPE_MONTHLY_PRICE_ID;
    let customerId = user.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user._id.toString() } });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { 'subscription.stripeCustomerId': customerId });
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.CLIENT_URL}/subscribe?cancelled=true`,
      metadata: { userId: user._id.toString(), plan },
    });
    res.json({ success: true, url: session.url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createPortalSession = async (req, res) => {
  try {
    const user = req.user;
    if (!user.subscription.stripeCustomerId)
      return res.status(400).json({ success: false, message: 'No billing account found' });
    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });
    res.json({ success: true, url: session.url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription');
    res.json({ success: true, subscription: user.subscription });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.handleWebhook = async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) { return res.status(400).json({ message: `Webhook Error: ${e.message}` }); }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        const sub = await stripe.subscriptions.retrieve(s.subscription);
        await User.findByIdAndUpdate(s.metadata.userId, {
          'subscription.status': 'active', 'subscription.plan': s.metadata.plan,
          'subscription.stripeSubscriptionId': s.subscription,
          'subscription.currentPeriodStart': new Date(sub.current_period_start * 1000),
          'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': false,
        });
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv = event.data.object;
        const sub = await stripe.subscriptions.retrieve(inv.subscription);
        await User.findOneAndUpdate({ 'subscription.stripeCustomerId': inv.customer }, {
          'subscription.status': 'active',
          'subscription.currentPeriodStart': new Date(sub.current_period_start * 1000),
          'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
        });
        break;
      }
      case 'customer.subscription.deleted':
        await User.findOneAndUpdate({ 'subscription.stripeCustomerId': event.data.object.customer }, { 'subscription.status': 'cancelled' });
        break;
      case 'invoice.payment_failed':
        await User.findOneAndUpdate({ 'subscription.stripeCustomerId': event.data.object.customer }, { 'subscription.status': 'lapsed' });
        break;
    }
    res.json({ received: true });
  } catch (e) { res.status(500).json({ message: 'Webhook processing failed' }); }
};
