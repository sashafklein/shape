# Shape

A tool, modeled after React PropTypes declarations, for asserting the shape of any type of data. Originally designed for testing API responses, Shape provides a simple API for testing if data looks right, and accessing any failures:

## Matches

Given a shape object (built using Shape's PropType like type functions), and some data, `shape.matches(data)` will return whether or not the two match:

```
 * import Shape, { string, number, format, oneOf, regexes } from 'Shape';
 * const shape = new Shape([{
 *   name: string,
 *   age: number,
 *   birthDate: format(regexes.iso8601)
 *   friends: [string],
 *   gender: oneOf(['female', 'male'])
 * }]);
 * shape.matches([{
 *   name: 'John',
 *   age: 4,
 *   birthDate: '2012-04-03T06:25:18.234Z'
 *   friends: ['Sally', 'Bob'],
 *   gender: 'male'
 * }])
 * // => true // It checks out!
 ```

```
 * import Shape, { string, number, format, oneOf, regexes } from 'Shape';
 * const shape = new Shape([{
 *   name: string,
 *   age: number,
 *   birthDate: format(regexes.iso8601)
 *   friends: [string],
 *   gender: oneOf(['female', 'male'])
 * }]);
 * shape.matches([{
 *   name: 'John',
 *   age: 4,
 *   birthDate: '2012-04-03T06:25:18.234Z'
 *   friends: ['Sally', 'Bob'],
 *   gender: 'not-a-gender'
 * }])
 * // => false // Gender is not among the acceptable options
 ```

## Last Non Matches

Shape also provides a simple API (to be improved) for seeing what failed in the match:

```
 * import Shape, { string, number, format, oneOf, regexes } from 'Shape';
 * const shape = new Shape([{
 *   name: string,
 *   age: number,
 *   birthDate: format(regexes.iso8601)
 *   friends: [string],
 *   gender: oneOf(['female', 'male'])
 * }]);
 * shape.matches([{
 *   name: 'John',
 *   age: 4,
 *   birthDate: '2012-04-03T06:25:18.234Z'
 *   friends: ['Sally', 'Bob'],
 *   gender: 'not-a-gender'
 * }])
 * // => false
 * shape.lastNonMatches();
 * // => ['"not-a-gender" is not within the specified array']
 ```
