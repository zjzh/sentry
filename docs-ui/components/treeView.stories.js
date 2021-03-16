import React from 'react';

import TreeView from 'app/components/treeView';

export default {
  title: 'Core/List',
  component: TreeView,
};

export const _TreeView = () => {
  return (
    <TreeView
      data={{
        docs: {
          'Getting Started': [
            'gettingstarted/devmachine',
            'gettingstarted/azuredevops',
            'gettingstarted/templates',
          ],
        },
      }}
    />
  );
};

_TreeView.storyName = 'TreeView';
_TreeView.parameters = {
  docs: {
    description: {
      story: 'A tree view presents a hierarchical list',
    },
  },
};
