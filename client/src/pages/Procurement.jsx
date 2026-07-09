import SimpleModule from './SimpleModule.jsx';

// Procurement module (Suppliers). Purchases screen is added in Day 2 of the plan.
export default function Procurement() {
  return (
    <SimpleModule
      title="Suppliers"
      subtitle="Procurement"
      endpoint="/suppliers"
      idKey="supplier_id"
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
  );
}
