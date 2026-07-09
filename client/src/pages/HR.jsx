import SimpleModule from './SimpleModule.jsx';

// HR module (Employees, including the cutters the Cutting module assigns).
export default function HR() {
  return (
    <SimpleModule
      title="Employees"
      subtitle="HR & Staff"
      endpoint="/employees"
      idKey="employee_id"
      columns={[
        { key: 'employee_id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'department', label: 'Department' },
        { key: 'is_cutter', label: 'Cutter', format: (v) => (v ? 'Yes' : 'No') },
      ]}
      fields={[
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'department', label: 'Department' },
        { key: 'is_cutter', label: 'Is a cutter?', options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }] },
        { key: 'join_date', label: 'Join date', type: 'date' },
      ]}
    />
  );
}
