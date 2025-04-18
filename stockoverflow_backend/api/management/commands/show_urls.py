from django.core.management.base import BaseCommand
from django.urls import get_resolver

class Command(BaseCommand):
    help = 'Displays all registered URLs'

    def handle(self, *args, **kwargs):
        resolver = get_resolver()
        url_patterns = resolver.url_patterns

        def list_urls(urlpatterns, parent=""):
            for pattern in urlpatterns:
                if hasattr(pattern, 'url_patterns'):  # Include nested urlpatterns
                    list_urls(pattern.url_patterns, parent + str(pattern.pattern))
                else:
                    self.stdout.write(f"{parent}{pattern.pattern}")

        list_urls(url_patterns)
