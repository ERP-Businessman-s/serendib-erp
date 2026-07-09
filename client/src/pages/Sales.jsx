import SimpleModule from './SimpleModule.jsx';

// Sales module (Customers). Orders screen is added in Day 2 of the plan.
export default function Sales() {
  return (
    <SimpleModule
      title="Customers"
      subtitle="Sales"
      endpoint="/customers"
      idKey="customer_id"
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
  );
}
