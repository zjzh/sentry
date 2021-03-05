import petname

from datetime import timedelta
from django.conf import settings
from django.db.models import F
from django.utils import timezone
from django.template.defaultfilters import slugify

from sentry import roles
from sentry.utils.email import create_fake_email
from sentry.models import (
    User,
    Organization,
    OrganizationStatus,
    OrganizationMember,
    OrganizationMemberTeam,
    Project,
    ProjectKey,
)
from sentry.tasks.base import instrumented_task
from sentry.tasks.deletion import delete_organization

from .data_population import populate_python_project, populate_react_project


def generate_random_name():
    return petname.Generate(2, " ", letters=10).title()


@instrumented_task(
    name="sentry.demo.tasks.delete_users_orgs",
)
def delete_users_orgs(**kwargs):
    if not settings.DEMO_MODE:
        return

    # delete everything older than a day
    cutoff_time = timezone.now() - timedelta(days=1)

    # first mark orgs for deletion
    # note this only runs in demo mode (not SaaS) so the underlying tables here are small
    org_list = Organization.objects.filter(
        date_added__lte=cutoff_time, flags=F("flags").bitor(Organization.flags["demo_mode"])
    )
    org_list.update(status=OrganizationStatus.PENDING_DELETION)

    # next delete the users
    User.objects.filter(
        date_joined__lte=cutoff_time, flags=F("flags").bitor(User.flags["demo_mode"])
    ).delete()

    # now finally delete the orgs
    for org in org_list:
        # apply async so if so we continue if one org aborts
        delete_organization.apply_async(kwargs={"object_id": org.id})


@instrumented_task(
    name="sentry.demo.tasks.create_demo_org_user",
)
def create_demo_org_user():
    if not settings.DEMO_MODE:
        return

    from .demo_manager import add_user_org

    print("create demo org/ser")
    # TODO: add way to ensure we generate unique petnames
    name = generate_random_name()

    slug = slugify(name)

    email = create_fake_email(slug, "demo")
    user = User.objects.create(
        email=email,
        username=email,
        is_managed=True,
        flags=User.flags["demo_mode"],
    )

    org = Organization.objects.create(
        name=name,
        slug=slug,
        flags=Organization.flags["demo_mode"],
    )
    team = org.team_set.create(name=org.name)

    owner = User.objects.get(email=settings.DEMO_ORG_OWNER_EMAIL)
    OrganizationMember.objects.create(organization=org, user=owner, role=roles.get_top_dog().id)

    member = OrganizationMember.objects.create(organization=org, user=user, role="member")
    OrganizationMemberTeam.objects.create(team=team, organizationmember=member, is_active=True)

    python_project = Project.objects.create(name="Python", organization=org, platform="python")
    python_project.add_team(team)

    reat_project = Project.objects.create(
        name="React", organization=org, platform="javascript-react"
    )
    reat_project.add_team(team)

    populate_python_project(python_project)
    populate_react_project(reat_project)

    # delete all DSNs for the org so people don't send events
    ProjectKey.objects.filter(project__organization=org).delete()

    add_user_org(user, org)
