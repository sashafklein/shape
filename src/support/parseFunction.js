import _ from 'lodash';

export const parse = func => {
  const declarationLine = func.toString().split('{')[0];
  const name = declarationLine.split('(')[0].split(' ')[1];
  const argNamesAsString = declarationLine.match(/\((.*)\)/g)[0]
                                          .replace(/\(/g, '').replace(/\)/g, '');
  const argNameArray = _.map(argNamesAsString.split(','), argName => argName.trim());

  return {
    name,
    arguments: argNameArray
  };
};

export default parse;
