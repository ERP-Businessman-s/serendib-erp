import { useState } from 'react';
import Tabs from '../components/Tabs.jsx';
import SimpleModule from './SimpleModule.jsx';
import Orders from './Orders.jsx';

// Sales has two screens: Customers (who buys) and Orders (the sales that reserve
// and sell finished lots).
export default function Sales() {
  const [tab, setTab] = useState('customers');
  return (
    <div>
      <Tabs
        tabs={[{ key: 'customers', label: 'Customers' }, { key: 'orders', label: 'Orders' }]}
        active={tab} onChange={setTab}
      />
      {tab === 'customers' ? (
        <SimpleModule
          title="Customers" subtitle="Sales" endpoint="/customers" idKey="customer_id"
          columns={[
            { key: 'customer_id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'address', label: 'Address' },
          ]}
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'address', label: 'Address' },
          ]}
        />
      ) : <Orders />}
    </div>
  );
}
