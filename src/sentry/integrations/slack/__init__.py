from sentry.rules import rules
from sentry.utils.imports import import_submodules

from .attachment_manager import AttachmentManager
from .client import SlackClient  # NOQA
from .notify_action import SlackNotifyServiceAction

manager = AttachmentManager()
register_attachment_generator = manager.register_attachment_generator
get_attachments = manager.get_attachments

path = __path__  # type: ignore
import_submodules(globals(), __name__, path)

rules.add(SlackNotifyServiceAction)
