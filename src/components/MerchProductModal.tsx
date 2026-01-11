import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadStripe } from '../lib/stripe';

interface MerchProductModalProps {
  productId: string;
  onClose: () => void;
  onAddToCart: (item: { product: any; variant: any; quantity: number }) => void;
}

interface Variant {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment: number;
  is_available: boolean;
}

export default function MerchProductModal({ productId, onClose, onAddToCart }: MerchProductModalProps) {
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    loadProductData();
  }, [productId]);

  useEffect(() => {
    if (selectedSize && selectedColor) {
      const variant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
      setSelectedVariant(variant || null);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedSize, selectedColor, variants]);

  const loadProductData = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('merch_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      const { data: variantsData, error: variantsError } = await supabase
        .from('merch_product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_available', true)
        .order('size', { ascending: true })
        .order('color', { ascending: true });

      if (variantsError) throw variantsError;
      setVariants(variantsData || []);

      if (variantsData && variantsData.length > 0) {
        const firstVariant = variantsData[0];
        setSelectedSize(firstVariant.size);
        setSelectedColor(firstVariant.color);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSizes = () => {
    const sizes = [...new Set(variants.map(v => v.size))];
    return sizes;
  };

  const getAvailableColors = () => {
    const colors = [...new Set(variants.filter(v => v.size === selectedSize).map(v => v.color))];
    return colors;
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert('Please select size and color');
      return;
    }

    onAddToCart({
      product,
      variant: selectedVariant,
      quantity
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const calculatePrice = () => {
    if (!product) return 0;
    const basePrice = parseFloat(product.base_price);
    const adjustment = selectedVariant ? parseFloat(selectedVariant.price_adjustment) : 0;
    return basePrice + adjustment;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-24 h-24 text-slate-300 dark:text-slate-600" />
                </div>
              )}
            </div>

            <div className="flex flex-col">
              {product.description && (
                <p className="text-slate-600 dark:text-slate-400 mb-6">{product.description}</p>
              )}

              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
                ${calculatePrice().toFixed(2)}
              </div>

              {variants.length > 0 && (
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Size
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {getAvailableSizes().map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-3 rounded-lg font-semibold transition ${
                            selectedSize === size
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedSize && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Color
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {getAvailableColors().map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-3 rounded-lg font-semibold transition ${
                              selectedColor === color
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVariant && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">{selectedVariant.stock_quantity}</span> in stock
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedVariant?.stock_quantity || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant?.stock_quantity || 1, quantity + 1))}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || addedToCart}
                className={`w-full py-4 rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2 ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : !selectedVariant
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
