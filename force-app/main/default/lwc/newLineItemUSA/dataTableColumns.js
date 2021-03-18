const actions = [ { label: 'Edit', name: 'edit' }, { label: 'Delete', name: 'delete' } ];

const columns = [
	{ type: 'action', typeAttributes: { rowActions: actions, menuAlignment: 'auto' } },
	{
		label: 'Product',
		fieldName: 'Opp_Prod_Name__c',
		type: 'text',
		cellAttributes: { alignment: 'left' },
		wrapText: true
	},
	{
		label: 'Description',
		fieldName: 'Description',
		type: 'text',
		cellAttributes: { alignment: 'left' },
		wrapText: true,
		editable: true
	},
	{
		label: 'ListPrice',
		fieldName: 'ListPrice',
		type: 'currency',
		typeAttributes: { currencyCode: 'USD' },
		cellAttributes: { alignment: 'right' }
		// initialWidth: 130
	},
	{
		label: 'SalesPrice',
		fieldName: 'UnitPrice',
		type: 'currency',
		typeAttributes: { currencyCode: 'USD' },
		cellAttributes: { alignment: 'right' }
		// initialWidth: 130
	},
	{
		label: 'Quantity',
		fieldName: 'Quantity',
		type: 'number',
		cellAttributes: { alignment: 'right' }
		// initialWidth: 100
	},
	{
		label: 'Discount %',
		fieldName: 'Discount__c', //not a percent or decimal field for some historic reason
		type: 'number',
		cellAttributes: {
			alignment: 'right',
			iconName: 'noicon',
			iconLabel: '%',
			iconPosition: 'right',
			iconAlternativeText: '%'
		}
		// initialWidth: 130
	},
	{
		label: 'Total Price',
		fieldName: 'TotalPrice',
		type: 'currency',
		typeAttributes: { currencyCode: 'USD' },
		cellAttributes: { alignment: 'right' }
		// initialWidth: 130
	}
];

export { columns };
