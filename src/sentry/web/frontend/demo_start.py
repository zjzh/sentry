from django.http import Http404
from django.conf import settings
from django.db import transaction

from sentry.demo.demo_manager import get_user_org
from sentry.utils import auth
from sentry.web.frontend.base import BaseView


class DemoStartView(BaseView):
    csrf_protect = False
    auth_required = False

    @transaction.atomic
    def post(self, request):
        # need this check for tests since the route will exist even if DEMO_MODE=False
        if not settings.DEMO_MODE:
            raise Http404

        # TODO: handle case where no user/org is rready
        (user, org) = get_user_org()

        auth.login(request, user)
        return self.redirect(auth.get_login_redirect(request))
