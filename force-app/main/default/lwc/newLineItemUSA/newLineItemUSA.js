import { LightningElement, api, track, wire } from 'lwc';
import getProducts from '@salesforce/apex/LWCNewLineItemController.getProducts';
import getLineItems from '@salesforce/apex/LWCNewLineItemController.getLineItems';
import getProductFamily from '@salesforce/apex/LWCNewLineItemController.getProductFamily';
import { getRecord, createRecord, updateRecord, deleteRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import QUOTE_LINE_ITEM_OBJECT from '@salesforce/schema/QuoteLineItem';
import PRICEBOOKENTRYID_FIELD from '@salesforce/schema/QuoteLineItem.PricebookEntryId';
import QUOTEID_FIELD from '@salesforce/schema/QuoteLineItem.QuoteId';
import QUANTITY_FIELD from '@salesforce/schema/QuoteLineItem.Quantity';
import UNITPRICE_FIELD from '@salesforce/schema/QuoteLineItem.UnitPrice';
import DESCRIPTION_FIELD from '@salesforce/schema/QuoteLineItem.Description';
import DISCOUNT_FIELD from '@salesforce/schema/QuoteLineItem.Discount__c';
import LINEITEMID_FIELD from '@salesforce/schema/QuoteLineItem.Id';

import { columns } from './dataTableColumns';

export default class NewLineItemUSA extends LightningElement {
	unitPriceField = UNITPRICE_FIELD;
	quantityField = QUANTITY_FIELD;
	descriptionField = DESCRIPTION_FIELD;

	@api recordId; //get quote id for Apex
	@api objectApiName;
	productFamilies = []; //1st combobox values
	@track myProducts = [];
	error;
	families = new Set(); //cleans duplication of product families from SOQL output
	productData = []; // stores SOQL'd data
	// @track value = ''; //initialize combo box value.
	renderProductlist = false;
	renderNext1Btn = false;
	selectedFamily = '';
	selectedProduct = '';
	productQty = 0;
	productDescr = '';
	salePrice = 0;
	productDiscount = 0;
	totalPrice = 0;
	// PAGE SWITCHING
	showpage0 = true;
	showpage1 = false;
	showpage2 = false;
	showpage3 = false;
	editMode = false;
	last = 'none';
	spinner = false;

	//~~~~~~~ Here, for code longevity It's better to Import Field API Names: FIELDNAME_FIELD
	@wire(getRecord, {
		recordId: '$recordId',
		fields: [
			'Quote.Price_Book__c',
			'Quote.Opportunity.Default_Discount_for_Export__c',
			'Quote.OpportunityId',
			'Quote.Opportunity.Name'
		]
	})
	thisQuote;

	//~~~~~ Use the format above or below - decide if going to handle errors, or not
	// 	<template if:true={contact.error}>
	// 	<c-error-panel errors={contact.error}></c-error-panel>
	// </template>

	@wire(getProducts, { thisQuoteId: '$recordId' })
	products({ error, data }) {
		if (data) {
			this.productData = data;
		}
		if (error) {
			this.handleError(error);
		}
	}

	//~~~~~~~~ OPTIMISE RETREIVING FIELDS WITH getFieldValue(record, field)
	// instead of this.thisQuote.data.fields.Opportunity.value.fields.Default_Discount_for_Export__c.value,
	// https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_get_field_value
	// To get the value of a record’s field, you can use the getRecord wire adapter,
	// which returns the property record.data.fields.fieldName.value.
	// However, you can also call getFieldValue(record, field) to get the value directly.
	switchscreen(e) {
		this.last = e.target.dataset.name;
		this.showpage1 = this.last == 'gotopage1' ? true : false;
		this.showpage2 = this.last == 'gotopage2' ? true : false;
		this.showpage3 = this.last == 'gotopage3' ? true : false;
		if (this.last === 'gotopage3') {
			this.salePrice = this.calculatePrice(
				this.selectedProduct,
				this.thisQuote.data.fields.Price_Book__c.value,
				this.productQty,
				this.thisQuote.data.fields.Opportunity.value.fields.Default_Discount_for_Export__c.value,
				this.selectedFamily
			);
			//CONSECUTIVE?????????????
			console.log('Debug start');
			console.log(this.selectedProduct);
			console.log(this.thisQuote.data.fields.Price_Book__c.value);
			console.log(this.productQty);
			console.log(this.thisQuote.data.fields.Opportunity.value.fields.Default_Discount_for_Export__c.value);
			console.log(this.selectedFamily);
			console.log(this.salePrice);
			console.log('Debug end');

			this.productDiscount = this.calculateDiscount(this.salePrice);
			this.totalPrice = (this.salePrice * this.productQty).toFixed(2);
		}
	}
	restart() {
		this.showpage0 = true;
		this.showpage1 = false;
		this.showpage2 = false;
		this.showpage3 = false;
		this.last = 'none';
		this.spinner = false;
		this.renderProductlist = false;
		this.renderNext1Btn = false;
		this.productFamilies = [];
		this.myProducts = [];
		this.productList = [];
		this.selectedFamily = '';
		this.selectedProduct = '';
		this.productQty = '';
		this.productDescr = '';
		this.salePrice = '';
		this.productDiscount = 0;
		this.totalPrice = '';
		this.refreshTbl();
		this.editMode = false;
	}
	refreshTbl() {
		//makes sure that datatable gets refreshed after LineItem insert happens
		console.log('refreshing table');
		return refreshApex(this.provisionedValue);
	}
	// PAGE SWITCHING END
	// =========================================PAGE 1=======================================
	productList = [];
	startnewlineitem() {
		this.showpage1 = true;
		this.showpage0 = false;
		//add ERROR check current pricebook if PB not set,
		//add ERROR if a price book was changed?
		//TEMP
		console.log(this.productData);

		//~~INVESTIGATE USING getSObjectValue()

		let matchingFamily = 0;
		for (const soqlProduct of this.productData) {
			//if soqlProduct contains family
			if (soqlProduct.Product2.Family) {
				//does this soql product family already exist in productList ?
				matchingFamily = this.productList.filter((product) => product.family === soqlProduct.Product2.Family)
					.length;
				//https://stackoverflow.com/questions/8217419/how-to-determine-if-javascript-array-contains-an-object-with-an-attribute-that-e
				//if productList is empty, add 1st fam+prods OR if productList does not have this family yet, do the same
				if ((this.productList.length < 1 || matchingFamily < 1) && !soqlProduct.Product2.Name.includes('~')) {
					this.productList.push({
						family: soqlProduct.Product2.Family,
						products: [ { name: soqlProduct.Product2.Name } ]
					});
				} else if (matchingFamily > 0) {
					//if already has soql family - find index and push to products
					for (const prod of this.productList) {
						if (prod.family === soqlProduct.Product2.Family && !soqlProduct.Product2.Name.includes('~')) {
							prod.products.push({ name: soqlProduct.Product2.Name });
						}
					}
				}
			}
		}
		console.log('productList: ', this.productList);

		//populate a pre family Set - cleans duplicates
		for (const product of this.productData) {
			this.families.add(product.Product2.Family);
		}
		let orderedArray = Array.from(this.families).sort();

		// make values in combobox format
		for (const family of orderedArray) {
			if (family) {
				this.productFamilies.push({ label: family, value: family });
			}
		}
	}

	handleFamilyList(event) {
		this.renderProductlist = true;
		this.renderNext1Btn = false;
		this.myProducts = [];
		this.selectedFamily = event.detail.value;
		this.selectedProduct = '';
		for (const prod of this.productList) {
			if (prod.family === event.detail.value) {
				for (const product of prod.products) {
					this.myProducts.push({ label: product.name, value: product.name });
				}
			}
		}
	}
	handleProductList(event) {
		this.renderNext1Btn = true;
		this.selectedProduct = event.detail.value;
	}
	get familyOptions() {
		return this.productFamilies;
	}
	get productOptions() {
		return this.myProducts;
	}
	get formattedPrice() {
		return this.totalPrice.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
	}
	// =========================================PAGE 1 END=======================================
	// =========================================PAGE 2=======================================
	changeQty(event) {
		this.productQty = event.detail.value;
	}
	changeDescr(event) {
		this.productDescr = event.detail.value;
	}

	calculatePrice(selectedProduct, priceBook, quantity, exportDiscount, productFamily) {
		console.log('selectedProduct: ', selectedProduct);
		console.log('pricebooks: ', priceBook);
		console.log('quantity: ', quantity);
		console.log('exportDiscount: ', exportDiscount);
		console.log('productFamily: ', productFamily);
		console.log('productData: ', this.productData);

		if (priceBook.includes('Export') || priceBook.includes('USA Distributor')) {
			for (const soqlProduct of this.productData) {
				console.log('prod: ', soqlProduct);
				if (soqlProduct.Product2.Name === selectedProduct && soqlProduct.Pricebook2.Name === priceBook) {
					//options: cc, cchydro, rest
					if (productFamily == 'Concrete Canvas' || productFamily == 'Concrete Canvas USA') {
						if (selectedProduct.includes('Hydro')) {
							// apply 10% (CC Hydro)
							return (soqlProduct.UnitPrice * 0.9).toFixed(2);
						} else if (selectedProduct.substring(0, 3) === 'CCS') {
							//Shelters do not get price floor discount
							return soqlProduct.UnitPrice.toFixed(2);
						} else {
							// apply price floor (standard CC)
							return (soqlProduct.UnitPrice * (1 - exportDiscount / 100)).toFixed(2);
						}
					} else {
						// apply standard price (ancillaries)
						return soqlProduct.UnitPrice.toFixed(2);
					}
				}
			}
		} else if (priceBook.includes('Standard') || priceBook.includes('USA Customer')) {
			let newPrice = 0;
			for (const soqlProduct of this.productData) {
				console.log('IN Loop');
				if (soqlProduct.Product2.Name === selectedProduct && soqlProduct.Pricebook2.Name === priceBook) {
					console.log('cc no volume: ', soqlProduct);
					//  potential, but not if volume break price is found
					newPrice = soqlProduct.UnitPrice.toFixed(2);
				} else if (
					soqlProduct.Product2.Name.includes(selectedProduct) &&
					soqlProduct.Pricebook2.Name === priceBook &&
					Number(quantity) >= soqlProduct.Product2.ProductCode.split('~~')[1].split('~')[1] &&
					Number(quantity) <= soqlProduct.Product2.ProductCode.split('~~')[1].split('~')[2]
				) {
					//	found volume based product - return this
					console.log('cc volume: ', soqlProduct);
					return soqlProduct.UnitPrice.toFixed(2);
				}
			}
			return newPrice;
		} else {
			return 0;
		}
	}

	handlePriceOverride(e) {
		this.salePrice = e.detail.value;
		this.totalPrice = (this.productQty * e.detail.value).toFixed(2);
		this.productDiscount = this.calculateDiscount(this.salePrice);
	}
	calculateDiscount(salePrice) {
		for (const soqlProduct of this.productData) {
			if (
				soqlProduct.Product2.Name === this.selectedProduct &&
				soqlProduct.Pricebook2.Name === this.thisQuote.data.fields.Price_Book__c.value
			) {
				//(soqlProduct.Product2.UnitPrice / )
				if (soqlProduct.UnitPrice > 0 && salePrice && salePrice >= 0 && salePrice <= soqlProduct.UnitPrice) {
					return (100 - 100 * (salePrice / soqlProduct.UnitPrice)).toFixed(1);
				}
			}
		}
		return 0;
	}
	// =========================================PAGE 2 END=======================================

	insertLineItem() {
		this.spinner = true;
		const fields = {};
		fields[PRICEBOOKENTRYID_FIELD.fieldApiName] = this.findPriceBookEntryId(this.selectedProduct);
		fields[QUOTEID_FIELD.fieldApiName] = this.recordId;
		fields[QUANTITY_FIELD.fieldApiName] = this.productQty;
		fields[UNITPRICE_FIELD.fieldApiName] = this.salePrice;
		fields[DESCRIPTION_FIELD.fieldApiName] = this.productDescr;
		fields[DISCOUNT_FIELD.fieldApiName] = this.productDiscount;

		const recordInput = { apiName: QUOTE_LINE_ITEM_OBJECT.objectApiName, fields };
		createRecord(recordInput)
			.then((lineItem) => {
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Success',
						message: 'New line item inserted',
						variant: 'success'
					})
				);
				this.restart();
			})
			.catch((error) => {
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Close, but something went wrong',
						message: error.body.message,
						variant: 'error'
					})
				);
				this.restart();
			});
	}

	findPriceBookEntryId(productName) {
		for (const soqlProduct of this.productData) {
			if (soqlProduct.Product2.Name === productName) {
				console.log(soqlProduct.Id);
				return soqlProduct.Id;
			}
		}
	}

	openUKPriceList() {
		window.open(`https://${window.location.hostname}/resource/1576597923000/CC_Pricing_Image`, '_blank');
	}
	openExportPriceList() {
		window.open(`https://${window.location.hostname}/resource/1576598100000/CCPricingImageExport`, '_blank');
	}
	openHydroPriceList() {
		window.open(`https://${window.location.hostname}/resource/1576598372000/CCHPricing`, '_blank');
	}

	//===========DATATABLE WITH LINE ITEMS==========================
	@track columns = columns; //imported from dataTableColumns.js
	@track tableData;
	subtotalText;
	lineItemId;
	provisionedValue;

	@wire(getLineItems, { recordId: '$recordId' })
	lineItems(provisionedValue) {
		this.provisionedValue = provisionedValue; //for refreshApex()
		const { error, data } = provisionedValue;
		if (data) {
			this.tableData = data;
			let sum = 0;
			for (const item of data) {
				sum += item.TotalPrice;
			}
			this.subtotalText = `Subtotal: $${sum.toFixed(2)}`;
		}
		if (error) {
			this.handleError(error);
			this.tableData = undefined;
		}
	}

	// ======ENABLE SAVING INLINE TABLE EDITING OF LINE ITEM DESCRIPTION=====
	//https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.data_table_inline_edit
	handleSave(event) {
		// this.saveDraftValues = event.detail.draftValues;
		console.log('handleSave()', event);
	}
	// ======ENABLE SAVING INLINE TABLE EDITING OF LINE ITEM DESCRIPTION=====

	handleRowAction(event) {
		console.log('JSON:' + JSON.stringify(event.detail));
		const action = event.detail.action;
		const row = event.detail.row;
		switch (action.name) {
			case 'edit':
				this.editRowItem(
					event.detail.row.Id,
					event.detail.row.Opp_Prod_Name__c,
					event.detail.row.Description,
					event.detail.row.Quantity
				);
				// alert('Details: ' + JSON.stringify(row));
				break;
			case 'delete':
				this.spinner = true;
				const lineItemId = event.detail.row.Id;
				deleteRecord(lineItemId)
					.then(() => {
						//toast
						this.dispatchEvent(
							new ShowToastEvent({
								title: 'Success',
								message: 'Record deleted',
								variant: 'success'
							})
						);
						this.refreshTbl();
						this.spinner = false;
					})
					.catch((error) => {
						//toast
						this.dispatchEvent(
							new ShowToastEvent({
								title: 'Error deleting record',
								message: error.body.message,
								variant: 'error'
							})
						);
					});
				break;
		}
	}

	@wire(getProductFamily, { recordId: '$lineItemId' })
	family({ error, data }) {
		if (data) {
			console.log('setting Edit Item Family: ' + data.Product2.Family);
			this.selectedFamily = data.Product2.Family;
		}
		if (error) {
			this.handleError(error);
		}
	}

	editRowItem(productId, productName, productDescription, productQuantity) {
		console.log('edit name: ' + productName);
		console.log('edit desc: ' + productDescription);
		console.log('edit quantity: ' + productQuantity);
		//go to showpage2 screen,
		this.showpage0 = false;
		this.showpage2 = true;
		this.editMode = true;
		this.lineItemId = productId;
		this.selectedProduct = productName;
		this.productQty = productQuantity;
		this.productDescr = productDescription;
		console.log('editing name: ', this.selectedProduct);
	}
	updateLineItem() {
		this.spinner = true;
		const fields = {};
		fields[LINEITEMID_FIELD.fieldApiName] = this.lineItemId;
		fields[QUANTITY_FIELD.fieldApiName] = this.productQty;
		fields[UNITPRICE_FIELD.fieldApiName] = this.salePrice;
		fields[DESCRIPTION_FIELD.fieldApiName] = this.productDescr;
		fields[DISCOUNT_FIELD.fieldApiName] = this.productDiscount;
		const recordInput = { fields };
		updateRecord(recordInput)
			.then(() => {
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Success',
						message: 'Line Item updated',
						variant: 'success'
					})
				);
				// Display fresh data in the datatable
				this.restart();
			})
			.catch((error) => {
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Error creating record',
						message: error.body.message,
						variant: 'error'
					})
				);
			});
	}
	//===========NOTE: UPSERT WHEN EDITING==========================
	handleError(msg) {
		this.dispatchEvent(
			new ShowToastEvent({
				title: 'Error',
				message: 'Please try again or contact Salesforce administrator. Error: ' + msg,
				variant: 'error'
			})
		);
		this.restart();
	}
}
