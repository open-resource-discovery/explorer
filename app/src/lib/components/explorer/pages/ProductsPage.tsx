import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { ChevronRight } from "lucide-react";
import type { Selection } from "../useNavState";

export interface ProductsPageProps {
  onSelect: (s: Selection) => void;
}

export function ProductsPage({ onSelect }: ProductsPageProps) {
  const document = useOrdDocument();
  const products = document.products ?? [];

  return (
    <div className="bg-background" data-testid="products-list">
      <div className="p-4 space-y-3">
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">No products found.</p>
        )}
        {products.map((product) => (
          <button
            key={product.ordId}
            onClick={() =>
              onSelect({ id: "productDetail", ordId: product.ordId })
            }
            className="w-full text-left rounded-[var(--ord-radius)] border border-border bg-card-bg p-4 flex flex-col gap-1.5 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-card-fg">
                {product.title}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
            </div>
            {product.shortDescription && (
              <p className="text-xs text-muted-foreground">
                {product.shortDescription}
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {product.vendor && (
                <span className="font-medium text-card-fg">
                  {product.vendor}
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {product.ordId}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
