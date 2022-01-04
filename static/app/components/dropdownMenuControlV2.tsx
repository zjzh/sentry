import {useRef} from 'react';
import {useButton} from '@react-aria/button';
import {FocusScope} from '@react-aria/focus';
import {useOverlay, useOverlayPosition, useOverlayTrigger} from '@react-aria/overlays';
import {Item} from '@react-stately/collections';
import {useOverlayTriggerState} from '@react-stately/overlays';

import DropdownButton from 'sentry/components/dropdownButtonV2';

import {Item as ItemType} from './dropdownMenuItemV2';
import Menu, {MenuProps} from './dropdownMenuV2';

type Props = MenuProps & {items: ItemType[]};

function MenuControl({items, ...props}: Props) {
  const triggerRef = useRef(null);
  const overlayRef = useRef(null);
  const state = useOverlayTriggerState({});

  const {overlayProps} = useOverlay(
    {
      onClose: state.close,
      isOpen: state.isOpen,
      isDismissable: true,
    },
    overlayRef
  );

  const {triggerProps, overlayProps: triggerOverlayProps} = useOverlayTrigger(
    {type: 'menu'},
    state,
    triggerRef
  );

  const {overlayProps: positionProps} = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef,
    placement: 'bottom',
    offset: 10,
    isOpen: state.isOpen,
  });
  const {buttonProps} = useButton({onPress: state.open}, triggerRef);

  return (
    <div>
      <DropdownButton
        ref={triggerRef}
        isOpen={state.isOpen}
        {...buttonProps}
        {...triggerProps}
      >
        Hello
      </DropdownButton>
      {state.isOpen && (
        <FocusScope restoreFocus autoFocus>
          <div
            ref={overlayRef}
            {...overlayProps}
            {...positionProps}
            {...triggerOverlayProps}
          >
            <Menu {...props} close={state.close}>
              {items.map(item => (
                <Item key={item.id} {...item} />
              ))}
            </Menu>
          </div>
        </FocusScope>
      )}
    </div>
  );
}

export default MenuControl;
