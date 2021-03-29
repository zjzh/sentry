// eslint-disable-next-line sentry/no-react-hooks
import React, {useCallback, useEffect, useRef, useState} from 'react';
import styled from '@emotion/styled';

import {addErrorMessage} from 'app/actionCreators/indicator';
import InlineInput from 'app/components/inputInline';
import {t} from 'app/locale';
import space from 'app/styles/space';

type Props = {
  onChange: (label?: string) => void;
  label?: string;
};

function EditableLabel({isEditing, onChange, label}: Props) {
  const [isInputActive, setIsInputActive] = useState(false);
  const [inputValue, setInputValue] = useState(label);
  const enter = useKeypress('Enter');
  const esc = useKeypress('Escape');

  const refInput = useRef(null);

  const onEnter = useCallback(() => {
    if (enter) {
      onChange(inputValue);
      setIsInputActive(false);
    }
  }, [enter, inputValue, onChange]);

  const onEsc = useCallback(() => {
    if (esc) {
      setInputValue(label);
      setIsInputActive(false);
    }
  }, [esc, label]);

  useEffect(() => {
    if (isInputActive) {
      // if Enter is pressed, save the text and close the editor
      onEnter();
      // if Escape is pressed, revert the text and close the editor
      onEsc();
    }
  }, [onEnter, onEsc, isInputActive]); // watch the Enter and Escape key presses

  const handleInputChange = useCallback(
    event => {
      setInputValue(event.target.value);
    },
    [setInputValue]
  );

  function onBlur(event: React.ChangeEvent<HTMLInputElement>) {
    const nextDashboardTitle = (event.target.value || '').trim().slice(0, 255).trim();

    if (!nextDashboardTitle) {
      addErrorMessage(t('Please set the title for this dashboard'));

      // Help our users re-focus so they cannot run away from this problem
      if (refInput?.current) {
        refInput?.current?.focus();
      }

      return;
    }

    event.target.innerText = nextDashboardTitle;

    onUpdate({
      ...dashboard,
      title: nextDashboardTitle,
    });
  }

  return (
    <Wrapper>
      <StyledInlineInput
        name="editable-label"
        ref={refInput}
        value={label}
        onBlur={onBlur}
        onChange={handleInputChange}
      />
    </Wrapper>
  );
}

const Wrapper = styled('div')`
  margin-right: ${space(1)};

  @media (max-width: ${p => p.theme.breakpoints[2]}) {
    margin-bottom: ${space(2)};
  }
`;

const StyledInlineInput = styled(
  React.forwardRef((props: InlineInput['props'], ref: React.Ref<InlineInput>) => (
    <InlineInput {...props} ref={ref} />
  ))
)`
  overflow-wrap: anywhere;
  white-space: normal;
`;

export default EditableLabel;
