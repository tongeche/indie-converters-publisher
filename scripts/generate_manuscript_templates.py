from __future__ import annotations

from datetime import datetime, timezone
from html import escape
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


OUTPUT_DIR = Path("public/templates")

TEMPLATES = [
    {
        "file": "indie-fiction-starter.docx",
        "title": "Fiction Starter",
        "subtitle": "A clean first-chapter model for novels and short fiction.",
        "chapter": "Chapter One",
        "paragraphs": [
            "Replace this opening with your first scene. Start close to a moment of tension, desire, or change. Give the reader a clear sense of place, voice, and what is about to shift.",
            "The first thing that strikes you about the house on Meridian Street is not its size, though it is substantial, nor its age, though it predates the neighbourhood by nearly forty years. What strikes you is the silence it keeps.",
            "Inside, the rooms carry the particular coolness of places that have always held more than furniture. There is a study where the bookshelves reach the ceiling, where late afternoon light falls in slats through wooden blinds, where the smell of old paper is so familiar it no longer registers as a smell but as something closer to memory.",
            "Scene break",
            "Begin the next beat after the break. Use this space to move time, location, or emotional focus without adding unnecessary explanation.",
        ],
    },
    {
        "file": "indie-romance-starter.docx",
        "title": "Romance Starter",
        "subtitle": "A warm chapter model for romance, memoir, and intimate fiction.",
        "chapter": "Chapter One",
        "paragraphs": [
            "Replace this opening with a moment that reveals longing, conflict, or chemistry. Romance works best when the emotional question is visible early.",
            "Mara saw him before he saw her, which was unfair, because it gave her almost three whole seconds to pretend she had not rehearsed this meeting in her head since Tuesday.",
            '"You came," he said.',
            '"You asked," she answered, and hated how quickly the old rhythm found them.',
            "The cafe was louder than she remembered, all milk steam and chair legs and rain against the front window. Still, between them, there was that familiar pocket of quiet where everything unsaid seemed to take a seat.",
            "Scene break",
            "Use this next section to deepen the stakes. What does each character want, and what are they afraid will happen if they get it?",
        ],
    },
    {
        "file": "indie-nonfiction-starter.docx",
        "title": "Nonfiction Starter",
        "subtitle": "A simple model for essays, guides, memoir, and practical nonfiction.",
        "chapter": "Chapter One",
        "paragraphs": [
            "Replace this opening with the promise of the chapter. Name the problem, give the reader a reason to care, and make the next page feel useful.",
            "Most people do not fail to finish a book because they lack ideas. They fail because the idea stays too large for too long. A book becomes easier to write when it is broken into decisions a person can make today.",
            "This chapter starts with the smallest useful decision: what the reader should understand, feel, or be able to do by the end of the next ten pages.",
            "Key idea",
            "Use this short section to state the main point in plain language. Then support it with an example, a story, or a practical step.",
            "Try this",
            "End the section with one action the reader can take. Keep it concrete enough that someone can do it without needing another explanation.",
        ],
    },
]

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
        <w:sz w:val="24"/>
        <w:color w:val="1B1330"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="180" w:line="360" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="180" w:line="360" w:lineRule="auto"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:b/>
      <w:sz w:val="40"/>
      <w:color w:val="1B1330"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:after="360"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:sz w:val="20"/>
      <w:color w:val="5F557E"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="420" w:after="360"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:color w:val="1B1330"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="SectionLabel">
    <w:name w:val="Section Label"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="240" w:after="180"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:smallCaps/>
      <w:sz w:val="18"/>
      <w:color w:val="441CB2"/>
    </w:rPr>
  </w:style>
</w:styles>"""

APP_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Indie Converters</Application>
</Properties>"""


def paragraph(text: str, style_id: str = "Normal") -> str:
    style = "" if style_id == "Normal" else f'<w:pStyle w:val="{style_id}"/>'
    return f"<w:p><w:pPr>{style}</w:pPr><w:r><w:t>{escape(text)}</w:t></w:r></w:p>"


def document_xml(template: dict[str, object]) -> str:
    body = [
        paragraph("[Book Title]", "Title"),
        paragraph("[Author Name]", "Subtitle"),
        paragraph(str(template["chapter"]), "Heading1"),
    ]

    for line in template["paragraphs"]:
        if line in {"Scene break", "Key idea", "Try this"}:
            body.append(paragraph(line, "SectionLabel"))
        else:
            body.append(paragraph(line))

    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {''.join(body)}
    <w:sectPr>
      <w:pgSz w:w="8640" w:h="12960"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
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
