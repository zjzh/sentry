HACKING_PATTERNS_FILE = "src/sentry/data/hacking-patterns/quick-SQLi.txt"


class HackingPatterns:
    hacking_patterns = []

    def __init__(self):
        with open(HACKING_PATTERNS_FILE) as f:
            for line in f.readlines():
                line = self._normalize(line)
                self.hacking_patterns.append(line)

    def _normalize(self, s):
        return s.strip().replace(" ", "").lower()

    def get(self, s):
        s = self._normalize(s)

        for pattern in self.hacking_patterns:
            if pattern in s:
                return pattern

        return None
