import { describe } from 'ava-describe';

import Shape, { oneOf, format, string, number, func, regexes, object, array, oneOfType, undef, nul, opt } from '../src/Shape';

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

const testFlat = (matcher, good, bad) => t => {
  const shape = new Shape(matcher);
  t.true(shape.matches(good));
  t.false(shape.matches(bad));
}

describe('non-object shape', {
  simpleStrings: testFlat(string, 'I am a string', 4),
  formattedStrings: testFlat(format(/.+@.+.com/), 'whatever@whatever.com', 'whatever@whatever.org'),
  isoStrings: testFlat(format(regexes.iso8601), '2016-07-08T17:51:44.261Z', '2016-07-08'),
  specifiedStrings: testFlat(oneOf(['first', 'second', 'third']), 'second', 'fourth'),
  numbers: testFlat(number, 4, '4'),
  functions: testFlat(func, () => null, 'function')
});

describe('object shape', {
  flatChildren: {
    accuratePositives: t => {
      t.true(flatAsserter.matches(flatObj()));
    },

    accurateNegatives: t => {
      t.false(flatAsserter.matches(flatObj({ name: 5 })));
      assertFailures(t, flatAsserter, ['5 is a number, not a string']);
      t.false(flatAsserter.matches(flatObj({ age: 'Five' })));
      assertFailures(t, flatAsserter, ['"Five" is a string, not a number']);
      t.false(flatAsserter.matches(flatObj({ incrementAge: 'Another string' })));
      assertFailures(t, flatAsserter, ['"Another string" is a string, not a function']);
    },

    withOneOfSpecified: t => {
      const asserter = new Shape({
        eyeColor: oneOf(['blue', 'green'])
      });

      t.true(asserter.matches({ eyeColor: 'blue' }));
      t.true(asserter.matches({ eyeColor: 'green' }));
      t.false(asserter.matches({ eyeColor: 'purple' }));
      assertFailures(t, asserter, ['"purple" is not within the specified array']);
    },

    withFormatSpecified: t => {
      const asserter = new Shape({
        email: format(/(.+)@(.+){2,}.(.+){2,}/g)
      });

      t.true(asserter.matches({ email: 'fake@email.com' }));
      t.false(asserter.matches({ email: 'fakeemail.com' }));
      assertFailures(t, asserter, ['"fakeemail.com" does not match given regex']);
    },

    withOneOfTypeSpecified: t => {
      const asserter = new Shape({
        random: oneOfType([string, number])
      });

      t.true(asserter.matches({ random: 'I am a string' }));
      t.true(asserter.matches({ random: 1234.1234 }));
      t.false(asserter.matches({ random: [] }));
      assertFailures(t, asserter, ['[] is an array, which is not among the specified types']);
      t.false(asserter.matches({ random: {} }));
      assertFailures(t, asserter, ['{} is an object, which is not among the specified types']);
    },
  },

  deepChildren: {
    accuratePositives: t => {
      t.true(deepObjectAsserter.matches(deepObj()));
      t.true(deepObjectAsserter.matches(deepObj({ friends: [] })));
      t.true(deepObjectAsserter.matches(deepObj({ details: { eyeColor: 'blue', height: 'not relevant' } })));
    },

    accurateNegatives: t => {
      t.false(deepObjectAsserter.matches(deepObj({ name: 5 })));
      assertFailures(t, deepObjectAsserter, ['5 is a number, not a string']);
      t.false(deepObjectAsserter.matches(deepObj({ friends: 'Sally' })));
      assertFailures(t, deepObjectAsserter, ['"Sally" is a string, not an array']);
      t.false(deepObjectAsserter.matches(deepObj({ details: { eyeColor: 'brown' } }))); // Missing height
      assertFailures(t, deepObjectAsserter, ['undefined is an undefined, not a string']);
    },

    withOneOfSpecified: t => {
      const asserter = new Shape({
        details: { eyeColor: oneOf(['blue', 'green']) }
      });
      t.true(asserter.matches({ details: { eyeColor: 'blue' } }));
      t.false(asserter.matches({ details: { eyeColor: 'purple' } }));
      assertFailures(t, asserter, ['"purple" is not within the specified array']);
    }
  }
});

describe('array', {
  objectChildren: {
    withChildren: t => {
      t.true(arrayAsserter.matches(arrayObj));
      t.false(arrayAsserter.matches([{ other: 'stuff' }]));
    },

    withChildrenOneOfWhichDoesNotMatch: t => {
      t.false(arrayAsserter.matches(arrayObj.concat({ other: 'stuff' })));
    },

    withoutChildren: t => {
      t.true(arrayAsserter.matches([]));
      t.false(arrayAsserter.matches({}));
      assertFailures(t, arrayAsserter, ['{} is an object, not an array']);
    },

    withIsoFormatData: t => {
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
    }
  }
});

describe('readme example', {
  spitsOutUsefulErrors: t => {
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
  }
});

describe('array and object matchers', {
  areAmbivalentToObjectContents: t => {
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
  }
});

describe('handling optional attributes', {
  oneOfTypeAndUndefinedWorkTogether: t => {
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
  }
});

describe('printableShape', {
  withObject: t => {
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
  },

  withArray: t => {
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
  },
});

describe('opt', {
  declaresAValueToMatchAConditionOptionally: t => {
    const shape = new Shape({ someKey: opt(string) });
    t.true(
      shape.matches({ someKey: 'ImAString' })
    );
    t.true(
      shape.matches({ })
    );
    t.false(
      shape.matches({ someKey: null })
    );
    t.false(
      shape.matches({ someKey: number })
    );
  }
});
