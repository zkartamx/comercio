import React from 'react';
import { Product, TranslationKey } from '../types';

/**
 * Props for the ProductCard component.
 */
interface ProductCardProps {
  /** The product object to display. Name and description are expected to be in Spanish. */
  product: Product;
  /** Callback function triggered when the "Add to Cart" button is clicked. */
  onAddToCart: (product: Product) => void;
  /** Translation function. */
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
}

/**
 * ProductCard component.
 * Displays a single product's details (image, name, description, price, stock)
 * and an "Add to Cart" button.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, t }) => {
  // Product name and description are now directly in Spanish from the product object
  return (
    <div className="bg-surface rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col border border-transparent hover:border-secondary/50">
      <img 
        src={product.imageUrl} 
        alt={product.name} // Alt text will be in Spanish, directly from product name
        className="w-full h-64 object-cover" 
        onError={(e) => (e.currentTarget.src = 'https://picsum.photos/400/300?grayscale&blur=2')} // Fallback image
      />
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-serif text-2xl font-bold text-textPrimary mb-2">
          {product.name} 
        </h3>
        <p className="font-sans text-sm text-textSecondary mb-4 flex-grow min-h-[60px]">
          {product.description}
        </p>
        <div className="flex justify-between items-center my-3">
          <span className="font-sans text-3xl font-bold text-secondary">${product.price.toFixed(2)}</span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {product.stock > 0 ? `${product.stock} ${t('inStock')}` : t('outOfStock')}
          </span>
        </div>
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className="w-full bg-secondary hover:bg-secondary-dark text-textOnSecondary font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary-light focus:ring-opacity-75"
          aria-label={`${product.stock > 0 ? t('addToCart') : t('outOfStock')} - ${product.name}`}
        >
          {product.stock > 0 ? t('addToCart') : t('outOfStock')}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
