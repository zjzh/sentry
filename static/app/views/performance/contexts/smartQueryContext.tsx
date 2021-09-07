import {createStrictContext} from './utils';

const [SmartQueryProvider, useSmartQuery, smartQueryContext] = createStrictContext({
  name: 'SmartQueryContext ',
});
