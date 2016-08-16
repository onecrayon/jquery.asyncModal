/**
 * # jQuery(element).asyncModal(options)
 * 
 * Creates a modal popup whose contents are dynamically filled based on the URL
 * of the clicked link. This allows you to take advantage of an in-page modal
 * while still providing a no-Javascript fallback.
 *
 * Core logic inspired by [leanModal](https://github.com/FinelySliced/leanModal.js).
 *
 * ## Usage
 *
 * If the URL is an ID (e.g. `<a href="#existingElement">`) then the element
 * will be deep copied into the modal instead of triggering an AJAX call (this
 * allows you to do event setup and so forth at page load, rather than needing
 * to hook onto the `modal-opening` event).
 *
 * If the URL _ends_ with an ID (e.g. `<a href="http://test.com/#target">`) then
 * the contents of that element will be loaded (instead of the contents of the
 * body, which is the default).
 *
 * ### Events
 *
 * There are two custom events you can listen to with `jQuery(element).on()`:
 *
 * - `modal-opening`: called immediately prior to the modal opening; event
 *   object contains:
 *
 *     {
 *         'modal': modalWrapperDOMElement,
 *         'modalContents': modalContentWrapperDOMElement
 *         'closeModal': closeModalFunction,
 *     }
 *
 * - `modal-closed`: called immediately after the modal is closed
 *
 * ### Options
 *
 * The `options` parameter is an object with the following defaults:
 *
 *     {
 *         // Overlay display settings
 *         'overlay': {
 *             'color': '#000',
 *             'opacity': .4,
 *         },
 *         // Default position relative to the top of the screen; if `0` (the
 *         // default) the box will be centered
 *         'top': 0,
 *         // Duration in milliseconds for the fade animations (in and out)
 *         'fadeDuration': 200,
 *         // Accepts an HTML string, selector, or element. If a selector or
 *         // element, one child element must include a `data-modal-content`
 *         // attribute. Any "close button" elements must include a
 *         // `data-modal-close` attribute.
 *         'modal': '<div class="async-modal"><a class="async-modal__close-button" data-modal-close>&times;</a><div class="async-modal__content" data-modal-content></div></div>',
 *     }
 *
 * ### Appearance
 *
 * Modal is unstyled by default aside from the basics necessary for positioning
 * and animation. If you use the default modal, you can target the following
 * selectors:
 *
 * - `#async-modal-overlay`: overlay element
 * - `#async-modal`: outer wrapper element
 * - `#async-modal__content`: content wrapper element
 * - `.async-modal__close_button`: close button (contains the text "X")
 *
 * ## Example
 *
 * Assuming the link triggering your modal has the class `asyncModalTrigger`,
 * this Javascript fragment will enable modals, and ensure that any forms
 * within the resulting modal are submitted asynchronously, as well:
 *
 *     // Setup AJAX-populated modal boxes
 *     $('a.asyncModalTrigger').asyncModal().on('modal-opening', function(event) {
 *         // Setup AJAX submission for any forms within the modal
 *         $(event.modalContents).find('form').submit(function(formEvent) {
 *             formEvent.preventDefault();
 *             $.ajax({
 *                 url: $(this).attr('action'),
 *                 type: $(this).attr('method'),
 *                 dataType: 'json',
 *                 data: $(this).serialize(),
 *                 success: function(data) {
 *                     // Handle form submission success
 *                 },
 *                 error: function(xhr, statusText, errorThrown) {
 *                     // Handle form submission failure
 *                 },
 *                 complete: function() {
 *                     // Close the modal regardless of what happens
 *                     event.closeModal();
 *                 }
 *             });
 *         });
 *     });
 */
(function($){
	$.fn.extend({
		asyncModal: function(options) {
			// Merge our defaults and custom options
			var defaultOptions = {
				'overlay': {
					'color': '#000',
					'opacity': .4,
				},
				'top': 0,
				'fadeDuration': 200,
				'modal': '<div id="async-modal"><a class="async-modal__close-button" data-modal-close>&times;</a><div id="async-modal__content" data-modal-content></div></div>',
			};
			options = $.extend(true, defaultOptions, options);
			
			// Insert our overlay and set basic styles
			var overlay = $('<div id="async-modal-overlay"></div>');
			overlay.css({
				'display': 'none',
				'position': 'fixed',
				'top': 0,
				'left': 0,
				'width': '100%',
				'height': '100%',
				'z-index': 100,
				// Explicitly set background-color to allow stylesheets to add other logic (like gradients or whatever)
				'background-color': options.overlay.color,
				// Opacity is set when animating
			});
			$(document.body).append(overlay);
			// And do the same for our modal container
			var modal = $(options.modal);
			modal.css({
				'display': 'none',
				'position': 'fixed',
				'left': '50%',
				'top': (options.top === 0 ? 'auto' : options.top),
				'z-index': 11000,
				// Using fixed position means the height must be restricted to the body's height
				'box-sizing': 'border-box',
				'max-height': ($(document.body).height() - 20) + 'px',
				'max-width': ($(document.body).width() - 20) + 'px',
				'overflow': 'auto',
				// Opacity, top, and margin-left are set when animating (to ensure the sizing is correct based on the contents)
			});
			$(document.body).append(modal);
			
			// Parse our link elements
			return this.each(function() {
				// Setup click action
				$(this).click(function(event) {
					event.preventDefault();
					var targetURL = $(this).attr('href'),
						self = this;
					// Check if we are working with a local HTML fragment (triggered if the HREF is an ID)
					if (targetURL.substr(0, 1) === '#') {
						var copy = $(targetURL).clone(true);
						setModalContent(copy, self);
					} else {
						$.ajax(targetURL, {
							success: function(responseText) {
								var contents = $('<div>').append($.parseHTML(responseText)),
									target = targetURL.replace(/^.+?(#[\w-]+)$/i, '$1');
								// Grab contents of target ID or body tag (if either exists)
								if (target !== targetURL && contents.find(target).length > 0) {
									contents = contents.find(target);
								} else if (contents.find('body').length > 0) {
									contents = contents.find('body');
								}
								// Strip out wrapper element and reduce to HTML
								contents = contents.html();
								setModalContent(contents, self);
							},
							error: function(xhr, statusText, errorThrown) {
								setModalContents('<p class="async-modal__error">' + errorThrown + '</p>', self);
							},
						});
					}
				});
			});
			
			/**
			 * setModalContent(content, triggerElement)
			 * 
			 * Sets the modal content, configures close actions, and opens the modal.
			 */
			function setModalContent(content, triggerElement) {
				modal.find('[data-modal-content]:first').empty().append(content);
				modal.find('[data-modal-close]').off('click').click(function(event) {
					event.preventDefault();
					closeModal(triggerElement);
				});
				overlay.off('click').click(function(event) {
					event.preventDefault();
					closeModal(triggerElement);
				});
				openModal(triggerElement);
			}
			
			/**
			 * openModal(triggerElement)
			 * 
			 * Animates the modal open
			 */
			function openModal(triggerElement) {
				// Configure pre-animation styles
				overlay.css({
					'display': 'block',
					'opacity': 0,
				});
				// And for the modal box
				var modalHeight = modal.outerHeight(),
					modalWidth  = modal.outerWidth(),
					bodyHeight  = $(document.body).height(),
					modalCSS    = {
						'display': 'block',
						'opacity': 0,
						'margin-left': -(modalWidth / 2) + 'px',
					};
				if (options.top === 0) {
					modalCSS.top = '50%';
					modalCSS['margin-top'] = -(modalHeight / 2) + 'px';
				} else {
					modalCSS.top = (options.top + modalHeight >= $(document.body).height() ? 10 : options.top) + 'px';
				}
				modal.css(modalCSS);
				
				// Send our "modal-opening" event
				$(triggerElement).trigger({
					'type': 'modal-opening',
					'modal': modal[0],
					'modalContents': modal.find('[data-modal-content]:first')[0],
					'closeModal': function() {
						closeModal(triggerElement)
					}
				});
				
				// And now animate things in
				overlay.animate({ 'opacity': options.overlay.opacity }, options.fadeDuration);
				modal.animate({ 'opacity': 1 }, options.fadeDuration);
			}
			
			/**
			 * closeModal(triggerElement)
			 * 
			 * Animates the modal closed
			 */
			function closeModal(triggerElement) {
				// Animate out
				overlay.animate({ 'opacity': 0 }, options.fadeDuration);
				modal.animate({ 'opacity': 0 }, options.fadeDuration, function() {
					overlay.css('display', 'none');
					modal.css('display', 'none');
					// Send our "modal-closed" event
					$(triggerElement).trigger('modal-closed');
				});
			}
		}
	});
})(jQuery);
