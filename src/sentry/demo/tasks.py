from datetime import timedelta
from django.conf import settings
from django.utils import timezone

from sentry.models import Organization, OrganizationStatus, User, OrganizationMember
from sentry.tasks.base import instrumented_task
from sentry.tasks.deletion import delete_organization, retry
from sentry.exceptions import DeleteAborted

MAX_RETRIES = 5


@instrumented_task(
    name="sentry.demo.tasks.delete_organization_and_user",
    queue="cleanup",
    default_retry_delay=60 * 5,
    max_retries=MAX_RETRIES,
)
@retry(exclude=(DeleteAborted,))
def delete_organization_and_user(organization_id, user_id):
    Organization.objects.filter(id=organization_id).update(
        status=OrganizationStatus.PENDING_DELETION
    )
    User.objects.filter(id=user_id).delete()

    delete_organization(
        object_id=organization_id,
        actor_id=user_id,
    )


print("register tasks")


@instrumented_task(
    name="sentry.demo.tasks.delete_old_orgs",
)
def delete_old_orgs(**kwargs):
    print("heyyy")
    if not settings.DEMO_MODE:
        return

    org_list = Organization.objects.filter(
        date_added__lte=timezone.now() - timedelta(days=1)
    ).exclude(slug__in=settings.DEMO_ORGS_TO_NOT_DELETE)

    for org in org_list:
        user_ids = OrganizationMember.objects.filter(organization=org, role="member").values_list(
            "user_id", flat=True
        )
        User.objects.filter(id__in=user_ids).delete()

        org.status = OrganizationStatus.PENDING_DELETION
        org.save()

        delete_organization.apply_async(kwargs={"object_id": organization_id, "actor_id": user_id})
