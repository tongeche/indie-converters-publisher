from __future__ import annotations

from datetime import datetime, timezone
from html import escape
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


OUTPUT_DIR = Path("public/templates")


def twips(inches: float) -> int:
    return round(inches * 1440)


DEFAULT_PAGE = {
    "width": 6,
    "height": 9,
    "top": 0.75,
    "right": 0.75,
    "bottom": 0.75,
    "left": 0.75,
    "gutter": 0,
}

PRINT_PAGES = {
    "5x8": {
        "width": 5,
        "height": 8,
        "top": 0.72,
        "right": 0.62,
        "bottom": 0.72,
        "left": 0.72,
        "gutter": 0.18,
    },
    "5.5x8.5": {
        "width": 5.5,
        "height": 8.5,
        "top": 0.75,
        "right": 0.65,
        "bottom": 0.75,
        "left": 0.75,
        "gutter": 0.18,
    },
    "6x9": {
        "width": 6,
        "height": 9,
        "top": 0.78,
        "right": 0.7,
        "bottom": 0.78,
        "left": 0.78,
        "gutter": 0.2,
    },
    "8.5x11": {
        "width": 8.5,
        "height": 11,
        "top": 0.85,
        "right": 0.75,
        "bottom": 0.85,
        "left": 0.85,
        "gutter": 0.25,
    },
}


TEMPLATES = [
    {
        "file": "indie-fiction-starter.docx",
        "title": "Fiction Starter",
        "subtitle": "Clean chapter model for novels and short fiction.",
        "page": DEFAULT_PAGE,
        "blocks": [
            ("Title", "[Book Title]"),
            ("Subtitle", "[Author Name]"),
            ("Heading1", "Chapter One"),
            ("Instruction", "Replace this instruction before upload. Start close to a moment of tension, desire, or change. Use Heading 1 only for real chapter titles."),
            ("FirstParagraph", "The first thing that strikes you about the house on Meridian Street is not its size, though it is substantial, nor its age, though it predates the neighbourhood by nearly forty years. What strikes you is the silence it keeps."),
            ("BodyText", "Inside, the rooms carry the particular coolness of places that have always held more than furniture. There is a study where the bookshelves reach the ceiling, where late afternoon light falls in slats through wooden blinds, where the smell of old paper is so familiar it no longer registers as a smell but as something closer to memory."),
            ("SceneBreak", "* * *"),
            ("BodyText", "Begin the next beat after the scene break. Use this space to move time, location, or emotional focus without adding unnecessary explanation."),
        ],
    },
    {
        "file": "indie-romance-starter.docx",
        "title": "Romance Starter",
        "subtitle": "Warm chapter model for romance and intimate fiction.",
        "page": DEFAULT_PAGE,
        "blocks": [
            ("Title", "[Book Title]"),
            ("Subtitle", "[Author Name]"),
            ("Heading1", "Chapter One"),
            ("Instruction", "Open with emotional stakes. Show what the character wants, what they fear, and why this meeting or moment matters."),
            ("FirstParagraph", "Mara saw him before he saw her, which was unfair, because it gave her almost three whole seconds to pretend she had not rehearsed this meeting in her head since Tuesday."),
            ("BodyText", '"You came," he said.'),
            ("BodyText", '"You asked," she answered, and hated how quickly the old rhythm found them.'),
            ("BodyText", "The cafe was louder than she remembered, all milk steam and chair legs and rain against the front window. Still, between them, there was that familiar pocket of quiet where everything unsaid seemed to take a seat."),
            ("SceneBreak", "* * *"),
            ("BodyText", "Use the next section to deepen the stakes. What does each character want, and what are they afraid will happen if they get it?"),
        ],
    },
    {
        "file": "indie-nonfiction-starter.docx",
        "title": "Nonfiction Starter",
        "subtitle": "Practical model for essays, guides, and idea-led books.",
        "page": DEFAULT_PAGE,
        "blocks": [
            ("Title", "[Book Title]"),
            ("Subtitle", "[Author Name]"),
            ("Heading1", "Chapter One"),
            ("Instruction", "Name the problem, give the reader a reason to care, and make the next page feel useful."),
            ("FirstParagraph", "Most people do not fail to finish a book because they lack ideas. They fail because the idea stays too large for too long. A book becomes easier to write when it is broken into decisions a person can make today."),
            ("BodyText", "This chapter starts with the smallest useful decision: what the reader should understand, feel, or be able to do by the end of the next ten pages."),
            ("Subheading", "Key idea"),
            ("BodyText", "State the main point in plain language. Then support it with an example, a story, or a practical step."),
            ("Subheading", "Try this"),
            ("BodyText", "End the section with one action the reader can take. Keep it concrete enough that someone can do it without needing another explanation."),
        ],
    },
    {
        "file": "indie-memoir-starter.docx",
        "title": "Memoir Starter",
        "subtitle": "Reflective opening model for personal narrative.",
        "page": DEFAULT_PAGE,
        "blocks": [
            ("Title", "[Memoir Title]"),
            ("Subtitle", "[Author Name]"),
            ("Heading1", "Chapter One"),
            ("Instruction", "Start with a specific remembered moment. Let the scene carry the meaning before you explain what it means."),
            ("FirstParagraph", "For years I told the story as if it began at the airport, with one suitcase, a missing boarding pass, and my mother pretending not to cry. That version is easier to tell. It has a beginning people recognize."),
            ("BodyText", "The truth is smaller and less tidy. It begins in the kitchen, three nights earlier, with the radio low, the kettle hissing, and my father folding a letter into quarters as if the paper itself might object."),
            ("BlockQuote", "Memory is not a courtroom. It does not present evidence in order."),
            ("BodyText", "Use reflection after the scene. Let the reader know why this moment still follows the narrator."),
        ],
    },
    {
        "file": "indie-poetry-starter.docx",
        "title": "Poetry Starter",
        "subtitle": "Minimal layout for poems, sections, and credits.",
        "page": DEFAULT_PAGE,
        "blocks": [
            ("Title", "[Collection Title]"),
            ("Subtitle", "[Author Name]"),
            ("Heading1", "I. First Light"),
            ("Instruction", "Use one poem title per page or section. Keep manual spacing simple so the book can reflow cleanly."),
            ("PoemTitle", "A Small Weather"),
            ("PoemLine", "The morning folds itself"),
            ("PoemLine", "into the blue cup on the sill."),
            ("PoemLine", ""),
            ("PoemLine", "Someone has left the window open."),
            ("PoemLine", "Someone has mistaken this for mercy."),
            ("Subheading", "Notes"),
            ("BodyText", "Add acknowledgements, first publication credits, or section notes at the end of the collection."),
        ],
    },
    {
        "file": "indie-short-story-collection-starter.docx",
        "title": "Short Story Collection Starter",
        "subtitle": "Structure for collection title pages and individual stories.",
        "page": DEFAULT_PAGE,
        "blocks": [
            ("Title", "[Collection Title]"),
            ("Subtitle", "[Author Name]"),
            ("Heading1", "Story Title"),
            ("Instruction", "Use Heading 1 for each story title. Keep author notes, dedications, or epigraphs separate from the story body."),
            ("FirstParagraph", "The bus arrived empty except for the driver and a woman in a red coat who seemed to know everyone who had ever left town."),
            ("BodyText", "The narrator should enter the story quickly. A collection works best when each opening teaches the reader how that story wants to be read."),
            ("SceneBreak", "* * *"),
            ("BodyText", "Use a scene break for time jumps, point-of-view shifts, or a sharp turn in the story."),
            ("Heading1", "Next Story Title"),
            ("Instruction", "Duplicate this title and body structure for the next story in the collection."),
        ],
    },
    {
        "file": "indie-front-back-matter-pack.docx",
        "title": "Front and Back Matter Pack",
        "subtitle": "Starter pages authors can copy into any manuscript.",
        "page": DEFAULT_PAGE,
        "blocks": [
            ("Title", "[Book Title]"),
            ("Subtitle", "[Author Name]"),
            ("Heading1", "Copyright"),
            ("BodyText", "Copyright (C) [Year] [Author Name]. All rights reserved."),
            ("BodyText", "No part of this book may be reproduced or transmitted without written permission from the author, except for brief quotations used in reviews or critical articles."),
            ("Heading1", "Dedication"),
            ("CenteredText", "For [name], who [short reason]."),
            ("Heading1", "Epigraph"),
            ("BlockQuote", "Place a short quotation here only if you have permission or it is clearly in the public domain."),
            ("CenteredText", "- [Attribution]"),
            ("Heading1", "Also by [Author Name]"),
            ("BodyText", "[Book Title 1]"),
            ("BodyText", "[Book Title 2]"),
            ("Heading1", "Acknowledgements"),
            ("BodyText", "Thank the people who supported the writing, editing, design, research, and publication of this book."),
            ("Heading1", "About the Author"),
            ("BodyText", "[Author Name] writes [genre/category] for readers who enjoy [reader promise]. Their work explores [themes]. Learn more at [website or profile link]."),
            ("Heading1", "Stay in Touch"),
            ("BodyText", "Join the author's newsletter, read samples, or find buying links at [link]."),
        ],
    },
]

for key, page in PRINT_PAGES.items():
    label = key.replace("x", " x ")
    TEMPLATES.append(
        {
            "file": f"indie-print-{key}-starter.docx",
            "title": f"{label} Print Starter",
            "subtitle": "Print-aware Word setup with sample chapter text.",
            "page": page,
            "blocks": [
                ("Title", "[Book Title]"),
                ("Subtitle", "[Author Name]"),
                ("Instruction", f"This file is set to {label} inches with starter margins and gutter. Replace the sample text, then upload or export when ready."),
                ("Heading1", "Chapter One"),
                ("FirstParagraph", "This is a print-aware starter page. The page size, margins, and gutter are already set so you can draft inside a realistic book shape."),
                ("BodyText", "For best conversion results, use the built-in styles instead of manual formatting. Chapter titles should use Heading 1. Body paragraphs should use the default body style. Scene breaks should use the centered scene break style."),
                ("Subheading", "Layout note"),
                ("BodyText", "Before final print export, page count, images, chapter starts, and front matter should be checked in the Indie Converters preview."),
            ],
        }
    )


CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""

RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""

DOCUMENT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>"""

STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
        <w:sz w:val="23"/>
        <w:color w:val="1B1330"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="340" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="160" w:line="340" w:lineRule="auto"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:sz w:val="23"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="360" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:b/>
      <w:sz w:val="42"/>
      <w:color w:val="1B1330"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:after="420"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:sz w:val="20"/>
      <w:color w:val="5F557E"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ChapterTitle">
    <w:name w:val="Chapter Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:pStyle w:val="Heading1"/>
      <w:jc w:val="center"/>
      <w:spacing w:before="520" w:after="380"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:color w:val="1B1330"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="520" w:after="380"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:color w:val="1B1330"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Instruction">
    <w:name w:val="Instruction"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="160" w:after="260" w:line="300" w:lineRule="auto"/>
      <w:ind w:left="360" w:right="360"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:i/>
      <w:sz w:val="19"/>
      <w:color w:val="5F557E"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="FirstParagraph">
    <w:name w:val="First Paragraph"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="160" w:line="340" w:lineRule="auto"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:sz w:val="23"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="BodyText">
    <w:name w:val="Book Body Text"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="160" w:line="340" w:lineRule="auto"/>
      <w:ind w:firstLine="260"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:sz w:val="23"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subheading">
    <w:name w:val="Subheading"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:smallCaps/>
      <w:sz w:val="19"/>
      <w:color w:val="441CB2"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="SceneBreak">
    <w:name w:val="Scene Break"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="220" w:after="220"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:sz w:val="20"/>
      <w:color w:val="441CB2"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="BlockQuote">
    <w:name w:val="Block Quote"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="220" w:after="220" w:line="320" w:lineRule="auto"/>
      <w:ind w:left="540" w:right="540"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:i/>
      <w:sz w:val="22"/>
      <w:color w:val="3F375A"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="CenteredText">
    <w:name w:val="Centered Text"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:after="180"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:sz w:val="23"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="PoemTitle">
    <w:name w:val="Poem Title"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="200"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:b/>
      <w:sz w:val="26"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="PoemLine">
    <w:name w:val="Poem Line"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="60" w:line="300" w:lineRule="auto"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:sz w:val="23"/>
    </w:rPr>
  </w:style>
</w:styles>"""

APP_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Indie Converters</Application>
</Properties>"""


def paragraph(text: str, style_id: str = "BodyText") -> str:
    style = "" if style_id == "Normal" else f'<w:pStyle w:val="{style_id}"/>'
    if not text:
        return f"<w:p><w:pPr>{style}</w:pPr></w:p>"
    return f"<w:p><w:pPr>{style}</w:pPr><w:r><w:t>{escape(text)}</w:t></w:r></w:p>"


def document_xml(template: dict[str, object]) -> str:
    page = template.get("page", DEFAULT_PAGE)
    assert isinstance(page, dict)

    body = []
    for style_id, text in template["blocks"]:
        body.append(paragraph(str(text), str(style_id)))

    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {''.join(body)}
    <w:sectPr>
      <w:pgSz w:w="{twips(float(page["width"]))}" w:h="{twips(float(page["height"]))}"/>
      <w:pgMar w:top="{twips(float(page["top"]))}" w:right="{twips(float(page["right"]))}" w:bottom="{twips(float(page["bottom"]))}" w:left="{twips(float(page["left"]))}" w:header="720" w:footer="720" w:gutter="{twips(float(page["gutter"]))}"/>
    </w:sectPr>
  </w:body>
</w:document>"""


def core_xml(template: dict[str, object]) -> str:
    now = datetime.now(timezone.utc).isoformat()
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>{escape(str(template["title"]))}</dc:title>
  <dc:subject>{escape(str(template["subtitle"]))}</dc:subject>
  <dc:creator>Indie Converters</dc:creator>
  <cp:lastModifiedBy>Indie Converters</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>"""


def write_docx(template: dict[str, object]) -> None:
    target = OUTPUT_DIR / str(template["file"])
    with ZipFile(target, "w", ZIP_DEFLATED) as docx:
        docx.writestr("[Content_Types].xml", CONTENT_TYPES)
        docx.writestr("_rels/.rels", RELS)
        docx.writestr("word/_rels/document.xml.rels", DOCUMENT_RELS)
        docx.writestr("word/document.xml", document_xml(template))
        docx.writestr("word/styles.xml", STYLES)
        docx.writestr("docProps/core.xml", core_xml(template))
        docx.writestr("docProps/app.xml", APP_XML)
    print(f"Generated {target}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for template in TEMPLATES:
        write_docx(template)


if __name__ == "__main__":
    main()
