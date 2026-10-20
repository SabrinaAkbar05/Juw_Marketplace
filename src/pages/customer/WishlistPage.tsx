import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductCard } from '../../components/customer/ProductCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { wishlist, products, addToCart, toggleWishlist, addToast } = useMarketplace();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddAllToCart = () => {
    wishlistedProducts.forEach((product) => {
      addToCart(product, 1);
    });
    addToast({
      type: 'success',
      title: 'Added to Bag',
      message: `All ${wishlistedProducts.length} saved items added to your shopping bag.`,
    });
  };

  if (wishlistedProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={<Heart className="w-10 h-10 text-slate-400" />}
          title="Your Saved Wishlist is Empty"
          description="Explore student handcrafted fashion, calligraphy, bakery, and botanical products and save your favorite items."
          actionText="Browse Marketplace"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            My Saved Items ({wishlistedProducts.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Items saved for future semesters, graduation celebrations, or university gifts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="emerald"
            size="md"
            onClick={handleAddAllToCart}
            leftIcon={<ShoppingBag className="w-4 h-4" />}
          >
            Add All to Shopping Bag
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlistedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
