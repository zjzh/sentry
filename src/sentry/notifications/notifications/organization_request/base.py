from __future__ import annotations

import abc
import logging
from typing import TYPE_CHECKING, Any, MutableMapping, Iterable

from sentry.models import Team, OrganizationMember
from sentry.notifications.notifications.base import BaseNotification
from sentry.notifications.notifications.strategies.role_based_strategy import RoleBasedStrategy
from sentry.notifications.types import NotificationSettingTypes

if TYPE_CHECKING:
    from sentry.models import Organization, User, Teeam

logger = logging.getLogger(__name__)


class OrganizationRequestNotification(BaseNotification, abc.ABC):
    analytics_event: str = ""
    notification_setting_type = NotificationSettingTypes.APPROVAL
    RoleBasedStategyClass: RoleBasedStrategy = RoleBasedStrategy

    def __init__(self, organization: Organization, requester: User) -> None:
        super().__init__(organization)
        self.requester = requester
        self.role_based_strategy = self.RoleBasedStategyClass(organization)

    def get_reference(self) -> Any:
        return self.organization

    def get_notification_title(self) -> str:
        # purposely use empty string for the notification title
        return ""

    def get_title_link(self) -> str | None:
        return None

    def get_log_params(self, recipient: Team | User) -> MutableMapping[str, Any]:
        return {
            "organization_id": self.organization.id,
            "user_id": self.requester.id,
            "target_user_id": recipient.id,
            "actor_id": recipient.id,
        }

    def determine_recipients(self) -> Iterable[Team | User]:
        # TODO: stop passing members
        return self.role_based_strategy.determine_recipients(self.determine_member_recipients())

    def build_notification_footer_from_settings_url(
        self, settings_url: str, recipient: Team | User
    ) -> str:
        return self.role_based_strategy.build_notification_footer_from_settings_url(
            settings_url, recipient
        )

    # temp method to maintain same API until we update getsentry
    def set_member_in_cache(self, member: OrganizationMember) -> None:
        return self.role_based_strategy.set_member_in_cache(member)

    # temp method to maintain same API until we update getsentry
    def set_member_in_cache(self, member: OrganizationMember) -> None:
        """
        A way to set a member in a cache to avoid a query.
        """
        self.role_based_strategy.member_by_user_id[member.user_id] = member

    # temp method to maintain same API until we update getsentry
    def determine_member_recipients(self) -> Iterable[OrganizationMember]:
        raise NotImplementedError
