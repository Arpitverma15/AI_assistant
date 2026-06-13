import PDFDocument from "pdfkit";

const PAGE_MARGIN = 50;

export function buildFlashcardsPdf(documentName, flashcards) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN });

  doc.fontSize(18).font("Helvetica-Bold").text(`Flashcards: ${documentName}`, { align: "left" });
  doc.moveDown(1);

  flashcards.forEach((card, i) => {
    doc.fontSize(12).font("Helvetica-Bold").text(`Q${i + 1}. ${card.question}`);
    doc.moveDown(0.25);
    doc.fontSize(12).font("Helvetica").text(`A: ${card.answer}`);
    doc.moveDown(1);

    if (doc.y > doc.page.height - PAGE_MARGIN - 80 && i < flashcards.length - 1) {
      doc.addPage();
    }
  });

  return doc;
}

export function buildQuizPdf(documentName, questions) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN });
  const letters = ["A", "B", "C", "D"];

  doc.fontSize(18).font("Helvetica-Bold").text(`Quiz: ${documentName}`, { align: "left" });
  doc.moveDown(1);

  questions.forEach((q, i) => {
    doc.fontSize(12).font("Helvetica-Bold").text(`Q${i + 1}. ${q.question}`);
    doc.moveDown(0.25);

    q.options.forEach((opt, idx) => {
      doc.fontSize(11).font("Helvetica").text(`   ${letters[idx]}. ${opt}`);
    });

    doc.moveDown(0.25);
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(`Correct Answer: ${letters[q.correctIndex]}. ${q.options[q.correctIndex]}`);

    doc.moveDown(1);

    if (doc.y > doc.page.height - PAGE_MARGIN - 120 && i < questions.length - 1) {
      doc.addPage();
    }
  });

  return doc;
}
