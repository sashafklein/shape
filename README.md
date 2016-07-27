# Shape Matcher

A lightweight tool, modeled after React PropTypes declarations, for asserting the shape of any type of data. Originally designed for testing API responses, Shape provides a simple interface for testing if data looks right, and accessing any failures.

[![CircleCI](https://circleci.com/gh/sashafklein/shape.svg?style=svg&circle-token=cde994ece9d01489331c05301ebbff918bebcd7c)](https://circleci.com/gh/sashafklein/shape)

# Methods

## Matches

Given a shape object (built using Shape's PropType like type functions), and some data, `shape.matches(data)` will return whether or not the two match.

Passing case:

```
 * import Shape, { string, number, format, oneOf, regexes } from 'matches-shape';
 * const shape = new Shape([{
 *   name: string,
 *   age: number,
 *   birthDate: format(regexes.iso8601),
 *   friends: [string],
 *   gender: oneOf(['female', 'male'])
 * }]);
 * shape.matches([{
 *   name: 'John',
 *   age: 4,
 *   birthDate: '2012-04-03T06:25:18.234Z',
 *   friends: ['Sally', 'Bob'],
 *   gender: 'male'
 * }])
 * // => true // It checks out!
```

Failing case:

```
 * import Shape, { string, number, format, oneOf, regexes } from 'matches-shape';
 * const shape = new Shape([{
 *   name: string,
 *   age: number,
 *   birthDate: format(regexes.iso8601),
 *   friends: [string],
 *   gender: oneOf(['female', 'male'])
 * }]);
 * shape.matches([{
 *   name: 'John',
 *   age: 4,
 *   birthDate: '2012-04-03T06:25:18.234Z',
 *   friends: ['Sally', 'Bob'],
 *   gender: 'not-a-gender'
 * }])
 * // => false // 'not-a-gender' is not among the acceptable gender options
```

## Last Non Matches

Shape also provides a simple API (to be improved) for seeing what failed in the match:

```
 * import Shape, { string, number, format, oneOf, oneOfType, regexes } from 'matches-shape';
 * const shape = new Shape([{
 *   name: string,
 *   age: number,
 *   birthDate: format(regexes.iso8601)
 *   friends: [string],
 *   gender: oneOf(['female', 'male']),
 *   random: oneOfType([number, string])
 * }]);
 * shape.matches([{
 *   name: 'John',
 *   age: 4,
 *   birthDate: '2012-04-03'
 *   friends: ['Sally', 5],
 *   gender: 'not-a-gender',
 *   random: {}
 * }])
 * // => false
 * shape.lastNonMatches();
 * // => ['"5" is a number, not a string', '"2012-04-03" does not match given regex', '"not-a-gender" is not within the specified array', '{} is an object, which is not among the specified types']
```

## Matching options

The following matchers can be imported destructured from `matches-shape`.

- `string` - Asserts that the value is of type string.
- `number` - Asserts that the value is of type number.
- `function` - Asserts that the value is of type function.
- `boolean` - Asserts that the value is of type boolean.
- `object` - Asserts that the value is of type object (and NOT an array). Only to be used if you are ambivalent about the values within the object.
- `array` - Asserts that the value is an array. Only to be used if you are ambivalent about the values within the array.
- `format(regex)` - Asserts that the value matches the given regex.
- `oneOf([])` - Asserts that the value is within the specified options.
- `oneOfType([])` - Asserts that the value is one of the specified types.

Apart from these matchers, object shape is indicated by the shape object itself. In other words, the following shape object will assert that the object tested contains, under a "values" key, an array of objects with string values for their "type" key:

```
import Shape, { string } from 'matches-shape';

const shape = Shape.new({
    values: [{ type: string }]
});
```

One additional import is provided - `regexes` - which defines a handful of useful regex patterns for testing strings.

```
new Shape(format(regexes.iso8601)).matches('Some string')
# => false
```

### TODO

- Improve error logging, so that errors point to particular nodes
- Add a handful of basic regexes