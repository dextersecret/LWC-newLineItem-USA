import { LightningElement, api, wire } from 'lwc';
import getOppLineItems from '@salesforce/apex/LWCOpportunityProductListController.getOppLineItems';

export default class OpportunityProductListUSD extends LightningElement {
	@api recordId;
	tableData;
	subtotalText;

	@wire(getOppLineItems, { recordId: '$recordId' })
	lineItems({ error, data }) {
		if (data) {
			this.tableData = data;
			let sum = 0;
			for (const item of data) {
				sum += item.TotalPrice;
			}
			this.subtotalText = `Subtotal: $${sum.toFixed(2)}`;
		} else if (error) {
			this.tableData = undefined;
			console.log('error: ', error);
		}
	}
	columns = [
		{
			label: 'Product',
			fieldName: 'Product_Name__c',
			type: 'text',
			cellAttributes: { alignment: 'left' },
			wrapText: true
		},
		{
			label: 'Description',
			fieldName: 'Description',
			type: 'text',
			cellAttributes: { alignment: 'left' },
			wrapText: true
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
			fieldName: 'Discount__c',
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
}
