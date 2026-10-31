"""Adapts the GitHub-style Markdown of the workbook to Python-Markdown (MkDocs).

- A list directly after a paragraph line gets a blank line before it.
- Content indented under a list item ("1. " = 3 spaces) gets one more space,
  because Python-Markdown expects 4.
- Consecutive "**Label:** text" lines keep their line breaks.
"""
import re

LIST = re.compile(r"^(\d+\.|[-*]) ")
LABEL = re.compile(r"^\*\*[^*]+:\*\*")


def on_page_markdown(markdown, **kwargs):
    out = []
    top_fence = False
    for line in markdown.split("\n"):
        prev = out[-1] if out else ""
        if line.startswith("```"):
            top_fence = not top_fence
        elif top_fence:
            pass
        elif line.startswith("   "):
            line = " " + line
        elif LIST.match(line) and prev.strip() and not LIST.match(prev) and not prev.startswith(" "):
            out.append("")
        elif LABEL.match(line) and LABEL.match(prev):
            out[-1] = prev + "  "
        out.append(line)
    return "\n".join(out)
