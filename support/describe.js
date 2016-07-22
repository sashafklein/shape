/* eslint ava/test-ended:0 */

import test from 'ava';
import _ from 'lodash';

const buildMsg = (first, second) => [first, second].filter(a => a).join(' - ');

const turnEndlessArrayStructureIntoArrayOfTestObjects = endlessArrayStructure => {
  const arrayOfObjects = [];
  endlessArrayStructure.forEach(el => {
    if (typeof el[0] === 'string') {
      arrayOfObjects.push({ msg: el[0], test: el[1], cb: el[2] === 'cb' });
    } else {
      el.forEach(obj => {
        arrayOfObjects.push(obj);
      });
    }
  });
  return _.flattenDeep(arrayOfObjects);
};

export const context = (msg, arrayOfMessagesAndExamples) => turnEndlessArrayStructureIntoArrayOfTestObjects(
  arrayOfMessagesAndExamples
).map(obj => Object.assign({}, obj, { msg: buildMsg(msg, obj.msg) }));

export const describe = (describeMsg, exampleArray) => context(describeMsg, exampleArray).forEach(ex => {
  if (ex.cb) {
    test.cb(ex.msg, ex.test);
  } else {
    test(ex.msg, ex.test);
  }
});

export default describe;
