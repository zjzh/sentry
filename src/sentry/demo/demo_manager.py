from django.core.cache import cache
from django.conf import settings
from typing import List, Tuple


from sentry.models import (
    User,
    Organization,
)

from .tasks import create_demo_org_user


BUFFER_SIZE = 3


class DemoManager:
    def populate_buffer(self):
        print("curr buffer size", self.current_buffer_size)
        num_to_populate = BUFFER_SIZE - self.current_buffer_size
        if num_to_populate < 1:
            return

        for i in range(num_to_populate):
            create_demo_org_user.apply_async()

    @property
    def cache_key(self):
        return "demo:orgs_users"

    @property
    def get_current_buffer(self) -> List[Tuple[User, Organization]]:
        return cache.get(self.cache_key) or []

    def add_user_org(self, user: User, org: Organization) -> None:
        cached_demo_user_orgs = self.get_current_buffer
        cached_demo_user_orgs.append((user.id, org.id))
        cache.set(self.cache_key, cached_demo_user_orgs)

    def get_user_org(self) -> (User, Organization):
        cached_demo_user_orgs = self.get_current_buffer

        # TODO: handle 0 buffer size
        user_id, org_id = cached_demo_user_orgs.pop(0)
        cache.set(self.cache_key, cached_demo_user_orgs)

        if len(cached_demo_user_orgs) < BUFFER_SIZE:
            create_demo_org_user.apply_async()

        user = User.objects.get(id=user_id)
        org = Organization.objects.get(id=org_id)

        return (user, org)

    @property
    def current_buffer_size(self) -> int:
        return len(self.get_current_buffer)


manager = DemoManager()
add_user_org = manager.add_user_org
get_user_org = manager.get_user_org

if settings.DEMO_MODE:
    manager.populate_buffer()
