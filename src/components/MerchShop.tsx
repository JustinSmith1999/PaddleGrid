import { useState, useEffect } from 'react';
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
          colorPrimary: '#10b981',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '16px',
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => {
              setShowCheckout(false);
              setShowCart(true);
            }}
            className="mb-4 sm:mb-6 text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
          >
            ← Back to Cart
          </button>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-emerald-600 text-white px-6 py-4">
              <h2 className="text-2xl font-bold">Secure Checkout</h2>
              <p className="text-emerald-100 text-sm mt-1">Complete your purchase securely</p>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-600" />
                      Shipping Information
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        required
                      />
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input
                          type="email"
                          placeholder="Email *"
                          value={shippingAddress.email}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Phone *"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Address Line 1 *"
                        value={shippingAddress.address_line1}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        value={shippingAddress.address_line2}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        <input
                          type="text"
                          placeholder="City *"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="col-span-2 sm:col-span-3 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                          required
                        />
                        <input
                          type="text"
                          placeholder="State *"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          className="col-span-1 sm:col-span-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                          required
                        />
                        <input
                          type="text"
                          placeholder="ZIP *"
                          value={shippingAddress.postal_code}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                          className="col-span-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      Payment Method
                    </h3>
                    <div id="payment-element"></div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6 sticky top-4">
                    <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {cart.map((item, index) => (
                        <div key={index} className="flex gap-3 pb-3 border-b border-gray-200">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product.name}</p>
                            {(item.selectedDesign || item.selectedColor || item.selectedSize) && (
                              <p className="text-xs text-gray-600 truncate">
                                {[item.selectedDesign, item.selectedColor, item.selectedSize].filter(Boolean).join(' • ')}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-emerald-600 mt-1">
                              ${getItemPrice(item).toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 py-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">${getCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{getShippingCost() === 0 ? 'FREE' : `$${getShippingCost().toFixed(2)}`}</span>
                      </div>
                      {getShippingCost() > 0 && (
                        <p className="text-xs text-gray-500">Free shipping on orders over $50</p>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">${getTax().toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between font-bold text-xl">
                        <span>Total</span>
                        <span className="text-emerald-600">${getGrandTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={processingPayment || !elements}
                      className="w-full mt-4 bg-emerald-600 text-white py-3.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg"
                    >
                      {processingPayment ? 'Processing Payment...' : `Pay $${getGrandTotal().toFixed(2)}`}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-3">
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pickleball Heaven Merch</h1>
            <p className="text-sm text-gray-600">Premium pickleball gear and apparel</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products available yet</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const firstImage = product.images?.[0];
              const hasDesigns = product.designs && Array.isArray(product.designs) && product.designs.length > 0;
              const hasSizes = product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer group"
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
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-emerald-600">${product.price.toFixed(2)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                      >
                        {hasSizes || hasDesigns ? 'View Options' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {currentImage || selectedProduct.images?.[0] ? (
                      <img
                        src={currentImage || selectedProduct.images?.[0]}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-24 h-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedProduct.images.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImage(img)}
                          className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                            currentImage === img || (!currentImage && idx === 0)
                              ? 'border-emerald-600'
                              : 'border-gray-200 hover:border-gray-300'
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
                    <p className="text-3xl font-bold text-emerald-600">${selectedProduct.price.toFixed(2)}</p>
                    <p className="text-gray-600 mt-2">{selectedProduct.description}</p>
                  </div>

                  {selectedProduct.designs && Array.isArray(selectedProduct.designs) && selectedProduct.designs.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Design Type</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.designs.map((design: any) => (
                          <button
                            key={design.type}
                            onClick={() => {
                              setSelectedDesignType(design.type);
                              setSelectedColor(design.colors?.[0]?.name || '');
                              setCurrentImage(design.colors?.[0]?.image || selectedProduct.images?.[0] || '');
                            }}
                            className={`px-4 py-2 rounded-lg border-2 transition ${
                              selectedDesignType === design.type
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                : 'border-gray-300 hover:border-gray-400'
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                      <div className="flex flex-wrap gap-3">
                        {selectedProduct.designs
                          .find((d: any) => d.type === selectedDesignType)
                          ?.colors?.map((color: any) => (
                            <button
                              key={color.name}
                              onClick={() => {
                                setSelectedColor(color.name);
                                setCurrentImage(color.image);
                              }}
                              className={`px-4 py-2 rounded-lg border-2 transition ${
                                selectedColor === color.name
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                  : 'border-gray-300 hover:border-gray-400'
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.sizes.map((size: string) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-lg border-2 transition ${
                              selectedSize === size
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                : 'border-gray-300 hover:border-gray-400'
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
                    className="w-full bg-emerald-600 text-white py-4 rounded-lg hover:bg-emerald-700 transition font-semibold text-lg"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold">Shopping Cart</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="flex gap-4 pb-4 border-b">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.product.name}</h3>
                        {(item.selectedDesign || item.selectedColor || item.selectedSize) && (
                          <p className="text-sm text-gray-600">
                            {[item.selectedDesign, item.selectedColor, item.selectedSize].filter(Boolean).join(' - ')}
                          </p>
                        )}
                        <p className="text-emerald-600 font-bold mt-1">${getItemPrice(item).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(index, -1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, 1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>{getShippingCost() === 0 ? 'FREE' : `$${getShippingCost().toFixed(2)}`}</span>
                  </div>
                  {getShippingCost() > 0 && (
                    <p className="text-xs text-gray-500">Free shipping on orders over $50</p>
                  )}
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-semibold"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
