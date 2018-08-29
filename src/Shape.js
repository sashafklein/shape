import _ from 'lodash';
import parseFunc from './support/parseFunction';

const type = comp => {
  if (comp instanceof Array) {
    return 'array';
  } else if (comp === null) {
    return 'null';
  }
  return typeof comp;
};

const functionName = (f) => parseFunc(f).name.replace('_', '').replace('Internal', '');

export const oneOf = array => function oneOfInternal(comp) { return array.includes(comp); };
export const format = regex => function formatInternal(comp) { return regex.test(comp); };
export const oneOfType = types => function oneOfTypeInternal(comp) { return types.filter(typeFunc => typeFunc(comp)).length !== 0; };

export const string = comp => type(comp) === 'string';
export const number = comp => type(comp) === 'number';
export const func = comp => type(comp) === 'function';
export const boolean = comp => type(comp) === 'boolean';
export const array = comp => type(comp) === 'array';
export const object = comp => type(comp) === 'object';
export const undef = comp => type(comp) === 'undefined';
export const nul = comp => type(comp) === 'null';
export const opt = matcher => oneOfType([matcher, undef]);

class Shape {
  constructor(shape) {
    this.shape = shape;
    this.printableShapeObject = type(shape) === 'array' ? [] : {};
    this.printableShape = this.calculatePrintableShape(shape);
    this.nonMatchingMessages = [];
    this.previousNonMatchingMessages = [];
  }

  lastNonMatches() {
    return this.previousNonMatchingMessages[this.previousNonMatchingMessages.length - 1];
  }

  matches(object) {
    this.recursivelyAccumulateNonMatches([], object, this.shape);
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

  recursivelyAccumulateNonMatches(pathArray, object, shape) {
    if (shape instanceof Array) {
      this.testArrayMatch(pathArray, shape, object);
    } else if (type(shape) === 'object') {
      this.testObjectMatch(pathArray, shape, object);
    } else if (type(shape) === 'function') {
      const funcName = functionName(shape);
      const logAndTestFunction = this[funcName](shape);
      logAndTestFunction(object, pathArray);
    }

    return true;
  }

  testObjectMatch(pathArray, shape, object) {
    if (typeof object === 'object') {
      _.keys(shape).forEach(k => this.recursivelyAccumulateNonMatches([...pathArray, k], object[k], shape[k]));
    } else {
      this.nonMatchingMessages.push(this.errorString(pathArray, object, 'object'));
    }
  }

  testArrayMatch(pathArray, shape, object) {
    if (object instanceof Array) {
      object.forEach((child, index) => this.recursivelyAccumulateNonMatches([...pathArray, index], child, shape[0]));
    } else {
      this.nonMatchingMessages.push(this.errorString(pathArray, object, 'array'));
    }
  }

  oneOf(testFunc) {
    return (comp, pathArray) => {
      this.logFailure(testFunc, comp, this.errorString(pathArray, comp, 'within the given array'));
    };
  }

  oneOfType(testFunc) {
    return (comp, pathArray) => {
      this.logFailure(testFunc, comp, this.errorString(pathArray, comp, 'one of the specified types'));
    };
  }

  format(testFunc) {
    return (comp, pathArray) => {
      this.logFailure(testFunc, comp, this.errorString(pathArray, comp, 'a string matching the given regex'));
    };
  }

  string() {
    return (comp, pathArray) => {
      this.logFailure(string, comp, this.errorString(pathArray, comp, 'string'));
    };
  }

  number() {
    return (comp, pathArray) => {
      this.logFailure(number, comp, this.errorString(pathArray, comp, 'number'));
    };
  }

  func() {
    return (comp, pathArray) => {
      this.logFailure(func, comp, this.errorString(pathArray, comp, 'function'));
    };
  }

  boolean() {
    return (comp, pathArray) => {
      this.logFailure(boolean, comp, this.errorString(pathArray, comp, 'boolean'));
    };
  }

  undef() {
    return (comp, pathArray) => {
      this.logFailure(undef, comp, this.errorString(pathArray, comp, 'undefined'));
    };
  }

  nul() {
    return (comp, pathArray) => {
      this.logFailure(nul, comp, this.errorString(pathArray, comp, 'null'));
    };
  }

  array() {
    return (comp, pathArray) => {
      this.logFailure(array, comp, this.errorString(pathArray, comp, 'array'));
    };
  }

  object() {
    return (comp, pathArray) => {
      this.logFailure(object, comp, this.errorString(pathArray, comp, 'object', type(comp)));
    };
  }

  logFailure(testFunc, comp, errorMsg) {
    if (!testFunc(comp)) {
      this.nonMatchingMessages.push(errorMsg);
    }
  }

  articulate(string) {
    const dont = ['undefined', 'null'];
    if ((dont.indexOf(string) === -1) && string.indexOf(' ') === -1) {
      const vowels = ['a', 'e', 'i', 'o', 'u'];
      return vowels.includes(string[0]) ? 'an' : 'a';
    } else {
      return '';
    }
  }

  errorString(pathArray, comp, expectation, givenType=null) {
    const isNum = val => val.toString().replace(/[0-9]/g, '').length === 0;
    const path = pathArray.length
      ? pathArray[0].toString().concat(
        pathArray.slice(1)
          .map(val => isNum(val) ? `[${val}]` : `['${val}']`)
          .join('')
      )
      : '';

    return `
      Expected value ${path.length ? `at ${path} ` : '' }to be
      ${this.articulate(expectation)} ${expectation},
      but found ${JSON.stringify(comp)}
      (${givenType || type(comp)}).
    `.replace(/\s+/g, ' ').trim();
  }

  calculatePrintableShape(shape, startingObject=null) {
    const replaceValues = (k, value) => (typeof value === 'function') ? functionName(value) : value;
    const objectString = JSON.stringify(shape, replaceValues)
      .replace(/"nul"/g, '"null"')
      .replace(/"undef"/g, '"undefined"')
      .replace(/"func"/g, '"function"');

    return JSON.parse(objectString);
  }
}

export const regexes = {
  iso8601: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[A-Z]{1}/,
  website: /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
  email: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  phone: /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/
};

export default Shape;
