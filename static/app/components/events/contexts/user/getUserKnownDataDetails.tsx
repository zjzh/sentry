import * as React from 'react';

import ExternalLink from 'app/components/links/externalLink';
import Tooltip from 'app/components/tooltip';
import {IconMail, IconWarning} from 'app/icons';
import {t} from 'app/locale';
import {AvatarUser as UserType} from 'app/types';

import {UserKnownDataType} from './types';

const EMAIL_REGEX = /[^@]+@[^\.]+\..+/;

type Output = {
  subject: string;
  value: string | null;
  subjectIcon?: React.ReactNode;
};

function getUserKnownDataDetails(
  data: UserType,
  type: UserKnownDataType
): Output | undefined {
  switch (type) {
    case UserKnownDataType.NAME:
      return {
        subject: t('Name'),
        value: data.name,
      };
    case UserKnownDataType.USERNAME:
      return {
        subject: t('Username'),
        value: data.username,
      };
    case UserKnownDataType.ID:
      return {
        subject: t('ID'),
        value: data.id,
      };
    case UserKnownDataType.IP_ADDRESS:
      const url = 'https://spyse.com/target/ip/' + data.ip_address;
      return {
        subject: t('IP Address'),
        value: data.ip_address,
        subjectIcon:
          data.reputation === undefined ? (
            ''
          ) : (
            <Tooltip
              isHoverable
              skipWrapper
              title={
                <span>
                  {`Risk level ${data.reputation.risk_level}. Threat is ${data.reputation.threat}. `}
                  <ExternalLink href={`${url}`}>More details</ExternalLink>
                </span>
              }
            >
              <IconWarning size="xs" color="red300" />
            </Tooltip>
          ),
      };
    case UserKnownDataType.EMAIL:
      return {
        subject: t('Email'),
        value: data.email,
        subjectIcon: EMAIL_REGEX.test(data.email) && (
          <ExternalLink href={`mailto:${data.email}`} className="external-icon">
            <IconMail size="xs" />
          </ExternalLink>
        ),
      };
    default:
      return undefined;
  }
}

export default getUserKnownDataDetails;
