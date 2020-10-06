import $ from 'jquery'

import Base from 'ember-cli-analytics/integrations/base'
import canUseDOM from 'ember-cli-analytics/utils/can-use-dom'
import without from 'ember-cli-analytics/utils/without'

import { assert } from '@ember/debug'
import { get } from '@ember/object'
import { on } from '@ember/object/evented'
import { assign } from '@ember/polyfills'
import { capitalize } from '@ember/string'

export default Base.extend({

  /*
   * Send the current page URL to
   * the analytics engine.
   *
   * @method trackPage
   *
   * @param {Object} options
   *   Options to send the analytics engine.
   */
  trackPage (options = {}) {
    const sendEvent = { hitType: 'pageview' }
    const event = assign({}, sendEvent, options)

    if (canUseDOM) {
      console.log(options)
      window.gtag('config', 'GA_MEASUREMENT_ID', event)
    }
  },

  /*
   * Send an arbitrary event to the
   * analytics engine.
   *
   * @method trackEvent
   *
   * @param {Object} options
   *   Options to send the analytics engine.
   */
  trackEvent (options = {}) {
    const sendEvent = { hitType: 'event' }
    const gaEvent = {}

    if (options.nonInteraction) {
      gaEvent.nonInteraction = options.nonInteraction
      delete options.nonInteraction
    }

    for (let key in options) {
      const value = options[key]

      // If key is not a 'dimension' or 'metric', prepend with 'event'
      const shouldPrefix = !/^(dimension|metric)[0-9]{1,2}/.test(key)
      if (shouldPrefix) {
        key = `event${capitalize(key)}`
      }

      gaEvent[key] = value
    }

    const event = assign({}, sendEvent, gaEvent)

    if (canUseDOM) {
      window.gtag('event', event)
    }
  },

  /*
   * Identify an anonymous user with a
   * unique ID. This is useful when a
   * user returns to the application
   * an we wish to further track them.
   *
   * This should not be called in
   * conjunction with alias.
   *
   * @method identity
   *
   * @param {Object} options
   *   Options to send the analytics engine.
   */
  identify (options = {}) {
    const { id } = options

    assert('You must pass a distinct id', id)

    if (canUseDOM) {
      window.gtag('set', 'userId', id)
    }
  },

  /*
   * Insert the JavaScript tag into the
   * page, and perform any necessary
   * setup.
   *
   * @method insertTag
   * @on init
   */
  insertTag: on('init', function () {
    const config = get(this, 'config')
    const { id, remarketing, ecommerce, enhancedEcommerce, set } = assign({}, config)

    assert('You must pass a valid `id` to the GoogleAnaltics adapter', id)

    if (!canUseDOM) {
      return
    }

    if (!window.gtag) {
      (function () {
        const a = document.createElement('script')
        const m = document.querySelector('script')
        a.async = 1
        a.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
        m.parentNode.insertBefore(a, m)
        window.dataLayer = window.dataLayer || []
        window.gtag = function () { window.dataLayer.push(arguments) }
        window.gtag('js', new Date())
        window.gtag('config', id)
      })()
    }

    if (remarketing) {
      window.gtag('require', 'displayfeatures')
    }

    if (ecommerce) {
      window.gtag('require', 'ecommerce')
    }

    if (enhancedEcommerce) {
      window.gtag('require', 'ecommerce')
    }

    if (set) {
      for (const attr of Object.keys(set)) {
        window.gtag('set', attr, set[attr])
      }
    }
  }),

  /*
   * Remove the JavaScript tag from the
   * page, and perform any necessary
   * teardown.
   *
   * @method removeTag
   * @on willDestroy
   */
  removeTag: on('willDestroy', function () {
    if (canUseDOM) {
      $('script[src^="https://www.googletagmanager.com"]').remove()
      delete window.gtag
    }
  })
})
