import _ from 'lodash';
import parseFunc from './support/parseFunction';

export const oneOf = array => function oneOfInternal(comp) { return array.includes(comp); };
export const format = regex => function formatInternal(comp) { return regex.test(comp); };

export const string = comp => typeof comp === 'string';
export const number = comp => typeof comp === 'number';
export const func = comp => typeof comp === 'function';
export const boolean = comp => typeof comp === 'boolean';
export const array = comp => comp instanceof Array;
export const object = comp => !(comp instanceof Array) && typeof comp === 'object';

class Shape {
  constructor(shape) {
    this.shape = shape;
    this.nonMatchingMessages = [];
    this.previousNonMatchingMessages = [];
  }

  lastNonMatches() {
    return this.previousNonMatchingMessages[this.previousNonMatchingMessages.length - 1];
  }

  matches(object) {
    this.recursivelyAccumulateNonMatches(object, this.shape);
    if (this.nonMatchingMessages.length) {
      // Store and reset non-matching messages, for future assertions
      this.previousNonMatchingMessages.push(this.nonMatchingMessages);
      this.nonMatchingMessages = [];
      return false;
    }
    return true;
  }

  /////////////////
  //   PRIVATE   //
  /////////////////

  recursivelyAccumulateNonMatches(object, shape) {
    if (shape instanceof Array) {
      this.testArrayMatch(shape, object);
    } else if (typeof shape === 'object') {
      this.testObjectMatch(shape, object);
    } else if (typeof shape === 'function') {
      const funcName = parseFunc(shape).name.replace('_', '').replace('Internal', '');
      const logAndTestFunction = this[funcName](shape);
      logAndTestFunction(object);
    }

    return true;
  }

  testObjectMatch(shape, object) {
    if (typeof object === 'object') {
      _.keys(shape).forEach(k => this.recursivelyAccumulateNonMatches(object[k], shape[k]));
    } else {
      this.nonMatchingMessages.push(`${JSON.stringify(object)} is ${this.articulate(typeof object)} ${typeof object}, not an object`);
    }
  }

  testArrayMatch(shape, object) {
    if (object instanceof Array) {
      object.forEach(child => this.recursivelyAccumulateNonMatches(child, shape[0]));
    } else {
      this.nonMatchingMessages.push(`${JSON.stringify(object)} is ${this.articulate(typeof object)} ${typeof object}, not an array`);
    }
  }

  oneOf(testFunc) {
    return (comp) => {
      this.logFailure(testFunc, comp, `"${comp}" is not within the specified array`);
    };
  }

  format(testFunc) {
    return comp => {
      this.logFailure(testFunc, comp, `"${comp}" does not match given regex`);
    };
  }

  string() {
    return comp => {
      this.logFailure(string, comp, this.errorString(comp, 'string'));
    };
  }

  number() {
    return comp => {
      this.logFailure(number, comp, this.errorString(comp, 'number'));
    };
  }

  func() {
    return comp => {
      this.logFailure(func, comp, this.errorString(comp, 'function'));
    };
  }

  boolean() {
    return comp => {
      this.logFailure(boolean, comp, this.errorString(comp, 'boolean'));
    };
  }

  array() {
    return comp => {
      this.logFailure(array, comp, this.errorString(comp, 'array'));
    };
  }

  object() {
    return comp => {
      if (comp instanceof Array) {
        this.logFailure(object, comp, this.errorString(comp, 'object', 'array'));
      } else {
        this.logFailure(object, comp, this.errorString(comp, 'object'));
      }
    };
  }

  logFailure(testFunc, comp, errorMsg) {
    if (!testFunc(comp)) {
      this.nonMatchingMessages.push(errorMsg);
    }
  }

  articulate(string) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    return vowels.includes(string[0]) ? 'an' : 'a'
  }

  errorString(comp, target, givenType=null) {
    const type = givenType || typeof comp;

    return `${JSON.stringify(comp)} is ${this.articulate(type)} ${type}, not ${this.articulate(target)} ${target}`;
  }
}

export const regexes = {
  iso8601: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[A-Z]{1}/
};

export default Shape;
