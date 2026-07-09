// Sales module (part 1): Customers. Orders are added later.
const crudRouter = require('./_crud');

module.exports = crudRouter({
  table: 'Customers',
  idColumn: 'customer_id',
  columns: ['name', 'email', 'phone', 'address'],
});
