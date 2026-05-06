import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ShoppingBag, Filter, X, Plus, Minus, Check, CreditCard, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe, createSetupIntent, savePaymentMethod } from '../lib/stripe';
import { useLocation } from 'react-router-dom';

interface ProductDesign {
  type: string;
  colors: {
    name: string;
    image: string;
  }[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  designs: ProductDesign[];
  sizes: string[];
  in_stock: boolean;
  display_order: number;
}

interface CartItem {
  product: Product;
  selectedDesign?: string;
  selectedColor?: string;
  selectedSize?: string;
  imageUrl?: string;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
}

export default function MerchShop() {
  const { user } = useAuth();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(location.state?.cart || []);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedDesignType, setSelectedDesignType] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<string>('');
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    email: user?.email || '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
  });

  useEffect(() => {
    loadProducts();
    initializeStripe();
    // Open cart if items were passed from club page
    if (location.state?.cart && location.state.cart.length > 0) {
      setShowCart(true);
    }
  }, []);

  useEffect(() => {
    if (showCheckout && stripe && clientSecret && !elements) {
      initializePaymentElement();
    }
  }, [showCheckout, stripe, clientSecret]);

  async function initializeStripe() {
    try {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) return;
      const stripeInstance = await loadStripe(publishableKey);
      setStripe(stripeInstance);
    } catch (err) {
      console.error('Failed to initialize Stripe:', err);
    }
  }

  async function initializePaymentElement() {
    if (!stripe || !clientSecret) return;

    const elementsInstance = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#15803d',
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontSize: '16px',
          borderRadius: '12px',
        }
      },
    });

    const paymentElement = elementsInstance.create('payment', {
      layout: 'tabs',
      wallets: {
        applePay: 'auto',
        googlePay: 'auto'
      }
    });

    paymentElement.mount('#payment-element');
    setElements(elementsInstance);
  }

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('merch_products')
        .select('*')
        .eq('is_active', true)
        .eq('in_stock', true)
        .order('display_order');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product: Product, design?: string, color?: string, size?: string, imageUrl?: string) {
    const existingIndex = cart.findIndex(
      item =>
        item.product.id === product.id &&
        item.selectedDesign === design &&
        item.selectedColor === color &&
        item.selectedSize === size
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        product,
        selectedDesign: design,
        selectedColor: color,
        selectedSize: size,
        imageUrl,
        quantity: 1
      }]);
    }
  }

  function updateQuantity(index: number, delta: number) {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  }

  function getItemPrice(item: CartItem): number {
    return item.product.price;
  }

  function getCartTotal(): number {
    return cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  }

  function getShippingCost(): number {
    const total = getCartTotal();
    return total >= 50 ? 0 : 8.99;
  }

  function getTax(): number {
    return (getCartTotal() + getShippingCost()) * 0.08;
  }

  function getGrandTotal(): number {
    return getCartTotal() + getShippingCost() + getTax();
  }

  async function handleCheckout() {
    if (!user) {
      alert('Please sign in to checkout');
      return;
    }

    if (cart.length === 0) return;

    try {
      const { clientSecret: secret } = await createSetupIntent();
      setClientSecret(secret);
      setShowCheckout(true);
      setShowCart(false);
    } catch (err) {
      console.error('Failed to initialize checkout:', err);
      alert('Failed to initialize checkout. Please try again.');
    }
  }

  async function handlePlaceOrder() {
    if (!stripe || !elements || !user) return;

    setProcessingPayment(true);

    try {
      const { error: submitError } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.origin + '/merch/order-complete',
        }
      });

      if (submitError) {
        throw new Error(submitError.message);
      }

      const orderNumber = 'ORD-' + Date.now();

      const { data: order, error: orderError } = await supabase
        .from('merch_orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          total_amount: getGrandTotal(),
          tax_amount: getTax(),
          shipping_amount: getShippingCost(),
          shipping_name: shippingAddress.name,
          shipping_email: shippingAddress.email,
          shipping_phone: shippingAddress.phone,
          shipping_address_line1: shippingAddress.address_line1,
          shipping_address_line2: shippingAddress.address_line2,
          shipping_city: shippingAddress.city,
          shipping_state: shippingAddress.state,
          shipping_postal_code: shippingAddress.postal_code,
          payment_status: 'paid',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        variant_id: item.variant?.id || null,
        product_name: item.product.name,
        variant_details: item.variant ? `${item.variant.size || ''} ${item.variant.color || ''}`.trim() : null,
        quantity: item.quantity,
        unit_price: getItemPrice(item),
        total_price: getItemPrice(item) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('merch_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setCart([]);
      setShowCheckout(false);
      alert('Order placed successfully! Order #' + orderNumber);
    } catch (err: any) {
      console.error('Order error:', err);
      alert(err.message || 'Failed to place order');
    } finally {
      setProcessingPayment(false);
    }
  }

  const categories = ['all', ...new Set(products.map(p => p.category))];
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-600 text-slate-900 transition-all duration-200 outline-none placeholder:text-slate-400";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F8F9FC]">
        <div className="w-10 h-10 border-2 border-green-700/20 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] py-6 sm:py-10">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => {
              setShowCheckout(false);
              setShowCart(true);
            }}
            className="mb-6 text-green-700 hover:text-green-800 font-medium flex items-center gap-2 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Cart
          </button>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="bg-green-700 text-white px-8 py-5">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>Secure Checkout</h2>
              <p className="text-green-200 text-sm mt-1">Complete your purchase securely</p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
                    <h3
                      className="font-bold text-lg mb-5 flex items-center gap-2 text-slate-800"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-green-700" />
                      </div>
                      Shipping Information
                    </h3>
                    <div className="space-y-3">
                      <input type="text" placeholder="Full Name *" value={shippingAddress.name} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} className={inputClass} required />
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input type="email" placeholder="Email *" value={shippingAddress.email} onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })} className={inputClass} required />
                        <input type="tel" placeholder="Phone *" value={shippingAddress.phone} onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })} className={inputClass} required />
                      </div>
                      <input type="text" placeholder="Address Line 1 *" value={shippingAddress.address_line1} onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })} className={inputClass} required />
                      <input type="text" placeholder="Address Line 2 (Optional)" value={shippingAddress.address_line2} onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })} className={inputClass} />
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        <input type="text" placeholder="City *" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} className={`col-span-2 sm:col-span-3 ${inputClass}`} required />
                        <input type="text" placeholder="State *" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} className={`col-span-1 sm:col-span-2 ${inputClass}`} required />
                        <input type="text" placeholder="ZIP *" value={shippingAddress.postal_code} onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })} className={`col-span-1 ${inputClass}`} required />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
                    <h3
                      className="font-bold text-lg mb-5 flex items-center gap-2 text-slate-800"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-green-700" />
                      </div>
                      Payment Method
                    </h3>
                    <div id="payment-element"></div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60 sticky top-4">
                    <h3 className="font-bold text-lg mb-5 text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>Order Summary</h3>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {cart.map((item, index) => (
                        <div key={index} className="flex gap-3 pb-3 border-b border-slate-200/60">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.product.name} className="w-14 h-14 object-cover rounded-xl ring-2 ring-white shadow-sm" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-800 truncate">{item.product.name}</p>
                            {(item.selectedDesign || item.selectedColor || item.selectedSize) && (
                              <p className="text-xs text-slate-400 truncate">
                                {[item.selectedDesign, item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-green-700 mt-1">
                              ${getItemPrice(item).toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 py-4 border-t border-slate-200/60">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-medium text-slate-800">${getCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Shipping</span>
                        <span className="font-medium text-slate-800">{getShippingCost() === 0 ? 'FREE' : `$${getShippingCost().toFixed(2)}`}</span>
                      </div>
                      {getShippingCost() > 0 && (
                        <p className="text-xs text-slate-400">Free shipping on orders over $50</p>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tax</span>
                        <span className="font-medium text-slate-800">${getTax().toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-200/60 pt-3 flex justify-between font-bold text-xl">
                        <span className="text-slate-800">Total</span>
                        <span className="text-green-700">${getGrandTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={processingPayment || !elements}
                      className="w-full mt-4 bg-green-700 text-white py-3.5 rounded-xl hover:bg-green-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-lg shadow-sm hover:shadow-md"
                    >
                      {processingPayment ? 'Processing Payment...' : `Pay $${getGrandTotal().toFixed(2)}`}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-3">
                      Secure payment powered by Stripe
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold text-slate-800"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Pickleball Heaven Merch
            </h1>
            <p className="text-sm text-slate-400">Premium pickleball gear and apparel</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative p-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white shadow-sm">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Filter Pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full whitespace-nowrap transition-all duration-200 text-sm font-medium border ${
                selectedCategory === cat
                  ? 'bg-green-700 text-white border-green-700 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200/60 hover:border-slate-300 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-500 text-lg font-medium">No products available yet</p>
            <p className="text-slate-400 text-sm mt-1">Check back soon for new items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product, index) => {
              const firstImage = product.images?.[0];
              const hasDesigns = product.designs && Array.isArray(product.designs) && product.designs.length > 0;
              const hasSizes = product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    setSelectedProduct(product);
                    if (hasDesigns) {
                      setSelectedDesignType(product.designs[0]?.type || '');
                      setSelectedColor(product.designs[0]?.colors?.[0]?.name || '');
                      setCurrentImage(product.designs[0]?.colors?.[0]?.image || firstImage || '');
                    } else {
                      setCurrentImage(firstImage || '');
                    }
                    if (hasSizes) {
                      setSelectedSize(product.sizes[0] || '');
                    }
                  }}
                >
                  <div className="aspect-square bg-slate-50 overflow-hidden">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-14 h-14 text-slate-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3
                      className="font-semibold text-slate-800 mb-1 group-hover:text-green-700 transition-colors"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-700" style={{ fontFamily: 'Manrope, sans-serif' }}>${product.price.toFixed(2)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="px-4 py-2 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                      >
                        {hasSizes || hasDesigns ? 'View Options' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/60 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-lg z-10 rounded-t-2xl">
                <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>{selectedProduct.name}</h2>
                <button onClick={() => setSelectedProduct(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/60">
                      {currentImage || selectedProduct.images?.[0] ? (
                        <img
                          src={currentImage || selectedProduct.images?.[0]}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-20 h-20 text-slate-200" />
                        </div>
                      )}
                    </div>
                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {selectedProduct.images.map((img: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImage(img)}
                            className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                              currentImage === img || (!currentImage && idx === 0)
                                ? 'border-green-700 ring-2 ring-green-500/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img src={img} alt={`${selectedProduct.name} ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-3xl font-bold text-green-700" style={{ fontFamily: 'Manrope, sans-serif' }}>${selectedProduct.price.toFixed(2)}</p>
                      <p className="text-slate-500 mt-2 leading-relaxed">{selectedProduct.description}</p>
                    </div>

                    {selectedProduct.designs && Array.isArray(selectedProduct.designs) && selectedProduct.designs.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Design Type</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.designs.map((design: any) => (
                            <button
                              key={design.type}
                              onClick={() => {
                                setSelectedDesignType(design.type);
                                setSelectedColor(design.colors?.[0]?.name || '');
                                setCurrentImage(design.colors?.[0]?.image || selectedProduct.images?.[0] || '');
                              }}
                              className={`px-4 py-2 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                                selectedDesignType === design.type
                                  ? 'border-green-700 bg-green-50 text-green-700'
                                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {design.type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedProduct.designs && Array.isArray(selectedProduct.designs) && selectedProduct.designs.length > 0 && selectedDesignType && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Color</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.designs
                            .find((d: any) => d.type === selectedDesignType)
                            ?.colors?.map((color: any) => (
                              <button
                                key={color.name}
                                onClick={() => {
                                  setSelectedColor(color.name);
                                  setCurrentImage(color.image);
                                }}
                                className={`px-4 py-2 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                                  selectedColor === color.name
                                    ? 'border-green-700 bg-green-50 text-green-700'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                {color.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {selectedProduct.sizes && Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Size</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sizes.map((size: string) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-4 py-2 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                                selectedSize === size
                                  ? 'border-green-700 bg-green-50 text-green-700'
                                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        addToCart(
                          selectedProduct,
                          selectedDesignType,
                          selectedColor,
                          selectedSize,
                          currentImage || selectedProduct.images?.[0]
                        );
                        setSelectedProduct(null);
                      }}
                      className="w-full bg-green-700 text-white py-4 rounded-xl hover:bg-green-800 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/60 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>Shopping Cart</h2>
                <button onClick={() => setShowCart(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4 pb-4 border-b border-slate-100"
                      >
                        <div className="w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 overflow-hidden border border-slate-200/60">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 text-sm">{item.product.name}</h3>
                          {(item.selectedDesign || item.selectedColor || item.selectedSize) && (
                            <p className="text-xs text-slate-400">
                              {[item.selectedDesign, item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                            </p>
                          )}
                          <p className="text-green-700 font-bold text-sm mt-1">${getItemPrice(item).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200/60"
                          >
                            <Minus className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <span className="w-8 text-center font-semibold text-sm text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, 1)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200/60"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-semibold text-slate-800">${getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Shipping</span>
                      <span className="font-medium text-slate-600">{getShippingCost() === 0 ? 'FREE' : `$${getShippingCost().toFixed(2)}`}</span>
                    </div>
                    {getShippingCost() > 0 && (
                      <p className="text-xs text-slate-400">Free shipping on orders over $50</p>
                    )}
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-700 text-white py-3.5 rounded-xl hover:bg-green-800 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
