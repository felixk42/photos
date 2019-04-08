import {isUndefined, isEmpty, isFunction, isNull} from 'lodash'
import update from 'immutability-helper';
import _ from 'lodash'
import React from 'react'
import titleCase from 'title-case'

export const orNone = (x) => (_.isNull(x)? <i>(none)</i> : x)

export const toTitleCase = titleCase
  // str =>
  // str.replace(
    // /\w\S*/g,
    // txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  // )

// pad placeholders and populate errorMsgs
/**
 * @arg {Object} form - an object of name -> values
 * i.e. {name: 'Jane Doe', amount: 5}
 *
 * @returns {undefined}
 */
export const validateForm = (form, fields) => {
  let errorMsgs = []
  let validatedForm = form
  // console.log("what is the validated form looking like?")
  // console.dir(validatedForm)
  fields.forEach(field => {
    if (isUndefined(form[field.name])) {
      const required = isFunction(field.required) ? field.required(form) : field.required
      if (required) {
        errorMsgs.push(`${field.label} is required`)
      } else {
        if (!isUndefined(field.placeholder)) {
          validatedForm = update(validatedForm, {[field.name]: { $set: field.placeholder}})
          // form[field.name] = field.placeholder
        }
      }
    } else if (field.check && !field.check(form[field.name])) {
      errorMsgs.push(field.checkFailedMsg)
    } else if (isEmpty(form[field.name]) && field.required) {
      errorMsgs.push(`${field.label} is empty`)
    }
    // console.log("what is the validated form looking like?")
    // console.dir(validatedForm)
  })
  return {errorMsgs, validatedForm}
}



// Closure
(function() {
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // If the value is negative...
    if (value < 0) {
      return -decimalAdjust(type, -value, exp);
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();


export const scaleDollarAmountRaw = val => {
  // console.log('scaleDollarAmountRaw, val: ')
  // console.dir(val)
  if (val < 1000){
    return {number: val, unit: ''}
  }
  else if ( val < 1000*1000){
    return { number: Math.round10(val/1000, -2), unit: 'k'}
  }
  else{
    // console.log('3rd clause')
    // const divided = val / (1000*1000)
    // console.dir(divided)
    return { number: Math.round10(val / (1000*1000), -2), unit: 'M'}
  }
}

/**
 *
 *
  @returns {Object} - {valid: Boolean, validationMessage}
 *
 */
export const getValidAndMessage = e => {
  const {target} = e
  const {validity, validationMessage} = target
  const {valid} = validity
  return {valid, validationMessage}
}

export const ifUndefined = (val, defaultVal) => isUndefined(val) ? defaultVal : val

export const ifNull = (val, defaultVal) => isNull ? defaultVal : val

export const truncateString = (text, firstNWords=20, charLimit=300) => {
  if (text.length > charLimit){
    return text.slice().split(' ').slice(0, firstNWords).join(' ') + '...'
  }
  return text
}

export const parseBool = val => String(val) === 'true'
