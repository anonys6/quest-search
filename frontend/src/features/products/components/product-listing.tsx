// /frontend/src/features/products/components/product-listing.tsx
import { searchParamsCache } from '@/lib/searchparams';
import { DataTable as ProductTable } from '@/components/ui/table/data-table';
import { columns } from './product-tables/columns';

type QuestionListingPageProps = {};

// Utility function to fetch from /api/product in a server component
async function fetchQuestions(filters: {
  page: number;
  limit: number;
  search?: string;
  categories?: string;
}) {
  const { page, limit, search, categories } = filters;
  const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/product`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (search) url.searchParams.set('search', search);
  if (categories) url.searchParams.set('categories', categories);

  // Force no caching so results are always fresh
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch data from gRPC');
  }
  return res.json() as Promise<{
    success: boolean;
    total_products: number;
    products: any;
  }>;
}

export default async function ProductListingPage({ }: QuestionListingPageProps) {
  // Grab search params from searchParamsCache
  const page = searchParamsCache.get('page') ?? 1;
  const search = searchParamsCache.get('q') ?? '';
  const pageLimit = searchParamsCache.get('limit') ?? 10;
  const categories = searchParamsCache.get('categories') ?? '';

  // build an object
  const filters = {
    page: Number(page),
    limit: Number(pageLimit),
    ...(search && { search: String(search) }),
    ...(categories && { categories: String(categories) })
  };

  const data = await fetchQuestions(filters);
  const totalProducts = data.total_products;
  const products = data.products;

  return (
    <ProductTable
      columns={columns}
      data={products}
      totalItems={totalProducts}
    />
  );
}
