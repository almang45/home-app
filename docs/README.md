# Documentation

Welcome to the home-app documentation.

## Table of Contents

### Games

#### Warframe
- **[Warframe Tracker](./games/warframe/README.md)** - Complete documentation for the Warframe progression tracking system

### Project Documentation

For general project information, architecture, and conventions, see the root-level files:
- **[README.md](../README.md)** - Project overview and setup
- **[AGENTS.md](../AGENTS.md)** - Architecture, conventions, and developer guide
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history and changes

## Contributing

When adding new feature documentation:

1. Create a folder under the appropriate category (e.g., `docs/games/<game-name>/`)
2. Add a comprehensive `README.md` in that folder
3. Include supporting documentation files as needed
4. Update this index file with a link to your documentation
5. Update the main `README.md` if it's a major feature
6. Update `AGENTS.md` with developer-specific guidelines

## Documentation Structure

```
docs/
├── README.md (this file)
└── games/
    └── warframe/
        ├── README.md                         # Main documentation
        ├── DATA_ARCHITECTURE.md              # Data architecture
        ├── GITHUB_FIRST_ARCHITECTURE.md      # Design rationale
        ├── IMPLEMENTATION_SUMMARY.md         # Implementation details
        ├── POCKETBASE_SCHEMA.md              # Database schema
        ├── RECIPE_SCRAPER_INTEGRATION.md     # Recipe scraper
        ├── WARFRAME_NESTED_MATERIALS_FIX.md  # Nested materials fix
        └── WARFRAME_TRACKER_TEST_REPORT.md   # Testing report
```

## License

All documentation is part of the home-app project and is licensed under MIT.
