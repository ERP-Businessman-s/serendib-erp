import { useState } from 'react';
import Tabs from '../components/Tabs.jsx';
import SimpleModule from './SimpleModule.jsx';
import Purchases from './Purchases.jsx';

// Procurement has two screens: Suppliers (who we buy from) and Purchases (the
// buys that create rough lots in Inventory).
export default function Procurement() {
  const [tab, setTab] = useState('suppliers');
  return (
    <div>
      <Tabs
        tabs={[{ key: 'suppliers', label: 'Suppliers' }, { key: 'purchases', label: 'Purchases' }]}
        active={tab} onChange={setTab}
      />
      {tab === 'suppliers' ? (
        <SimpleModule
          title="Suppliers" subtitle="Procurement" endpoint="/suppliers" idKey="supplier_id"
          columns={[
            { key: 'supplier_id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'contact', label: 'Contact' },
            { key: 'country', label: 'Country' },
          ]}
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'contact', label: 'Contact (phone or email)' },
            { key: 'country', label: 'Country' },
          ]}
        />
      ) : <Purchases />}
    </div>
  );
}
