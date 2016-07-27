import { describe, context } from '../src/support/describe';

import Shape, { oneOf, format, string, number, func, regexes, object, array, oneOfType, undef, nul } from '../src/Shape';

const flatAsserter = new Shape({
  name: string,
  age: number,
  incrementAge: func
});

const flatObj = (overwrites = {}) => Object.assign({}, {
  name: 'Josh',
  age: 5,
  incrementAge: () => null
}, overwrites);

const deepObjectAsserter = new Shape({
  name: string,
  age: number,
  friends: [
    string
  ],
  details: {
    height: string,
    eyeColor: string
  }
});

const deepObj = (overwrites = {}) => Object.assign({}, {
  name: 'Josh',
  age: 5,
  friends: ['John', 'Sally'],
  details: {
    height: '5\'8"',
    eyeColor: 'brown'
  }
}, overwrites);

const arrayAsserter = new Shape([
  {
    name: string,
    age: number
  }
]);

const arrayObj = [{
  name: 'John',
  age: 5
}, {
  name: 'Sally',
  age: 10
}];

const assertFailures = (t, asserter, failures) => {
  t.deepEqual(asserter.lastNonMatches(), failures);
};

describe('non-object shape', [
  ['simple strings', t => {
    t.true(new Shape(string).matches('I am a string'));
    t.false(new Shape(string).matches(4));
  }],

  ['formatted strings', t => {
    t.true(new Shape(format(/.+@.+.com/)).matches('whatever@whatever.com'));
    t.false(new Shape(format(/.+@.+.com/)).matches('whatever@whatever.org'));
  }],

  ['iso strings', t => {
    t.true(new Shape(format(regexes.iso8601)).matches('2016-07-08T17:51:44.261Z'));
    t.false(new Shape(format(regexes.iso8601)).matches('2016-07-08'));
  }],

  ['specified strings', t => {
    t.true(new Shape(oneOf(['first', 'second', 'third'])).matches('second'));
    t.false(new Shape(oneOf(['first', 'second', 'third'])).matches('fourth'));
  }],

  ['numbers', t => {
    t.true(new Shape(number).matches(4));
    t.false(new Shape(number).matches('4'));
  }],

  ['functions', t => {
    t.true(new Shape(func).matches(() => null));
    t.false(new Shape(func).matches('function'));
  }]
]);

describe('object shape', [
  context('flat children', [
    ['accurate positives', t => {
      t.true(flatAsserter.matches(flatObj()));
    }],

    ['accurate negatives', t => {
      t.false(flatAsserter.matches(flatObj({ name: 5 })));
      assertFailures(t, flatAsserter, ['5 is a number, not a string']);
      t.false(flatAsserter.matches(flatObj({ age: 'Five' })));
      assertFailures(t, flatAsserter, ['"Five" is a string, not a number']);
      t.false(flatAsserter.matches(flatObj({ incrementAge: 'Another string' })));
      assertFailures(t, flatAsserter, ['"Another string" is a string, not a function']);
    }],

    ['with oneOf specified', t => {
      const asserter = new Shape({
        eyeColor: oneOf(['blue', 'green'])
      });

      t.true(asserter.matches({ eyeColor: 'blue' }));
      t.true(asserter.matches({ eyeColor: 'green' }));
      t.false(asserter.matches({ eyeColor: 'purple' }));
      assertFailures(t, asserter, ['"purple" is not within the specified array']);
    }],

    ['with format specified', t => {
      const asserter = new Shape({
        email: format(/(.+)@(.+){2,}.(.+){2,}/g)
      });

      t.true(asserter.matches({ email: 'fake@email.com' }));
      t.false(asserter.matches({ email: 'fakeemail.com' }));
      assertFailures(t, asserter, ['"fakeemail.com" does not match given regex']);
    }],

    ['with oneOfType specified', t => {
      const asserter = new Shape({
        random: oneOfType([string, number])
      });

      t.true(asserter.matches({ random: 'I am a string' }));
      t.true(asserter.matches({ random: 1234.1234 }));
      t.false(asserter.matches({ random: [] }));
      assertFailures(t, asserter, ['[] is an array, which is not among the specified types']);
      t.false(asserter.matches({ random: {} }));
      assertFailures(t, asserter, ['{} is an object, which is not among the specified types']);
    }],
  ]),

  context('deep children', [
    ['accurate positives', t => {
      t.true(deepObjectAsserter.matches(deepObj()));
      t.true(deepObjectAsserter.matches(deepObj({ friends: [] })));
      t.true(deepObjectAsserter.matches(deepObj({ details: { eyeColor: 'blue', height: 'not relevant' } })));
    }],

    ['accurate negatives', t => {
      t.false(deepObjectAsserter.matches(deepObj({ name: 5 })));
      assertFailures(t, deepObjectAsserter, ['5 is a number, not a string']);
      t.false(deepObjectAsserter.matches(deepObj({ friends: 'Sally' })));
      assertFailures(t, deepObjectAsserter, ['"Sally" is a string, not an array']);
      t.false(deepObjectAsserter.matches(deepObj({ details: { eyeColor: 'brown' } }))); // Missing height
      assertFailures(t, deepObjectAsserter, ['undefined is an undefined, not a string']);
    }],

    ['with oneOf specified', t => {
      const asserter = new Shape({
        details: { eyeColor: oneOf(['blue', 'green']) }
      });
      t.true(asserter.matches({ details: { eyeColor: 'blue' } }));
      t.false(asserter.matches({ details: { eyeColor: 'purple' } }));
      assertFailures(t, asserter, ['"purple" is not within the specified array']);
    }]
  ])
]);

describe('array', [
  context('object children', [
    ['with children', t => {
      t.true(arrayAsserter.matches(arrayObj));
      t.false(arrayAsserter.matches([{ other: 'stuff' }]));
    }],

    ['with children one of which doesn\'t match', t => {
      t.false(arrayAsserter.matches(arrayObj.concat({ other: 'stuff' })));
    }],

    ['without children', t => {
      t.true(arrayAsserter.matches([]));
      t.false(arrayAsserter.matches({}));
      assertFailures(t, arrayAsserter, ['{} is an object, not an array']);
    }],

    ['with iso format event data', t => {
      const data = [{
        type: 'Some Type',
        startTime: '2016-07-08T17:51:44.261Z',
        endTime: '2016-07-09T17:51:46.553Z'
      }];

      const asserter = new Shape([{
        type: string,
        startTime: format(regexes.iso8601),
        endTime: format(regexes.iso8601)
      }]);

      t.true(asserter.matches(data));
      data[0] = Object.assign({}, data[0], { endTime: '2016-07-09' });
      t.false(asserter.matches(data));
      assertFailures(t, asserter, ['"2016-07-09" does not match given regex']);
    }]
  ])
]);

describe('readme example', [
  ['spits out useful errors', t => {
    const shape = new Shape([{
      name: string,
      age: number,
      birthDate: format(regexes.iso8601),
      friends: [string],
      gender: oneOf(['female', 'male'])
    }]);
    t.false(shape.matches([{
      name: 'John',
      age: 4,
      birthDate: '2012-04-03T06:25:18.234Z',
      friends: ['Sally', 4],
      gender: 'not-a-gender'
    }]));
    t.deepEqual(
      shape.lastNonMatches(),
      ['4 is a number, not a string', '"not-a-gender" is not within the specified array']
    );
  }]
]);

describe('array and object matchers', [
  ['work and are ambivalent to object contents', t => {
    const shape = new Shape({
      arrayVal: array,
      objectVal: object
    });

    t.true(shape.matches({ arrayVal: [1, 2, 3], objectVal: { one: 'two' } }));
    t.true(shape.matches({ arrayVal: [1, 'two', 3], objectVal: {  } }));
    t.false(shape.matches({ arrayVal: {}, objectVal: [] }));
    t.deepEqual(
      shape.lastNonMatches(),
      ["{} is an object, not an array","[] is an array, not an object"]
    );
  }]
]);

describe('handling optional attributes', [
  ['oneOfType and undefined work together', t => {
    const shape = new Shape({
      optionalNumber: oneOfType([number, undef]),
      mandatoryNumber: number,
      nullButNotUndefinedField: nul
    });

    t.true(shape.matches({ optionalNumber: 1, mandatoryNumber: 1, nullButNotUndefinedField: null }));
    t.true(shape.matches({ mandatoryNumber: 1, nullButNotUndefinedField: null }));

    t.false(shape.matches({ nullButNotUndefinedField: null }));
    t.deepEqual(
      shape.lastNonMatches(),
      ['undefined is an undefined, not a number']
    );

    t.false(shape.matches({ mandatoryNumber: 1 }));
    t.deepEqual(
      shape.lastNonMatches(),
      ['undefined is an undefined, not a null']
    );

    t.false(shape.matches({ optionalNumber: null, mandatoryNumber: 1, nullButNotUndefinedField: null }));
    t.deepEqual(
      shape.lastNonMatches(),
      ['null is a null, which is not among the specified types']
    );
  }]
]);

describe('printableShape', [
  ['with object', t => {
    const shape = new Shape({
      value: {
        anotherObject: {
          numberArray: [number],
          someValue: string,
          thisOneIsNull: nul,
          thisOneIsUndefined: undef,
          thisIsAFunction: func,
          thisIsFormatted: format(regexes.iso8601)
        }
      }
    });

    t.deepEqual(
      shape.printableShape,
      {
        "value": {
          "anotherObject": {
            "numberArray": [
              "number"
            ],
            "someValue": "string",
            "thisOneIsNull": "null",
            "thisOneIsUndefined": "undefined",
            "thisIsAFunction": "function",
            "thisIsFormatted": "format"
          }
        }
      }
    );
  }],

  ['with array', t => {
    const shape = new Shape([{
      value: {
        anotherObject: {
          numberArray: [number],
          someValue: string,
          thisOneIsNull: nul,
          thisOneIsUndefined: undef,
          thisIsAFunction: func,
          thisIsFormatted: format(regexes.iso8601)
        }
      }
    }]);

    t.deepEqual(
      shape.printableShape,
      [{
        "value": {
          "anotherObject": {
            "numberArray": [
              "number"
            ],
            "someValue": "string",
            "thisOneIsNull": "null",
            "thisOneIsUndefined": "undefined",
            "thisIsAFunction": "function",
            "thisIsFormatted": "format"
          }
        }
      }]
    );
  }],
]);
