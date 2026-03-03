from __future__ import annotations

from datetime import date
from pathlib import Path
from urllib.request import urlretrieve

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
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
BORDER = HexColor("#2E2E35")
BORDER_SUBTLE = HexColor("#1F1F23")
RED = HexColor("#EF4444")
AMBER = HexColor("#F59E0B")
GREEN = HexColor("#22C55E")

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FONTS = ROOT / "fonts"


def register_fonts() -> None:
    FONTS.mkdir(parents=True, exist_ok=True)
    mappings = {
        "Inter": ("Inter-Regular.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf"),
        "Inter-Medium": ("Inter-Medium.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf"),
        "Inter-SemiBold": ("Inter-SemiBold.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf"),
        "Inter-Bold": ("Inter-Bold.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf"),
        "Inter-ExtraBold": ("Inter-ExtraBold.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.ttf"),
        "Mono": ("IBMPlexMono-Regular.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-400-normal.ttf"),
        "Mono-Medium": ("IBMPlexMono-Medium.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-500-normal.ttf"),
        "Mono-SemiBold": ("IBMPlexMono-SemiBold.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-600-normal.ttf"),
        "Mono-Bold": ("IBMPlexMono-Bold.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-700-normal.ttf"),
    }

    for alias, (filename, url) in mappings.items():
        path = FONTS / filename
        if not path.exists():
            urlretrieve(url, path)
        pdfmetrics.registerFont(TTFont(alias, str(path)))


def cover_bg(c, doc) -> None:
    c.saveState()
    c.setFillColor(BG_BASE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    c.setStrokeColor(HexColor("#0D0D10"))
    c.setLineWidth(0.5)
    for x in range(0, int(W) + 1, 40):
        c.line(x, 0, x, H)
    for y in range(0, int(H) + 1, 40):
        c.line(0, y, W, y)

    c.setStrokeColor(BORDER)
    c.setLineWidth(2)
    c.setFillColor(BG_CARD)
    c.rect(MARGIN - 4, H - 100, PW + 8, 60, fill=1, stroke=1)

    for i, col in enumerate([RED, AMBER, GREEN]):
        c.setFillColor(col)
        c.circle(MARGIN + 14 + i * 18, H - 70, 5, fill=1, stroke=0)

    c.setFillColor(TEXT_TERTIARY)
    c.setFont("Mono", 8)
    c.drawCentredString(W / 2, H - 74, "ltf1-client-suite - welcome-letter.pdf")

    y = H - 200
    c.setFillColor(INDIGO)
    c.setFont("Mono-Bold", 10)
    c.drawString(MARGIN, y + 30, "> cat welcome.md")

    c.setFillColor(TEXT_PRIMARY)
    c.setFont("Inter-ExtraBold", 44)
    c.drawString(MARGIN, y - 20, "Thank You")

    c.setFillColor(TEXT_TERTIARY)
    c.setFont("Mono-Medium", 11)
    c.drawString(MARGIN, y - 44, "Aansh Naidu - Co-Founder, LTF1 client suite")

    c.setFillColor(INDIGO_GLOW)
    c.setFont("Inter-SemiBold", 16)
    c.drawString(MARGIN, y - 72, "Before We Start: Project Kickoff Timeline")

    c.setFillColor(INDIGO)
    c.rect(MARGIN, y - 87, 80, 3, fill=1, stroke=0)

    c.setFillColor(HexColor("#000000"))
    c.rect(MARGIN + 4, 252, 420, 120, fill=1, stroke=0)
    c.setFillColor(BG_CARD)
    c.setStrokeColor(BORDER)
    c.setLineWidth(2)
    c.rect(MARGIN, 256, 420, 120, fill=1, stroke=1)

    c.setFillColor(TEXT_SECONDARY)
    c.setFont("Inter", 10)
    lines = [
        "Thank you for choosing LTF1 client suite.",
        "This letter explains how we run onboarding and when you can",
        "expect each milestone after questionnaire submission.",
    ]
    y_line = 340
    for line in lines:
        c.drawString(MARGIN + 14, y_line, line)
        y_line -= 20

    c.setFillColor(INDIGO)
    c.setFont("Mono-Bold", 9)
    c.drawString(MARGIN, 80, "DATE:")
    c.setFillColor(TEXT_SECONDARY)
    c.setFont("Mono", 9)
    c.drawString(MARGIN + 42, 80, str(date.today()))

    c.setFillColor(TEXT_MUTED)
    c.setFont("Mono", 7)
    c.drawString(MARGIN, 55, "CONFIDENTIAL - CLIENT COPY")
    c.restoreState()


def content_bg(c, doc) -> None:
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
    c.drawString(MARGIN, H - 22, "LTF1 client suite")
    c.setFillColor(TEXT_TERTIARY)
    c.setFont("Mono", 7)
    c.drawCentredString(W / 2, H - 22, "// CLIENT WELCOME LETTER")
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


def build_pdf(output_path: Path) -> Path:
    register_fonts()
    ASSETS.mkdir(parents=True, exist_ok=True)

    styles = {
        "label": ParagraphStyle("label", fontName="Mono-SemiBold", fontSize=8, textColor=INDIGO, spaceAfter=6),
        "h2": ParagraphStyle("h2", fontName="Inter-Bold", fontSize=16, leading=20, textColor=TEXT_PRIMARY, spaceAfter=8),
        "body": ParagraphStyle("body", fontName="Inter", fontSize=9, leading=15, textColor=TEXT_SECONDARY, spaceAfter=8),
        "caps": ParagraphStyle("caps", fontName="Mono-SemiBold", fontSize=8, textColor=TEXT_PRIMARY),
    }

    doc = BaseDocTemplate(
        str(output_path),
        pagesize=letter,
        topMargin=54,
        bottomMargin=44,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
    )

    frame_cover = Frame(0, 0, W, H, id="cover", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    frame_main = Frame(MARGIN, 44, PW, H - 98, id="main")
    doc.addPageTemplates([
        PageTemplate(id="cover_template", frames=frame_cover, onPage=cover_bg),
        PageTemplate(id="content_template", frames=frame_main, onPage=content_bg),
    ])

    story = [Spacer(1, 1), NextPageTemplate("content_template"), PageBreak()]

    story.append(Paragraph("// THANK YOU", styles["label"]))
    story.append(Paragraph("We are excited to build with you.", styles["h2"]))
    story.append(
        Paragraph(
            "Thank you for partnering with LTF1 client suite. We focus on clarity, speed, and high execution quality. This letter sets expectations so your team always knows what happens next.",
            styles["body"],
        )
    )

    story.append(Paragraph("// BEFORE WE START", styles["label"]))
    story.append(
        Paragraph(
            "Please complete the onboarding questionnaire in as much detail as possible. If any section is unclear, leave a note and we will finalize it with you during the kickoff call.",
            styles["body"],
        )
    )

    story.append(Paragraph("// KICKOFF TIMELINE", styles["label"]))
    timeline = Table(
        [
            [Paragraph("PHASE", styles["caps"]), Paragraph("WHEN", styles["caps"]), Paragraph("OUTPUT", styles["caps"])],
            ["Questionnaire submitted", "Day 0", "Intake data locked"],
            ["Scope confirmation", "Within 24 hours", "Project brief and assumptions"],
            ["Kickoff call", "Day 1-2", "Timeline, owners, communication cadence"],
            ["Initial concepts", "Day 3-5", "Design/system direction"],
            ["Build execution", "Post approval", "Milestone-based delivery"],
        ],
        colWidths=[130, 120, 282],
    )
    timeline.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BG_ELEVATED),
                ("BACKGROUND", (0, 1), (-1, -1), BG_CARD),
                ("LINEABOVE", (0, 0), (-1, 0), 2, BORDER),
                ("LINEBELOW", (0, 0), (-1, 0), 2, INDIGO),
                ("LINEBELOW", (0, 1), (-1, -1), 0.5, BORDER_SUBTLE),
                ("LINEBEFORE", (0, 0), (0, -1), 2, BORDER),
                ("LINEAFTER", (-1, 0), (-1, -1), 2, BORDER),
                ("TEXTCOLOR", (0, 0), (-1, 0), TEXT_PRIMARY),
                ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_SECONDARY),
                ("FONTNAME", (0, 1), (-1, -1), "Inter"),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(timeline)
    story.append(Spacer(1, 12))

    story.append(Paragraph("// COMMUNICATION", styles["label"]))
    story.append(
        Paragraph(
            "Primary communication runs through your preferred channel (email/Slack/WhatsApp). We share concise updates at each milestone and flag blockers early.",
            styles["body"],
        )
    )

    story.append(Paragraph("// SIGN-OFF", styles["label"]))
    story.append(Paragraph("Looking forward to building something exceptional together.", styles["body"]))
    story.append(Paragraph("Aansh Naidu - Co-Founder, LTF1 client suite", styles["body"]))

    doc.build(story)
    return output_path


if __name__ == "__main__":
    output = ASSETS / "ltf1_client_suite_welcome_letter.pdf"
    generated = build_pdf(output)
    print(f"PDF generated: {generated}")
