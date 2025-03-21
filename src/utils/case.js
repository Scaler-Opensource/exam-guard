import startCase from 'lodash/startCase';
import camelCase from 'lodash/camelCase';

export const titleCase = (str) => startCase(camelCase(str));
