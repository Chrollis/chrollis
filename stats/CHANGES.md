# Template Adaptation Notes

This repository was created from the GitHub Stats template. It is not a fork of the upstream repository.

## Changes made on 2026-10-02

- Remove original README.md and .gitattributes.
- Updated the GitHub Actions workflow to build the Zig application from the `stats/` directory.
- Run the built application from the repository root so that `overview.svg` and `languages.svg` are generated there.
- Stage and push only the generated SVG files to the `generated` branch.
- Keep the existing README image URLs unchanged.
- No changes were made to the statistics application or SVG templates.

## License

This repository remains distributed under GPLv3. See the repository's LICENSE file for the full license text.
