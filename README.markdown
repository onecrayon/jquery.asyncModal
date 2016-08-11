# jQuery(element).asyncModal(options)

Creates a modal popup whose contents are dynamically filled based on the URL
of the clicked link. This allows you to take advantage of an in-page modal
while still providing a no-Javascript fallback.

Core logic inspired by [leanModal](https://github.com/FinelySliced/leanModal.js).

## Usage

If the URL is an ID (e.g. `<a href="#existingElement">`) then the element
will be deep copied into the modal instead of triggering an AJAX call (this
allows you to do event setup and so forth at page load, rather than needing
to hook onto the `modal-opening` event).

If the URL _ends_ with an ID (e.g. `<a href="http://test.com/#target">`) then
the contents of that element will be loaded (instead of the contents of the
body, which is the default).

### Events

There are two custom events you can listen to with `jQuery(element).on()`:

- `modal-opening`: called immediately prior to the modal opening; event
   object contains:

    {
        'modal': modalWrapperDOMElement,
        'modalContents': modalContentWrapperDOMElement
        'closeModal': closeModalFunction,
    }

- `modal-closed`: called immediately after the modal is closed

### Options

The `options` parameter is an object with the following defaults:

    {
        // Overlay display settings
        'overlay': {
            'color': '#000',
            'opacity': .4,
        },
        // Default position relative to the top of the screen; if `0` (the
        // default) the box will be centered
        'top': 0,
        // Duration in milliseconds for the fade animations (in and out)
        'fadeDuration': 200,
        // Accepts an HTML string, selector, or element. If a selector or
        // element, one child element must include a `data-modal-content`
        // attribute. Any "close button" elements must include a
        // `data-modal-close` attribute.
        'modal': '<div class="async-modal"><a class="async-modal__close-button" data-modal-close>X</a><div class="async-modal__content" data-modal-content></div></div>',
    }

### Appearance

Modal is unstyled by default aside from the basics necessary for positioning
and animation. If you use the default modal, you can target the following
selectors:

- `#async-modal-overlay`: overlay element
- `#async-modal`: outer wrapper element
- `#async-modal__content`: content wrapper element
- `.async-modal__close_button`: close button (contains the text "X")

## Example

Assuming the link triggering your modal has the class `asyncModalTrigger`,
this Javascript fragment will enable modals, and ensure that any forms
within the resulting modal are submitted asynchronously, as well:

    // Setup AJAX-populated modal boxes
    $('a.asyncModalTrigger').asyncModal().on('modal-opening', function(event) {
        // Setup AJAX submission for any forms within the modal
        $(event.modalContents).find('form').submit(function(formEvent) {
            formEvent.preventDefault();
            $.ajax({
                url: $(this).attr('action'),
                type: $(this).attr('method'),
                dataType: 'json',
                data: $(this).serialize(),
                success: function(data) {
                    // Handle form submission success
                },
                error: function(xhr, statusText, errorThrown) {
                    // Handle form submission failure
                },
                complete: function() {
                    // Close the modal regardless of what happens
                    event.closeModal();
                }
            });
        });
    });

## Changelog

**1.0:**

* Initial release

## MIT License

Copyright (c) 2016 Ian Beck

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
