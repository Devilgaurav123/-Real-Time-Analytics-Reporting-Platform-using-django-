import os
from celery import shared_task
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw

from django.conf import settings
from django.core.files import File

from .models import ScheduledReport


@shared_task
def generate_dashboard_report(report_id):
    report = ScheduledReport.objects.get(id=report_id)

    dashboard_name = report.dashboard.name

    pdf_dir = os.path.join(
        settings.MEDIA_ROOT,
        "reports/pdfs"
    )

    png_dir = os.path.join(
        settings.MEDIA_ROOT,
        "reports/pngs"
    )

    os.makedirs(pdf_dir, exist_ok=True)
    os.makedirs(png_dir, exist_ok=True)

    # PDF Generation
    pdf_path = os.path.join(
        pdf_dir,
        f"report_{report.id}.pdf"
    )

    c = canvas.Canvas(pdf_path)
    c.drawString(
        100,
        750,
        f"Dashboard Report: {dashboard_name}"
    )
    c.drawString(
        100,
        700,
        f"Frequency: {report.frequency}"
    )
    c.save()

    # PNG Generation
    png_path = os.path.join(
        png_dir,
        f"report_{report.id}.png"
    )

    image = Image.new(
        "RGB",
        (800, 600),
        color="white"
    )

    draw = ImageDraw.Draw(image)

    draw.text(
        (100, 100),
        f"Dashboard: {dashboard_name}",
        fill="black"
    )

    image.save(png_path)

    # Save generated files
    with open(pdf_path, "rb") as pdf:
        report.pdf_file.save(
            f"report_{report.id}.pdf",
            File(pdf),
            save=False
        )

    with open(png_path, "rb") as png:
        report.png_file.save(
            f"report_{report.id}.png",
            File(png),
            save=False
        )

    report.report_status = "completed"
    report.save()

    return "Report Generated Successfully"