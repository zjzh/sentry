import {useRef} from 'react';
import styled from '@emotion/styled';
import {AriaMenuOptions, useMenu} from '@react-aria/menu';
import {useTreeState} from '@react-stately/tree';

import space from 'sentry/styles/space';

import MenuItem, {Item} from './dropdownMenuItemV2';

export type MenuProps = AriaMenuOptions<Item> & {
  closeMenuOnAction?: boolean;
  onAction: () => void;
};

type Props = MenuProps & {
  close: () => void;
};

function Menu({closeMenuOnAction = true, onAction, close, ...props}: Props) {
  const menuRef = useRef(null);
  const treeState = useTreeState({...props, selectionMode: 'none'});
  const {menuProps} = useMenu(props, treeState, menuRef);

  /**
   * Close menu on action if closeMenuOnAction is true
   */
  const onMenuAction = (...rest) => {
    onAction(...rest);
    if (closeMenuOnAction) close();
  };

  return (
    <MenuWrap ref={menuRef} {...menuProps}>
      {[...treeState.collection].map(item => (
        <MenuItem key={item.key} item={item} state={treeState} onAction={onMenuAction} />
      ))}
    </MenuWrap>
  );
}

export default Menu;

const MenuWrap = styled('ul')`
  display: block;
  padding: ${space(0.5)} 0;
  border: solid 1px ${p => p.theme.border};
  border-radius: ${p => p.theme.borderRadius};
  box-shadow: ${p => p.theme.dropShadowHeavy};
  font-size: ${p => p.theme.fontSizeMedium};
`;
