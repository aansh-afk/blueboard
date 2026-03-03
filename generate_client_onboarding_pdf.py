from __future__ import annotations

from datetime import date
from pathlib import Path
from urllib.request import urlretrieve

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_JUSTIFY, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

W, H = letter
MARGIN = 40
PW = W - (MARGIN * 2)

BG_BASE = HexColor("#050505")
BG_SURFACE = HexColor("#0A0A0A")
BG_CARD = HexColor("#111111")
BG_ELEVATED = HexColor("#1A1A1E")

TEXT_PRIMARY = HexColor("#F9FAFB")
TEXT_SECONDARY = HexColor("#9CA3AF")
TEXT_TERTIARY = HexColor("#6B7280")
TEXT_MUTED = HexColor("#4B5563")

INDIGO = HexColor("#6366F1")
INDIGO_GLOW = HexColor("#818CF8")
INDIGO_DIM = HexColor("#312E81")

BORDER = HexColor("#2E2E35")
BORDER_SUBTLE = HexColor("#1F1F23")

GREEN = HexColor("#22C55E")
RED = HexColor("#EF4444")
AMBER = HexColor("#F59E0B")

ROOT = Path(__file__).resolve().parent
FONTS = ROOT / "fonts"


def register_fonts() -> None:
    mappings = {
        "Inter": (
            "Inter-Regular.ttf",
            "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
        ),
        "Inter-Medium": (
            "Inter-Medium.ttf",
            "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf",
        ),
        "Inter-SemiBold": (
            "Inter-SemiBold.ttf",
            "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf",
        ),
        "Inter-Bold": (
            "Inter-Bold.ttf",
            "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
        ),
        "Inter-ExtraBold": (
            "Inter-ExtraBold.ttf",
            "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.ttf",
        ),
        "Mono": (
            "IBMPlexMono-Regular.ttf",
            "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-400-normal.ttf",
        ),
        "Mono-Medium": (
            "IBMPlexMono-Medium.ttf",
            "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-500-normal.ttf",
        ),
        "Mono-SemiBold": (
            "IBMPlexMono-SemiBold.ttf",
            "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-600-normal.ttf",
        ),
        "Mono-Bold": (
            "IBMPlexMono-Bold.ttf",
            "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-700-normal.ttf",
        ),
    }

    FONTS.mkdir(parents=True, exist_ok=True)

    missing = []
    for font_name, (filename, url) in mappings.items():
        path = FONTS / filename
        if not path.exists():
            try:
                urlretrieve(url, path)
            except Exception:
                missing.append(filename)
                continue

        pdfmetrics.registerFont(TTFont(font_name, str(path)))

    if missing:
        raise RuntimeError(
            "Missing required fonts after download attempt: " + ", ".join(missing)
        )


class SectionDivider(Flowable):
    def __init__(self, number: str, title: str, width: float, bookmark_id: str | None = None):
        super().__init__()
        self.number = number
        self.title = title
        self.width = width
        self.height = 52
        self.bookmark_id = bookmark_id

    def draw(self) -> None:
        c = self.canv
        c.saveState()
        c.setStrokeColor(BORDER)
        c.setLineWidth(1)
        c.line(0, self.height - 6, self.width, self.height - 6)

        c.setFont("Mono-Bold", 11)
        c.setFillColor(INDIGO)
        c.drawString(0, 20, f"[{self.number.zfill(2)}]" if self.number else "")

        c.setFont("Inter-Bold", 18)
        c.setFillColor(TEXT_PRIMARY)
        c.drawString(42, 16, self.title)

        c.setStrokeColor(INDIGO)
        c.setLineWidth(2)
        c.line(0, 6, 60, 6)
        c.setStrokeColor(BORDER_SUBTLE)
        c.setLineWidth(1)
        c.line(64, 6, self.width, 6)

        if self.bookmark_id:
            c.bookmarkHorizontal(self.bookmark_id, 0, self.height)
            c.addOutlineEntry(self.title, self.bookmark_id, level=0)

        c.restoreState()


def cover_page_bg(c, doc) -> None:
    c.saveState()
    c.setFillColor(BG_BASE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    c.setStrokeColor(HexColor("#0D0D10"))
    c.setLineWidth(0.5)
    for x in range(0, int(W) + 1, 40):
        c.line(x, 0, x, H)
    for y in range(0, int(H) + 1, 40):
        c.line(0, y, W, y)

    c.setFillColor(INDIGO_DIM)
    c.rect(W - 150, H - 80, 120, 20, fill=1, stroke=0)
    c.rect(W - 120, H - 58, 90, 16, fill=1, stroke=0)

    c.setStrokeColor(BORDER)
    c.setLineWidth(2)
    c.rect(MARGIN - 4, H - 100, PW + 8, 60, fill=0, stroke=1)
    c.setFillColor(BG_CARD)
    c.rect(MARGIN - 4, H - 100, PW + 8, 60, fill=1, stroke=0)
    c.setStrokeColor(BORDER)
    c.rect(MARGIN - 4, H - 100, PW + 8, 60, fill=0, stroke=1)

    for i, col in enumerate([RED, AMBER, GREEN]):
        c.setFillColor(col)
        c.circle(MARGIN + 14 + i * 18, H - 70, 5, fill=1, stroke=0)

    c.setFillColor(TEXT_TERTIARY)
    c.setFont("Mono", 8)
    c.drawCentredString(W / 2, H - 74, "ltf1 - onboarding.report")

    y_title = H - 200
    c.setFillColor(INDIGO)
    c.setFont("Mono-Bold", 10)
    c.drawString(MARGIN, y_title + 30, "> cat questionnaire.md")

    c.setFillColor(TEXT_PRIMARY)
    c.setFont("Inter-ExtraBold", 44)
    c.drawString(MARGIN, y_title - 20, "LTF1")

    c.setFillColor(TEXT_TERTIARY)
    c.setFont("Mono-Medium", 11)
    c.drawString(MARGIN, y_title - 44, "Legion Task Framework")

    c.setFillColor(INDIGO_GLOW)
    c.setFont("Inter-SemiBold", 16)
    c.drawString(MARGIN, y_title - 72, "Client Discovery Onboarding")

    c.setFillColor(INDIGO)
    c.rect(MARGIN, y_title - 87, 80, 3, fill=1, stroke=0)

    y_desc = y_title - 180
    c.setFillColor(HexColor("#000000"))
    c.rect(MARGIN + 4, y_desc - 14, 390, 84, fill=1, stroke=0)
    c.setFillColor(BG_CARD)
    c.setStrokeColor(BORDER)
    c.setLineWidth(2)
    c.rect(MARGIN, y_desc - 10, 390, 84, fill=1, stroke=1)

    items = [
        "Capture business goals, constraints, and success metrics",
        "Align design and engineering scope before implementation",
        "Create clear decision ownership and launch expectations",
    ]
    for i, item in enumerate(items):
        c.setFillColor(INDIGO)
        c.setFont("Mono-Bold", 10)
        c.drawString(MARGIN + 14, y_desc + 48 - i * 22, ">")
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Inter", 10)
        c.drawString(MARGIN + 30, y_desc + 48 - i * 22, item)

    y_metrics = 140
    metrics = [
        ("12", "SECTIONS"),
        ("~60", "QUESTIONS"),
        ("1", "ONBOARD FLOW"),
        ("100%", "CLARITY TARGET"),
    ]
    card_w = 120
    gap = (PW - 4 * card_w) / 3
    for i, (val, label) in enumerate(metrics):
        x = MARGIN + i * (card_w + gap)
        c.setFillColor(HexColor("#000000"))
        c.rect(x + 4, y_metrics - 4, card_w, 60, fill=1, stroke=0)
        c.setFillColor(BG_CARD)
        c.setStrokeColor(BORDER)
        c.setLineWidth(2)
        c.rect(x, y_metrics, card_w, 60, fill=1, stroke=1)
        c.setFillColor(INDIGO)
        c.rect(x, y_metrics + 58, card_w, 2, fill=1, stroke=0)
        c.setFillColor(TEXT_PRIMARY)
        c.setFont("Inter-ExtraBold", 18)
        c.drawCentredString(x + card_w / 2, y_metrics + 28, val)
        c.setFillColor(TEXT_MUTED)
        c.setFont("Mono", 7)
        c.drawCentredString(x + card_w / 2, y_metrics + 10, label)

    c.setFillColor(INDIGO)
    c.setFont("Mono-Bold", 9)
    c.drawString(MARGIN, 80, "DATE:")
    c.setFillColor(TEXT_SECONDARY)
    c.setFont("Mono", 9)
    c.drawString(MARGIN + 42, 80, str(date.today()))

    c.setFillColor(INDIGO)
    c.setFont("Mono-Bold", 9)
    c.drawString(MARGIN + 180, 80, "SCOPE:")
    c.setFillColor(TEXT_SECONDARY)
    c.setFont("Mono", 9)
    c.drawString(MARGIN + 230, 80, "Client discovery + onboarding")

    c.setFillColor(TEXT_MUTED)
    c.setFont("Mono", 7)
    c.drawString(MARGIN, 55, "CONFIDENTIAL - INTERNAL USE ONLY")
    c.restoreState()


def dark_page_bg(c, doc) -> None:
    c.saveState()
    c.setFillColor(BG_BASE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    c.setFillColor(BG_SURFACE)
    c.rect(0, H - 36, W, 36, fill=1, stroke=0)
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.line(0, H - 36, W, H - 36)

    c.setFillColor(INDIGO)
    c.setFont("Mono-Bold", 8)
    c.drawString(MARGIN, H - 22, "LTF1")
    c.setFillColor(TEXT_TERTIARY)
    c.setFont("Mono", 7)
    c.drawCentredString(W / 2, H - 22, "// CLIENT DISCOVERY QUESTIONNAIRE")
    c.setFillColor(TEXT_MUTED)
    c.drawRightString(W - MARGIN, H - 22, str(date.today()))

    c.setStrokeColor(BORDER_SUBTLE)
    c.setLineWidth(1)
    c.line(MARGIN, 30, W - MARGIN, 30)
    c.setFillColor(TEXT_MUTED)
    c.setFont("Mono", 6.5)
    c.drawString(MARGIN, 18, "CONFIDENTIAL")
    c.setFillColor(TEXT_TERTIARY)
    c.setFont("Mono", 7)
    c.drawRightString(W - MARGIN, 18, f"PAGE {doc.page:02d}")
    c.restoreState()


def dark_table(headers, rows, col_widths=None, highlight_last=False, accent=INDIGO):
    hdr_style = ParagraphStyle("th", fontName="Mono-SemiBold", fontSize=7.5, leading=10, textColor=TEXT_PRIMARY)
    cell_style = ParagraphStyle("td", fontName="Inter", fontSize=8, leading=11, textColor=TEXT_SECONDARY)
    cell_value = ParagraphStyle("tdv", fontName="Mono-Bold", fontSize=8, leading=11, textColor=GREEN, alignment=TA_RIGHT)

    table_data = [[Paragraph(str(h).upper(), hdr_style) for h in headers]]
    for row in rows:
        table_data.append([
            Paragraph(str(row[0]), cell_style),
            Paragraph(str(row[1]), cell_style),
            Paragraph(str(row[2]), cell_value),
        ])

    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), BG_ELEVATED),
        ("LINEBELOW", (0, 0), (-1, 0), 2, accent),
        ("LINEABOVE", (0, 0), (-1, 0), 2, BORDER),
        ("LINEBELOW", (0, 1), (-1, -2), 0.5, BORDER_SUBTLE),
        ("LINEBELOW", (0, -1), (-1, -1), 1, BORDER),
        ("LINEBEFORE", (0, 0), (0, -1), 2, BORDER),
        ("LINEAFTER", (-1, 0), (-1, -1), 2, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]

    for i in range(1, len(table_data)):
        cmds.append(("BACKGROUND", (0, i), (-1, i), BG_CARD if i % 2 else BG_SURFACE))

    if highlight_last:
        cmds.extend([
            ("BACKGROUND", (0, -1), (-1, -1), BG_ELEVATED),
            ("LINEABOVE", (0, -1), (-1, -1), 2, accent),
            ("TEXTCOLOR", (0, -1), (-1, -1), TEXT_PRIMARY),
        ])

    t.setStyle(TableStyle(cmds))
    return t


S = {
    "body": ParagraphStyle("body", fontName="Inter", fontSize=9, leading=15, textColor=TEXT_SECONDARY, alignment=TA_JUSTIFY),
    "body_sm": ParagraphStyle("body_sm", fontName="Inter", fontSize=8, leading=13, textColor=TEXT_TERTIARY),
    "h3": ParagraphStyle("h3", fontName="Inter-SemiBold", fontSize=10.5, leading=14, textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=4),
    "label": ParagraphStyle("label", fontName="Mono-SemiBold", fontSize=8, textColor=INDIGO, spaceBefore=8, spaceAfter=4),
    "anchor": ParagraphStyle("anchor", fontName="Inter", fontSize=1, leading=1, textColor=BG_BASE),
}


def add_section(story, number: str, title: str, bookmark_id: str) -> None:
    story.append(Paragraph(f'<a name="{bookmark_id}"/>', S["anchor"]))
    story.append(SectionDivider(number, title, PW, bookmark_id=bookmark_id))


def build_pdf(output_path: Path) -> Path:
    register_fonts()
    doc = BaseDocTemplate(
        str(output_path),
        pagesize=letter,
        topMargin=54,
        bottomMargin=44,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
    )

    frame_cover = Frame(0, 0, W, H, id="cover_frame", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    frame_main = Frame(MARGIN, 44, PW, H - 98, id="main_frame")

    doc.addPageTemplates([
        PageTemplate(id="cover", frames=frame_cover, onPage=cover_page_bg),
        PageTemplate(id="content", frames=frame_main, onPage=dark_page_bg),
    ])

    sections = [
        ("01", "Project Snapshot", [
            "Client name / company",
            "Main contact + role",
            "Email / phone",
            "Business type / industry",
            "Current website",
            "Project name",
        ]),
        ("02", "What Are You Building?", [
            "Project type and primary goals",
            "Top 1-2 success outcomes",
            "Success metrics definition",
        ]),
        ("03", "Scope and Deliverables", [
            "Pages/workflows required for launch",
            "Auth, billing, integrations",
            "V1 launch scope vs phase 2",
        ]),
        ("04", "Audience and Positioning", [
            "Primary user and market type",
            "Pain point and alternatives",
            "Top competitor set",
        ]),
        ("05", "Brand and Visual Direction", [
            "Brand assets and personality",
            "Preferred communication tone",
            "Inspiration and anti-inspiration",
        ]),
        ("06", "Content and Assets", [
            "Copy readiness",
            "Logo/media/legal requirements",
        ]),
        ("07", "Technical Requirements", [
            "Preferred stack and architecture",
            "CMS, SEO, analytics, accessibility",
            "Compliance and performance constraints",
        ]),
        ("08", "Timeline and Budget", [
            "Launch target and milestones",
            "Budget range",
            "Feedback cycle availability",
        ]),
        ("09", "Team and Decisions", [
            "Stakeholders and approver",
            "Feedback rounds",
            "Communication cadence",
        ]),
        ("10", "Post-Launch Needs", [
            "Maintenance model",
            "Experimentation and CRO",
            "Roadmap support",
        ]),
        ("11", "Priorities", [
            "Rank visual polish, launch speed, conversion, usability, scalability",
        ]),
        ("12", "Final Open Question", [
            "Any critical context not covered above",
        ]),
    ]

    story = [Spacer(1, 1), NextPageTemplate("content"), PageBreak()]
    story.append(SectionDivider("", "Contents", PW))
    story.append(Spacer(1, 8))

    toc_num = ParagraphStyle("toc_n", fontName="Mono-Bold", fontSize=9, leading=20, textColor=INDIGO)
    toc_title = ParagraphStyle("toc_t", fontName="Inter-Medium", fontSize=9.5, leading=20, textColor=TEXT_SECONDARY)

    for number, title, _ in sections:
        target = f"sec{int(number)}"
        row = Table(
            [[
                Paragraph(f'<a href="#{target}" color="#6366F1">{number}</a>', toc_num),
                Paragraph(f'<a href="#{target}" color="#9CA3AF">{title}</a>', toc_title),
            ]],
            colWidths=[36, PW - 36],
        )
        row.setStyle(TableStyle([
            ("LINEBELOW", (0, 0), (-1, 0), 0.5, BORDER_SUBTLE),
            ("BACKGROUND", (0, 0), (-1, 0), BG_BASE),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        story.append(row)

    story.append(PageBreak())

    story.append(Paragraph("// EXECUTIVE SUMMARY", S["label"]))
    story.append(Paragraph(
        "Use this onboarding document to collect all design, product, technical, and delivery requirements before writing code or mockups.",
        S["body"],
    ))
    story.append(Spacer(1, 8))

    summary_table = dark_table(
        ["Area", "Why it matters", "Weight"],
        [
            ["Business outcomes", "Keeps build focused on measurable value", "High"],
            ["Product scope", "Prevents timeline and budget overruns", "High"],
            ["Brand direction", "Avoids redesign loops", "Medium"],
            ["Technical constraints", "Prevents architecture mismatch", "High"],
            ["Decision process", "Reduces blocked approvals", "Medium"],
            ["Total", "Single source of truth for kickoff", "100%"],
        ],
        col_widths=[145, 285, 90],
        highlight_last=True,
        accent=INDIGO,
    )
    story.append(summary_table)
    story.append(PageBreak())

    for number, title, bullets in sections:
        bm = f"sec{int(number)}"
        add_section(story, str(int(number)), title, bm)
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"// SECTION {number}", S["label"]))
        for bullet in bullets:
            story.append(Paragraph(f"- {bullet}", S["body"]))
        story.append(Spacer(1, 10))
        story.append(Paragraph("Capture clear, specific answers with examples wherever possible.", S["body_sm"]))
        story.append(PageBreak())

    doc.build(story)
    return output_path


if __name__ == "__main__":
    out = ROOT / "client_onboarding_dark_terminal.pdf"
    path = build_pdf(out)
    print(f"PDF generated: {path}")
