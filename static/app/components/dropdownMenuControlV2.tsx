import {useRef} from 'react';
import {CSSTransition} from 'react-transition-group';
import styled from '@emotion/styled';
import {useButton} from '@react-aria/button';
import {FocusScope} from '@react-aria/focus';
import {useOverlay, useOverlayPosition, useOverlayTrigger} from '@react-aria/overlays';
import {Item} from '@react-stately/collections';
import {useOverlayTriggerState} from '@react-stately/overlays';

import DropdownButton from 'sentry/components/dropdownButtonV2';
import space from 'sentry/styles/space';

import {Item as ItemType} from './dropdownMenuItemV2';
import Menu, {MenuProps} from './dropdownMenuV2';

type Props = MenuProps & {items: ItemType[]};

function MenuControl({items, easing = 'quart', ...props}: Props) {
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
    shouldFlip: false,
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
        Dropdown
      </DropdownButton>
      <CSSTransition timeout={250} in={state.isOpen} mountOnEnter unmountOnExit>
        <Overlay
          ref={overlayRef}
          easing={easing}
          {...overlayProps}
          {...positionProps}
          {...triggerOverlayProps}
        >
          <FocusScope restoreFocus autoFocus>
            <Menu {...props} close={state.close}>
              {items.map(item => (
                <Item key={item.id} {...item} />
              ))}
            </Menu>
          </FocusScope>
        </Overlay>
      </CSSTransition>
    </div>
  );
}

export default MenuControl;

const Overlay = styled.div<{easing: string}>`
  opacity: 0;
  transform: translateY(-${space(2)});
  transition: opacity ${p => p.theme.animation[p.easing].fastOut},
    transform ${p => p.theme.animation[p.easing].fastOut};

  &.enter-active,
  &.enter-done {
    opacity: 1;
    transform: translateY(0);
  }

  &.exit-active {
    opacity: 0;
    transform: translateY(0);
  }
`;
