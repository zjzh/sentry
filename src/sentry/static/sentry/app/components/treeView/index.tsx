import React from 'react';

import Tree from './tree';

type Props = Pick<Tree['props'], 'data' | 'toggled'>;

function TreeView({data, toggled}: Props) {
  return <Tree data={data} toggled={toggled} />;
}

export default TreeView;
