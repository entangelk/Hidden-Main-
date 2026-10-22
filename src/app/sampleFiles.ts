// P01 placeholder workspace. Replaced by scenario data in P02/P03.
export const sampleFiles: Record<string, string> = {
  'main.py': `from incidents import event_001


def main():
    event_001.run()


if __name__ == "__main__":
    main()
`,
  'config/settings.py': `LOG_LEVEL = "INFO"
TIMEZONE = "UTC"
`,
  'incidents/event_001.py': `class IncidentMonitor:

    def check_status(self):
        status = "unknown"
        return status
`,
}
