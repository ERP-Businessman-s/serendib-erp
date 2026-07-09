// HR module: Employees (including the cutters that the Cutting module assigns).
const crudRouter = require('./_crud');

module.exports = crudRouter({
  table: 'Employees',
  idColumn: 'employee_id',
  columns: ['name', 'role', 'department', 'is_cutter', 'join_date'],
});
