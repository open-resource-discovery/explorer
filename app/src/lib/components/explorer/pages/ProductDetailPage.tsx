import { ChevronLeft, ShoppingBag } from "lucide-react";
import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { CopyButton } from "./shared";
import { ResourceGroupList, getResourcesInProduct } from "../ResourceGroupList";
import type { Selection } from "../useNavState";

export interface ProductDetailPageProps {
  ordId: string;
  onSelect: (s: Selection) => void;
}

export function ProductDetailPage({ ordId, onSelect }: ProductDetailPageProps) {
  const document = useOrdDocument();
  const product = (document.products ?? []).find((p) => p.ordId === ordId);

  if (!product) {
    return (
      <div className="px-6 py-6">
        <p className="text-sm text-muted-foreground">
          Product not found: {ordId}
        </p>
      </div>
    );
  }

  const parentProduct = product.parent
    ? (document.products ?? []).find((p) => p.ordId === product.parent)
    : undefined;

  const resourcesInProduct = getResourcesInProduct(document, ordId);

  return (
    <div className="bg-background" data-testid="product-detail">
      <div className="px-6 pt-5 pb-0">
        <button
          onClick={() => onSelect({ id: "products" })}
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Products
        </button>

        <div className="flex items-start gap-3 mb-6">
          <div className="shrink-0 rounded-lg border border-border/60 p-2 bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-card-fg">{product.title}</h1>
            {product.vendor && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {product.vendor}
              </p>
            )}
            <div className="flex items-center gap-1 mt-2">
              <code className="text-xs font-mono bg-muted/40 border border-border rounded px-2 py-1 text-muted-foreground">
                {product.ordId}
              </code>
              <CopyButton text={product.ordId} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {(product.shortDescription || product.description) && (
          <div className="space-y-1.5">
            {product.shortDescription && (
              <p className="text-sm text-muted-foreground">
                {product.shortDescription}
              </p>
            )}
            {product.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {product.description}
              </p>
            )}
          </div>
        )}

        {product.parent && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Parent product
            </p>
            <div className="rounded-[var(--ord-radius)] border border-border bg-card-bg px-3 py-2">
              <p className="text-sm font-medium text-card-fg">
                {parentProduct?.title ?? product.parent}
              </p>
              <p className="text-xs font-mono text-muted-foreground truncate">
                {product.parent}
              </p>
            </div>
          </div>
        )}

        <ResourceGroupList
          heading="Resources in this product"
          groups={resourcesInProduct}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
