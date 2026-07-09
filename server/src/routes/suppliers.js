// Procurement module (part 1): Suppliers. Purchases are added later.
const crudRouter = require('./_crud');

module.exports = crudRouter({
  table: 'Suppliers',
  idColumn: 'supplier_id',
  columns: ['name', 'contact', 'country'],
});
