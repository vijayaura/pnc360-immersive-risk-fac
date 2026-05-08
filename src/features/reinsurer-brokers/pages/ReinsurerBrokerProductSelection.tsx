import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/shared/ProductCard';
import { brokerProducts } from '@/features/reinsurer-brokers/data/mockData';

export default function ReinsurerBrokerProductSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full overflow-auto bg-slate-50">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-8">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <Button variant="ghost" className="mb-4 gap-2 px-0" onClick={() => navigate('/reinsurer-broker/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Create Facultative Request</p>
            <h2 className="text-2xl font-bold text-slate-900">Select Insurance Product</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Choose the product for the facultative placement. The next step lets the broker attach a quote form and
              populate the request details in structured sections.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {brokerProducts.map((product) => (
            <ProductCard
              key={product.id}
              code={product.code}
              name={product.name}
              description={product.description}
              icon={product.category === 'Property' ? <Building2 className="w-6 h-6" /> : <Package className="w-6 h-6" />}
              color="primary"
              onClick={() => navigate(`/reinsurer-broker/facultative-request/${product.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
