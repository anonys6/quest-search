import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache, serialize } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import ProductListingPage from '@/features/products/components/product-listing';
import ProductTableAction from '@/features/products/components/product-tables/product-table-action';
import ThemeToggle from '@/components/layout/ThemeToggle/theme-toggle';

export const metadata = {
    title: 'QuestSearch - Questions'
};

type pageProps = {
    searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
    const searchParams = await props.searchParams;
    searchParamsCache.parse(searchParams);

    const key = serialize({ ...searchParams });

    return (
        <PageContainer>
            <div className='space-y-4 px-24'>
                <div className='flex items-start justify-between'>
                    <Heading
                        title='Questions'
                        description='Manage products (Server side table functionalities.)'
                    />
                    <ThemeToggle />
                </div>
                <Separator />
                <ProductTableAction />
                <Suspense
                    key={key}
                    fallback={<DataTableSkeleton columnCount={2} rowCount={10} />}
                >
                    <ProductListingPage />
                </Suspense>
            </div>
        </PageContainer>
    );
}
