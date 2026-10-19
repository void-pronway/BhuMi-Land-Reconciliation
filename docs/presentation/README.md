# BhuMi pitch deck

**Version note:** These presentation files predate the bilingual redesign and individual accounts. Review screenshots, authentication, database details and test counts against the current README and validation report before presenting; the deck has not been regenerated for this release.

- [Nine-slide PDF](BhuMi_Pitch_Deck.pdf): submission/presentation copy.
- [Editable PowerPoint](BhuMi_Pitch_Deck.pptx): edit in PowerPoint, LibreOffice Impress or import into Google Slides.
- [Speaker notes](Speaker_Notes.md): five-minute narrative, also embedded in the PowerPoint notes.

The live example is **DEMO-P4-011**, the concept note's 100-decimal parcel with a hidden 10-decimal discrepancy. The main application feature card instead opens DEMO-P4-001, the separate 120-decimal / 15-decimal example. Select DEMO-P4-011 manually when presenting slide 5.

Before submission, replace student names, DIU IDs and mentor placeholders on slide 9. The wordmark is a temporary original treatment, not an official supplied logo. Review the content and rehearse with the actual application. The PDF contains nine slides; speaker notes are not included as extra pages. This deck has not been submitted to the organizers.

Implemented functionality and measured tests are separated from future plans. The deck does not claim government integration, legal verification, institutional adoption or verified hosted deployment.

To regenerate, install `python-pptx` in a Python environment and run `python3 docs/presentation/generate_deck.py`. Export the generated PPTX to PDF with PowerPoint or LibreOffice. The generator overwrites the generated deck and speaker notes; save manual edits separately before running it again.
