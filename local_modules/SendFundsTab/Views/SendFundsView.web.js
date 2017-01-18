// Copyright (c) 2014-2017, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict"
//
const View = require('../../Views/View.web')
const commonComponents_tables = require('../../WalletAppCommonComponents/tables.web')
const commonComponents_forms = require('../../WalletAppCommonComponents/forms.web')
const commonComponents_navigationBarButtons = require('../../WalletAppCommonComponents/navigationBarButtons.web')
const commonComponents_walletSelect = require('../../WalletAppCommonComponents/walletSelect.web')
const commonComponents_contactOrAddressPicker = require('../../WalletAppCommonComponents/contactOrAddressPicker.web')
const commonComponents_activityIndicators = require('../../WalletAppCommonComponents/activityIndicators.web')
//
const StackAndModalNavigationView = require('../../StackNavigation/Views/StackAndModalNavigationView.web')
const AddContactFromOtherTabView = require('../../Contacts/Views/AddContactFromOtherTabView.web')
//
const monero_sendingFunds_utils = require('../../monero_utils/monero_sendingFunds_utils')
//
class SendFundsView extends View
{
	constructor(options, context)
	{
		super(options, context) // call super before `this`
		//
		const self = this 
		{
			self.fromContact = options.fromContact || null
		}
		self.setup()
	}
	setup()
	{
		const self = this
		{
			self.numberOfRequestsToLockToDisable_submitButton = 0
		}
		self.setup_views()
		
	}
	setup_views()
	{
		const self = this
		self._setup_self_layer()
		self._setup_validationMessageLayer()
		self._setup_form_containerLayer()
	}
	_setup_self_layer()
	{
		const self = this
		//
		self.layer.style.webkitUserSelect = "none" // disable selection here but enable selectively
		//
		self.layer.style.position = "relative"
		self.layer.style.width = "calc(100% - 20px)"
		self.layer.style.height = "100%" // we're also set height in viewWillAppear when in a nav controller
		self.layer.style.padding = "0 10px 40px 10px" // actually going to change paddingTop in self.viewWillAppear() if navigation controller
		self.layer.style.overflowY = "scroll"
		//
		self.layer.style.backgroundColor = "#282527" // so we don't get a strange effect when pushing self on a stack nav view
		//
		self.layer.style.color = "#c0c0c0" // temporary
		//
		self.layer.style.wordBreak = "break-all" // to get the text to wrap
	}
	_setup_validationMessageLayer()
	{ // validation message
		const self = this
		const layer = commonComponents_tables.New_inlineMessageDialogLayer("")
		layer.ClearAndHideMessage()
		self.validationMessageLayer = layer
		self.layer.appendChild(layer)				
	}
	_setup_form_containerLayer()
	{
		const self = this
		const containerLayer = document.createElement("div")
		self.form_containerLayer = containerLayer
		{
			self._setup_form_walletSelectLayer()
			self._setup_form_amountInputLayer()
			self._setup_form_mixinSelectLayer()
			self.form_containerLayer.appendChild(commonComponents_tables.New_clearingBreakLayer()) // as amt and mixin float
			self._setup_form_contactOrAddressPickerLayer()
			self._setup_form_resolving_activityIndicatorLayer()
			self._setup_form_resolvedPaymentID_containerLayer()
			self._setup_form_addPaymentIDButton_aLayer()
		}
		self.layer.appendChild(containerLayer)
	}
	_setup_form_walletSelectLayer()
	{
		const self = this
		const div = commonComponents_forms.New_fieldContainerLayer() // note use of _forms.
		{
			const labelLayer = commonComponents_forms.New_fieldTitle_labelLayer("FROM")
			div.appendChild(labelLayer)
			//
			const valueLayer = commonComponents_walletSelect.New_fieldValue_walletSelectLayer({
				walletsListController: self.context.walletsListController,
				didChangeWalletSelection_fn: function(selectedWallet) { /* nothing to do */ }
			})
			self.walletSelectLayer = valueLayer
			div.appendChild(valueLayer)
		}
		{ // to get the height
			div.appendChild(commonComponents_tables.New_clearingBreakLayer())
		}
		self.form_containerLayer.appendChild(div)
	}
	_setup_form_amountInputLayer()
	{ // Request funds from sender
		const self = this
		const div = commonComponents_forms.New_fieldContainerLayer() // note use of _forms.
		div.style.display = "inline-block"
		div.style.width = "210px"
		{
			const labelLayer = commonComponents_forms.New_fieldTitle_labelLayer("AMOUNT") // note use of _forms.
			div.appendChild(labelLayer)
			//
			const valueLayer = commonComponents_forms.New_fieldValue_textInputLayer({
				placeholderText: "XMR"
			})
			self.amountInputLayer = valueLayer
			{
				valueLayer.addEventListener(
					"keyup",
					function(event)
					{
						if (event.keyCode === 13) {
							self._tryToGenerateSend()
							return
						}
					}
				)
			}
			div.appendChild(valueLayer)
		}
		{ // to get the height
			div.appendChild(commonComponents_tables.New_clearingBreakLayer())
		}
		self.form_containerLayer.appendChild(div)
	}
	_setup_form_mixinSelectLayer()
	{ // Mixin
		const self = this
		const div = commonComponents_forms.New_fieldContainerLayer() // note use of _forms.
		div.style.display = "inline-block"
		div.style.width = "95px"
		{
			const labelLayer = commonComponents_forms.New_fieldTitle_labelLayer("MIXIN") // note use of _forms.
			div.appendChild(labelLayer)
			//
			const valueLayer = commonComponents_forms.New_fieldValue_selectLayer({
				values: [
					"3",
					"6",
					"9"
				]
			})
			valueLayer.style.width = "63px"
			self.mixinSelectLayer = valueLayer
			{
				valueLayer.addEventListener(
					"keyup",
					function(event)
					{
						if (event.keyCode === 13) { // return key
							self._tryToGenerateSend()
							return
						}
					}
				)
			}
			div.appendChild(valueLayer)
		}
		{ // to get the height
			div.appendChild(commonComponents_tables.New_clearingBreakLayer())
		}
		self.form_containerLayer.appendChild(div)
	}
	_setup_form_contactOrAddressPickerLayer()
	{ // Request funds from sender
		const self = this
		const div = commonComponents_forms.New_fieldContainerLayer() // note use of _forms.
		{
			const labelLayer = commonComponents_forms.New_fieldTitle_labelLayer("TO") // note use of _forms.
			div.appendChild(labelLayer)
			//
			const layer = commonComponents_contactOrAddressPicker.New_contactOrAddressPickerLayer(
				"Enter contact name, or OpenAlias or integrated address",
				self.context.contactsListController,
				function(contact)
				{ // did pick
					self.addPaymentIDButton_aLayer.style.display = "none"
					self._didPickContact(contact)
				},
				function(clearedContact)
				{
					self.cancelAny_requestHandle_for_oaResolution()
					//
				
					self._dismissValidationMessageLayer() // in case there was an OA addr resolve network err sitting on the screen
					self._hideResolvedPaymentID()
					self.addPaymentIDButton_aLayer.style.display = "block" // can re-show this
					//
					self.pickedContact = null
				}
			)
			self.contactOrAddressPickerLayer = layer
			div.appendChild(layer)
			{ // initial config
				if (self.fromContact !== null) {
					setTimeout( // must do this on the next tick so that we are already set on the navigation controller 
						function()
						{
							self.contactOrAddressPickerLayer.ContactPicker_pickContact(self.fromContact) // simulate user picking the contact
						},
						1
					)
				}
			}
		}
		self.form_containerLayer.appendChild(div)
	}	
	_setup_form_resolving_activityIndicatorLayer()
	{
		const self = this
		const layer = commonComponents_activityIndicators.New_Resolving_ActivityIndicator()
		layer.style.display = "none" // initial state
		self.resolving_activityIndicatorLayer = layer
		self.form_containerLayer.appendChild(layer)
	}
	_setup_form_resolvedPaymentID_containerLayer()
	{ // TODO: factor this into a commonComponent file
		const self = this
		const containerLayer = commonComponents_forms.New_fieldContainerLayer() // note use of _forms.
		containerLayer.style.display = "none" // initial state
		{
			const labelLayer = commonComponents_forms.New_fieldTitle_labelLayer("PAYMENT ID") // note use of _forms.
			labelLayer.style.display = "block" // temporary -- TODO: create a version of the labelLayer which stays on its own line (come up with concrete name for it obvs)
			labelLayer.style.float = "none" // temporary as well
			containerLayer.appendChild(labelLayer)
			//
			const valueLayer = document.createElement("div")
			valueLayer.style.borderRadius = "4px"
			valueLayer.style.backgroundColor = "#ccc"
			valueLayer.style.color = "#737073"
			self.resolvedPaymentID_valueLayer = valueLayer
			containerLayer.appendChild(valueLayer)
			//
			const detectedMessage = document.createElement("div")
			detectedMessage.innerHTML = '<img src="detectedCheckmark.png" />&nbsp;<span>Detected</span>'
			containerLayer.appendChild(detectedMessage)
		}
		{ // to get the height
			containerLayer.appendChild(commonComponents_tables.New_clearingBreakLayer())
		}
		self.resolvedPaymentID_containerLayer = containerLayer
		self.form_containerLayer.appendChild(containerLayer)
	}
	_setup_form_addPaymentIDButton_aLayer()
	{
		const self = this
		const layer = commonComponents_tables.New_createNewRecordNamedButton_aLayer("") 
		layer.innerHTML = "+ ADD PAYMENT ID"
		layer.addEventListener(
			"click",
			function(e)
			{
				e.preventDefault()
				{
					console.log("Add payment id…… ")
				}
				return false
			}
		)
		self.addPaymentIDButton_aLayer = layer
		self.form_containerLayer.appendChild(layer)
	}
	//
	//
	// Lifecycle - Teardown - Overrides
	//
	TearDown()
	{
		const self = this
		{ // cancel any requests
			self.cancelAny_requestHandle_for_oaResolution()
		}
		{ // Tear down components that require us to call their TearDown
			// // important! so they stop observing
			self.walletSelectLayer.Component_TearDown()
			self.contactOrAddressPickerLayer.Component_TearDown()
		}
		super.TearDown()
	}
	cancelAny_requestHandle_for_oaResolution()
	{
		const self = this
		//
		let req = self.requestHandle_for_oaResolution
		if (typeof req !== 'undefined' && req !== null) {
			console.log("💬  Aborting requestHandle_for_oaResolution")
			req.abort()
		}
		self.requestHandle_for_oaResolution = null
	}
	//
	//
	// Runtime - Accessors - Navigation
	//
	Navigation_Title()
	{
		return "Send Monero"
	}
	Navigation_New_RightBarButtonView()
	{ // TODO: factor/encapsulate in navigationBarButtons.web
		const self = this
		const view = new View({ tag: "a" }, self.context)
		self.rightBarButtonView = view
		const layer = view.layer
		{ // setup/style
			layer.href = "#" // to make it clickable
			layer.innerHTML = "Send"
			//
			layer.style.display = "block"
			layer.style.float = "right" // so it sticks to the right of the right btn holder view layer
			layer.style.marginTop = "10px"
			layer.style.width = "90px"
			layer.style.height = "24px"
			layer.style.borderRadius = "2px"
			layer.style.backgroundColor = "#18bbec"
			layer.style.textDecoration = "none"
			layer.style.fontSize = "22px"
			layer.style.lineHeight = "112%" // % extra to get + aligned properly
			layer.style.color = "#ffffff"
			layer.style.fontWeight = "bold"
			layer.style.textAlign = "center"
		}
		{ // observe
			layer.addEventListener(
				"click",
				function(e)
				{
					e.preventDefault()
					{
						if (self.numberOfRequestsToLockToDisable_submitButton == 0) { // button is enabled
							self._tryToGenerateSend()
						}
					}
					return false
				}
			)
		}
		return view
	}
	//
	//
	// Runtime - Imperatives - Submit button enabled state
	//
	disable_submitButton()
	{
		const self = this
		const wasEnabled = self.numberOfRequestsToLockToDisable_submitButton == 0
		self.numberOfRequestsToLockToDisable_submitButton += 1
		if (wasEnabled == true) {
			const buttonLayer = self.rightBarButtonView.layer
			buttonLayer.style.opacity = "0.5"
		}
	}
	enable_submitButton()
	{
		const self = this
		const wasEnabled = self.numberOfRequestsToLockToDisable_submitButton == 0
		if (self.numberOfRequestsToLockToDisable_submitButton > 0) { // if is currently disabled
			self.numberOfRequestsToLockToDisable_submitButton -= 1
			if (wasEnabled != true && self.numberOfRequestsToLockToDisable_submitButton == 0) { // if not currently enable and can be enabled (i.e. not locked)
				const buttonLayer = self.rightBarButtonView.layer
				buttonLayer.style.opacity = "1.0"
			}
		}
	}
	//
	//
	// Runtime - Imperatives - Element visibility
	//
	_displayResolvedPaymentID(payment_id)
	{
		const self = this
		if (!payment_id) {
			throw "nil payment_id passed to _displayResolvedPaymentID"
		}
		if (typeof self.resolvedPaymentID_containerLayer === 'undefined' || !self.resolvedPaymentID_containerLayer) {
			throw "_displayResolvedPaymentID expects a non-nil self.resolvedPaymentID_containerLayer"
		}
		self.resolvedPaymentID_valueLayer.innerHTML = payment_id
		self.resolvedPaymentID_containerLayer.style.display = "block"
	}
	_hideResolvedPaymentID()
	{
		const self = this
		if (typeof self.resolvedPaymentID_containerLayer !== 'undefined' && self.resolvedPaymentID_containerLayer) {
			self.resolvedPaymentID_containerLayer.style.display = "none"
		}
	}
	//
	_dismissValidationMessageLayer()
	{
		const self = this
		self.validationMessageLayer.SetValidationError("") 
		self.validationMessageLayer.style.display = "none"
	}	
	//
	//
	// Runtime - Imperatives - Request generation
	//
	_tryToGenerateSend()
	{
		const self = this
		//
		self._dismissValidationMessageLayer()
		//
		if (self.numberOfRequestsToLockToDisable_submitButton > 0) {
			console.warn("Submit button currently disabled.")
			return
		}
		const wallet = self.walletSelectLayer.CurrentlySelectedWallet
		{
			if (typeof wallet === 'undefined' || !wallet) {
				self.validationMessageLayer.SetValidationError("Please create a wallet to send Monero.")
				return
			}
		}
		const amount = self.amountInputLayer.value
		{
			if (typeof amount === 'undefined' || !amount) {
				self.validationMessageLayer.SetValidationError("Please enter a Monero amount to send.")
				return
			}
			// TODO: validate amount here
			const amount_isValid = true // TODO: just for now
			if (amount_isValid !== true) {
				self.validationMessageLayer.SetValidationError("Please enter a valid amount.")
				return
			}
		}
		const amount_float = parseFloat(amount)
		//
		const hasPickedAContact = typeof self.pickedContact !== 'undefined' && self.pickedContact ? true : false
		const enteredAddressValue = self.contactOrAddressPickerLayer.ContactPicker_inputLayer.value
		const notPickedContactBut_enteredAddressValue = !hasPickedAContact && enteredAddressValue ? true : false
		if (notPickedContactBut_enteredAddressValue) {
			self.validationMessageLayer.SetValidationError("Please specify the recipient of this transfer.")
			return
		}
		const mixin_int = parseInt(self.mixinSelectLayer.value)
		var target_address = null
		var payment_id = null
		if (hasPickedAContact === true) { // we have already re-resolved the payment_id
			if (self.pickedContact.HasOpenAliasAddress() === true) {
				payment_id = self.pickedContact.payment_id
				if (!payment_id || typeof payment_id === 'undefined') {
					// not throwing - it's ok if this payment has no payment id
				}
				console.log("self.pickedContact" , self.pickedContact)
				target_address = self.pickedContact.cached_OAResolved_XMR_address
			// } else if (self.pickedContact.HasIntegratedAddress() === true) {
			// // TODO: use fluffypony's compact payment id patch?
			} else {
				target_address = self.pickedContact.address // whatever it may be
			}
			if (!target_address || typeof target_address === 'undefined') {
				self.validationMessageLayer.SetValidationError("Contact unexpectedly lacked XMR address. This may be a bug.")
				return
			}
		} else {
			target_address = enteredAddressValue
		}
		{ // final validation
			if (!target_address) {
				self.validationMessageLayer.SetValidationError("Unable to derive a target address for this transfer. This may be a bug.")
				return
			}
		}
		self.__generateSendTransactionWith(
			wallet, // FROM wallet
			target_address, // TO address
			payment_id,
			amount_float,
			mixin_int
		)
	}
	__generateSendTransactionWith(
		sendFrom_wallet,
		target_address,
		payment_id,
		amount_float,
		mixin_int
	)
	{
		const self = this
		const sendFrom_address = sendFrom_wallet.public_address
		sendFrom_wallet.SendFunds(
			target_address,
			amount_float,
			mixin_int,
			payment_id,
			function(
				err,
				currencyReady_targetDescription_address,
				sentAmount,
				final__payment_id,
				tx_hash,
				tx_fee
			)
			{
				if (err) {
					self.validationMessageLayer.SetValidationError(typeof err === 'string' ? err : err.message)
					return
				}
				console.log(
					"SENT",
					currencyReady_targetDescription_address,
					sentAmount,
					final__payment_id,
					tx_hash,
					tx_fee
				)
			}
		)
		// self.context..WhenBooted_AddFundsRequest(
		// 	sendFrom_address,
		// 	payment_id,
		// 	amount,
		// 	mixin,
		// 	function(err, fundsRequest)
		// 	{
		// 		if (err) {
		// 			console.error("Error while creating funds request", err)
		// 			// TODO: show "validation" error here
		// 			return
		// 		}
		// 		{
		// 			self.validationMessageLayer.ClearAndHideMessage()
		// 		}
		// 		const GeneratedRequestView = require('./GeneratedRequestView.web')
		// 		const options =
		// 		{
		// 			fundsRequest: fundsRequest
		// 		}
		// 		const view = new GeneratedRequestView(options, self.context)
		// 		const modalParentView = self.navigationController.modalParentView
		// 		const underlying_navigationController = modalParentView
		// 		underlying_navigationController.PushView(view, false) // not animated
		// 		setTimeout(function()
		// 		{ // just to make sure the PushView finished
		// 			modalParentView.DismissTopModalView(true)
		// 		})
		// 	}
		// )
	}
	//
	//
	// Runtime - Imperatives - Public - Using a new fromContact when a self had already been presented
	//
	AtRuntime_reconfigureWith_fromContact(fromContact)
	{
		const self = this
		{ // figure that since this method is called when user is trying to initiate a new request we should clear the amount
			self.amountInputLayer.value = ""
		}
		{
			self.fromContact = fromContact
			self.contactOrAddressPickerLayer.ContactPicker_pickContact(fromContact) // simulate user picking the contact
		}
	}
	//
	//
	// Runtime - Delegation - Navigation/View lifecycle
	//
	viewWillAppear()
	{
		const self = this
		super.viewWillAppear()
		{
			if (typeof self.navigationController !== 'undefined' && self.navigationController !== null) {
				self.layer.style.paddingTop = `${self.navigationController.NavigationBarHeight()}px`
				self.layer.style.height = `calc(100% - ${self.navigationController.NavigationBarHeight()}px)`
			}
		}
	}
	viewDidAppear()
	{
		const self = this
		super.viewDidAppear()
		// teardown any child/referenced stack navigation views if necessary…
	}
	//
	//
	// Runtime/Setup - Delegation - Contact selection
	//
	_didPickContact(contact)
	{
		const self = this
		self.pickedContact = contact
		{ // payment id - if we already have one
			if (self.pickedContact.HasOpenAliasAddress() === false) {
				const payment_id = contact.payment_id
				if (payment_id && typeof payment_id !== 'undefined') {
					self._displayResolvedPaymentID(payment_id)
				} else {
					self._hideResolvedPaymentID() // in case it's visible… although it wouldn't be
				}
				// and exit early
				//
				return // no need to re-resolve what is not an OA addr
			} else { // they're using an OA addr, so we still need to check if they still have one
				self._hideResolvedPaymentID() // in case it's visible… although it wouldn't be
			}
		}
		// look up the payment ID again 
		{ // (and show the "resolving UI")
			self.resolving_activityIndicatorLayer.style.display = "block"
			self.disable_submitButton()
			//
			self._dismissValidationMessageLayer() // assuming it's okay to do this here - and need to since the coming callback can set the validation msg
		}
		{
			self.cancelAny_requestHandle_for_oaResolution()
		}
		self.requestHandle_for_oaResolution = self.context.openAliasResolver.ResolveOpenAliasAddress(
			contact.address,
			function(
				err,
				addressWhichWasPassedIn,
				moneroReady_address,
				payment_id, // may be undefined
				tx_description,
				openAlias_domain,
				oaRecords_0_name,
				oaRecords_0_description,
				dnssec_used_and_secured
			)
			{
				self.resolving_activityIndicatorLayer.style.display = "none"
				self.enable_submitButton()
				//
				if (typeof self.requestHandle_for_oaResolution === 'undefined' || !self.requestHandle_for_oaResolution) {
					console.warn("⚠️  Called back from ResolveOpenAliasAddress but no longer have a self.requestHandle_for_oaResolution. Canceled by someone else? Bailing after neutralizing UI.")
					return
				}
				self.requestHandle_for_oaResolution = null
				//
				if (typeof self.pickedContact === 'undefined' || !self.pickedContact) {
					console.warn("⚠️  Called back from ResolveOpenAliasAddress but no longer have a self.pickedContact. Bailing")
					return
				}
				if (self.pickedContact.address !== addressWhichWasPassedIn) {
					console.warn("⚠️  The addressWhichWasPassedIn to the ResolveOpenAliasAddress call of which this is a callback is different than the currently selected self.pickedContact.address. Bailing")
					return
				}
				if (err) {
					self.validationMessageLayer.SetValidationError(err.toString())
					return
				}
				{ // there is no need to tell the contact to update its address and payment ID here as it will be observing the emitted event from this very request to .Resolve
					if (typeof payment_id !== 'undefined' && payment_id) {
						self._displayResolvedPaymentID(payment_id)
					} else {
						// we already hid it above
					}
				}
			}
		)
	}
}
module.exports = SendFundsView